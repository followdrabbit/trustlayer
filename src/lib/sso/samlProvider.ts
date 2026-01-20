/**
 * SAML 2.0 Provider Integration
 * Supports: Azure AD SAML, Okta SAML, OneLogin, PingIdentity, ADFS
 *
 * SAML Flow:
 * 1. User clicks "Sign in with SAML"
 * 2. SP (TrustLayer) generates SAML AuthnRequest
 * 3. User redirected to IdP with AuthnRequest
 * 4. IdP authenticates user and generates SAML Response
 * 5. IdP POSTs SAML Response to SP ACS URL
 * 6. SP validates SAML Response and creates session
 */

import { supabase } from '@/integrations/supabase/client';

export interface SAMLConfig {
  provider: 'azure-saml' | 'okta-saml' | 'onelogin' | 'ping' | 'adfs' | 'custom-saml';

  // IdP Configuration
  idpEntityId: string;  // IdP Entity ID (Issuer)
  idpSsoUrl: string;    // IdP Single Sign-On URL
  idpCertificate: string;  // IdP X.509 certificate (PEM format)

  // SP Configuration
  spEntityId: string;   // SP Entity ID (usually app URL)
  acsUrl: string;       // Assertion Consumer Service URL (callback)

  // Optional settings
  nameIdFormat?: 'email' | 'persistent' | 'transient';
  wantAssertionsSigned?: boolean;
  wantResponseSigned?: boolean;
  signAuthnRequest?: boolean;

  // SP Certificate (required if signing enabled)
  spCertificate?: string;
  spPrivateKey?: string;

  // Attribute mapping
  attributeMapping?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    groups?: string;
    roles?: string;
  };

  // Role mapping: SAML attribute value -> TrustLayer role
  roleMapping?: Record<string, 'admin' | 'manager' | 'analyst' | 'viewer'>;
}

export interface SAMLUser {
  nameId: string;  // SAML NameID (unique identifier)
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  roles?: string[];
  attributes: Record<string, string | string[]>;  // All SAML attributes
}

export interface SAMLResponse {
  issuer: string;
  nameId: string;
  sessionIndex?: string;
  attributes: Record<string, string | string[]>;
  notBefore?: Date;
  notOnOrAfter?: Date;
}

/**
 * Initialize SAML authentication flow (SP-initiated)
 */
export async function initiateSAMLLogin(config: SAMLConfig): Promise<void> {
  try {
    const { idpSsoUrl, spEntityId, acsUrl, nameIdFormat, signAuthnRequest } = config;

    // Generate SAML AuthnRequest
    const authnRequest = await generateAuthnRequest({
      issuer: spEntityId,
      acsUrl,
      idpSsoUrl,
      nameIdFormat: nameIdFormat || 'email',
      signRequest: signAuthnRequest || false,
      spPrivateKey: config.spPrivateKey,
    });

    // Generate relay state for CSRF protection
    const relayState = generateRelayState();

    // Store config for callback
    sessionStorage.setItem('saml_config', JSON.stringify(config));
    sessionStorage.setItem('saml_relay_state', relayState);

    // Redirect to IdP with SAML Request
    const redirectUrl = buildIdPRedirectUrl(idpSsoUrl, authnRequest, relayState);
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('SAML login initiation failed:', error);
    throw new Error('Failed to initiate SAML login');
  }
}

/**
 * Handle SAML callback (ACS endpoint)
 */
export async function handleSAMLCallback(
  samlResponse: string,
  relayState?: string
): Promise<{ user: SAMLUser; session: any }> {
  try {
    // Verify relay state
    const storedRelayState = sessionStorage.getItem('saml_relay_state');
    if (relayState && relayState !== storedRelayState) {
      throw new Error('RelayState mismatch - possible CSRF attack');
    }

    // Retrieve stored config
    const configStr = sessionStorage.getItem('saml_config');
    if (!configStr) {
      throw new Error('SAML configuration not found');
    }
    const config: SAMLConfig = JSON.parse(configStr);

    // Validate and parse SAML Response (via Edge Function)
    const parsedResponse = await validateSAMLResponse(samlResponse, config);

    // Map SAML attributes to user object
    const user = mapSAMLAttributesToUser(parsedResponse, config);

    // Just-in-time provisioning: create or update user in Supabase
    const session = await provisionUserJIT(user, config);

    // Cleanup
    sessionStorage.removeItem('saml_relay_state');
    sessionStorage.removeItem('saml_config');

    return { user, session };
  } catch (error) {
    console.error('SAML callback handling failed:', error);
    throw error;
  }
}

/**
 * Initiate SAML logout (SP-initiated)
 */
export async function initiateSAMLLogout(
  config: SAMLConfig,
  nameId: string,
  sessionIndex?: string
): Promise<void> {
  try {
    // For SAML logout, we need IdP SLO URL (not always available)
    // If not available, just clear local session

    // Clear Supabase session
    await supabase.auth.signOut();

    // TODO: Send SAML LogoutRequest to IdP if SLO URL is configured
    // This requires IdP SLO URL configuration

    console.log('SAML logout completed');
  } catch (error) {
    console.error('SAML logout failed:', error);
    throw error;
  }
}

// ============================================
// SAML Request Generation
// ============================================

interface AuthnRequestParams {
  issuer: string;
  acsUrl: string;
  idpSsoUrl: string;
  nameIdFormat: string;
  signRequest: boolean;
  spPrivateKey?: string;
}

async function generateAuthnRequest(params: AuthnRequestParams): Promise<string> {
  const { issuer, acsUrl, nameIdFormat, signRequest } = params;

  // Generate unique ID
  const requestId = `_${generateRandomId()}`;
  const timestamp = new Date().toISOString();

  // Build SAML AuthnRequest XML
  let authnRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${timestamp}"
  Destination="${params.idpSsoUrl}"
  AssertionConsumerServiceURL="${acsUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${issuer}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:${nameIdFormat}"
    AllowCreate="true"/>
  <samlp:RequestedAuthnContext Comparison="exact">
    <saml:AuthnContextClassRef>
      urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
    </saml:AuthnContextClassRef>
  </samlp:RequestedAuthnContext>
</samlp:AuthnRequest>`;

  // Sign request if required (would need crypto library)
  if (signRequest && params.spPrivateKey) {
    // TODO: Implement XML signature using xmldsig
    console.warn('SAML request signing not yet implemented');
  }

  // Base64 encode and deflate (for HTTP-Redirect binding)
  const encoded = btoa(authnRequest);
  return encoded;
}

function buildIdPRedirectUrl(
  idpSsoUrl: string,
  authnRequest: string,
  relayState: string
): string {
  const url = new URL(idpSsoUrl);
  url.searchParams.set('SAMLRequest', authnRequest);
  url.searchParams.set('RelayState', relayState);
  return url.toString();
}

// ============================================
// SAML Response Validation
// ============================================

async function validateSAMLResponse(
  samlResponse: string,
  config: SAMLConfig
): Promise<SAMLResponse> {
  // SAML Response validation is complex and security-critical
  // Should be done server-side in Edge Function with proper XML parsing

  const response = await fetch('/functions/v1/saml-validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      saml_response: samlResponse,
      idp_certificate: config.idpCertificate,
      idp_entity_id: config.idpEntityId,
      sp_entity_id: config.spEntityId,
      acs_url: config.acsUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`SAML validation failed: ${error.error}`);
  }

  return response.json();
}

// ============================================
// User Mapping
// ============================================

function mapSAMLAttributesToUser(
  samlResponse: SAMLResponse,
  config: SAMLConfig
): SAMLUser {
  const { attributeMapping = {} } = config;
  const attrs = samlResponse.attributes;

  // Extract attributes with custom mapping
  const user: SAMLUser = {
    nameId: samlResponse.nameId,
    email: getAttributeValue(attrs, attributeMapping.email || 'email') as string,
    firstName: getAttributeValue(attrs, attributeMapping.firstName || 'firstName') as string,
    lastName: getAttributeValue(attrs, attributeMapping.lastName || 'lastName') as string,
    displayName: getAttributeValue(attrs, attributeMapping.displayName || 'displayName') as string,
    groups: getAttributeValues(attrs, attributeMapping.groups || 'groups'),
    roles: getAttributeValues(attrs, attributeMapping.roles || 'roles'),
    attributes: attrs,
  };

  // Validate required attributes
  if (!user.email) {
    throw new Error('Email attribute is required but not present in SAML response');
  }

  return user;
}

function getAttributeValue(
  attributes: Record<string, string | string[]>,
  key: string
): string | undefined {
  const value = attributes[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getAttributeValues(
  attributes: Record<string, string | string[]>,
  key: string
): string[] {
  const value = attributes[key];
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

// ============================================
// Just-in-time User Provisioning
// ============================================

async function provisionUserJIT(user: SAMLUser, config: SAMLConfig): Promise<any> {
  // Map SAML groups/roles to TrustLayer role
  const role = mapUserRole(user, config);

  // Check if user exists in Supabase
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id, user_id, role')
    .eq('email', user.email)
    .single();

  if (existingUser) {
    // Update existing user
    await supabase
      .from('profiles')
      .update({
        display_name: user.displayName || `${user.firstName} ${user.lastName}`.trim(),
        sso_provider: config.provider,
        sso_subject: user.nameId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingUser.user_id);

    // Sign in with custom token (requires Edge Function)
    return await signInWithSAML(existingUser.user_id, user.nameId);
  } else {
    // Create new user (requires Edge Function with service role)
    return await createUserViaSAML(user, role, config);
  }
}

function mapUserRole(user: SAMLUser, config: SAMLConfig): 'admin' | 'manager' | 'analyst' | 'viewer' {
  const { roleMapping = {} } = config;

  // Check groups
  if (user.groups) {
    for (const group of user.groups) {
      if (roleMapping[group]) {
        return roleMapping[group];
      }
    }
  }

  // Check roles
  if (user.roles) {
    for (const role of user.roles) {
      if (roleMapping[role]) {
        return roleMapping[role];
      }
    }
  }

  // Default role
  return 'viewer';
}

async function signInWithSAML(userId: string, nameId: string): Promise<any> {
  const response = await fetch('/functions/v1/sso-signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      access_token: nameId  // Use nameId as token for SAML
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to sign in with SAML');
  }

  return response.json();
}

async function createUserViaSAML(
  user: SAMLUser,
  role: string,
  config: SAMLConfig
): Promise<any> {
  const response = await fetch('/functions/v1/sso-provision-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      display_name: user.displayName || `${user.firstName} ${user.lastName}`.trim(),
      role,
      sso_provider: config.provider,
      sso_subject: user.nameId,
      access_token: user.nameId,  // Use nameId as token for SAML
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to provision user via SAML');
  }

  return response.json();
}

// ============================================
// SAML Metadata Generation (for IdP configuration)
// ============================================

export function generateSPMetadata(config: SAMLConfig): string {
  const { spEntityId, acsUrl, spCertificate, wantAssertionsSigned = true } = config;

  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor
  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${spEntityId}">
  <md:SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="${wantAssertionsSigned}"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    ${spCertificate ? `
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${spCertificate.replace(/-----BEGIN CERTIFICATE-----\n?/, '').replace(/\n?-----END CERTIFICATE-----/, '').replace(/\n/g, '')}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>` : ''}
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="0"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

  return metadata;
}

// ============================================
// Utilities
// ============================================

function generateRelayState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateRandomId(): string {
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
