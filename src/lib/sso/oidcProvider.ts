/**
 * OIDC (OpenID Connect) Provider Integration
 * Supports: Keycloak, Okta, Azure AD (EntraID), Google Workspace, Auth0
 */

import { supabase } from '@/integrations/supabase/client';

export interface OIDCConfig {
  provider: 'keycloak' | 'okta' | 'azure' | 'google' | 'auth0' | 'custom';
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;  // Optional for public clients (PKCE)
  redirectUri: string;
  scopes?: string[];
  pkceEnabled?: boolean;

  // Optional mapping configuration
  claimMapping?: {
    email?: string;
    name?: string;
    groups?: string;
    roles?: string;
  };

  // Role mapping: OIDC group/role -> TrustLayer role
  roleMapping?: Record<string, 'admin' | 'manager' | 'analyst' | 'viewer'>;
}

export interface OIDCUser {
  sub: string;  // Subject (unique identifier)
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  groups?: string[];
  roles?: string[];
  [key: string]: any;  // Additional claims
}

/**
 * Initialize OIDC authentication flow
 */
export async function initiateOIDCLogin(config: OIDCConfig): Promise<void> {
  try {
    const { provider, issuerUrl, clientId, redirectUri, scopes, pkceEnabled } = config;

    // Default scopes
    const defaultScopes = ['openid', 'email', 'profile'];
    const requestedScopes = scopes || defaultScopes;

    // Build authorization URL
    const authUrl = new URL(`${issuerUrl}/protocol/openid-connect/auth`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', requestedScopes.join(' '));
    authUrl.searchParams.set('state', generateState());

    // PKCE support
    if (pkceEnabled !== false) {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      // Store verifier in sessionStorage
      sessionStorage.setItem('oidc_code_verifier', codeVerifier);
    }

    // Store config for callback
    sessionStorage.setItem('oidc_config', JSON.stringify(config));
    sessionStorage.setItem('oidc_state', authUrl.searchParams.get('state')!);

    // Redirect to OIDC provider
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('OIDC login initiation failed:', error);
    throw new Error('Failed to initiate OIDC login');
  }
}

/**
 * Handle OIDC callback and complete authentication
 */
export async function handleOIDCCallback(): Promise<{ user: OIDCUser; session: any }> {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      throw new Error(`OIDC error: ${error} - ${urlParams.get('error_description')}`);
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Verify state
    const storedState = sessionStorage.getItem('oidc_state');
    if (state !== storedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Retrieve stored config
    const configStr = sessionStorage.getItem('oidc_config');
    if (!configStr) {
      throw new Error('OIDC configuration not found');
    }
    const config: OIDCConfig = JSON.parse(configStr);

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, config);

    // Decode and validate ID token
    const idToken = decodeJWT(tokens.id_token);
    const user = await validateAndMapUser(idToken, config);

    // Just-in-time provisioning: create or update user in Supabase
    const session = await provisionUserJIT(user, tokens, config);

    // Cleanup
    sessionStorage.removeItem('oidc_code_verifier');
    sessionStorage.removeItem('oidc_state');
    sessionStorage.removeItem('oidc_config');

    return { user, session };
  } catch (error) {
    console.error('OIDC callback handling failed:', error);
    throw error;
  }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code: string, config: OIDCConfig): Promise<any> {
  const { issuerUrl, clientId, clientSecret, redirectUri, pkceEnabled } = config;

  const tokenUrl = `${issuerUrl}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  // Add client secret if available (confidential client)
  if (clientSecret) {
    body.set('client_secret', clientSecret);
  }

  // Add PKCE verifier if enabled
  if (pkceEnabled !== false) {
    const codeVerifier = sessionStorage.getItem('oidc_code_verifier');
    if (codeVerifier) {
      body.set('code_verifier', codeVerifier);
    }
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
  }

  return response.json();
}

/**
 * Validate ID token and map claims to user object
 */
async function validateAndMapUser(idToken: any, config: OIDCConfig): Promise<OIDCUser> {
  const { claimMapping = {} } = config;

  // Extract standard claims with custom mapping
  const user: OIDCUser = {
    sub: idToken.sub,
    email: idToken[claimMapping.email || 'email'],
    name: idToken[claimMapping.name || 'name'],
    given_name: idToken.given_name,
    family_name: idToken.family_name,
    groups: idToken[claimMapping.groups || 'groups'] || [],
    roles: idToken[claimMapping.roles || 'roles'] || [],
  };

  // Validate required claims
  if (!user.email) {
    throw new Error('Email claim is required but not present in ID token');
  }

  return user;
}

/**
 * Just-in-time user provisioning
 */
async function provisionUserJIT(user: OIDCUser, tokens: any, config: OIDCConfig): Promise<any> {
  // Map OIDC groups/roles to TrustLayer role
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
        display_name: user.name,
        // Role can only be updated via service role (trigger prevents direct updates)
        sso_provider: config.provider,
        sso_subject: user.sub,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingUser.user_id);

    // Sign in with custom token (requires Edge Function)
    return await signInWithCustomToken(existingUser.user_id, tokens.access_token);
  } else {
    // Create new user (requires Edge Function with service role)
    return await createUserViaEdgeFunction(user, role, tokens, config);
  }
}

/**
 * Map OIDC groups/roles to TrustLayer role
 */
function mapUserRole(user: OIDCUser, config: OIDCConfig): 'admin' | 'manager' | 'analyst' | 'viewer' {
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

/**
 * Sign in with custom token via Edge Function
 */
async function signInWithCustomToken(userId: string, accessToken: string): Promise<any> {
  const response = await fetch('/functions/v1/sso-signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, access_token: accessToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to sign in with custom token');
  }

  return response.json();
}

/**
 * Create user via Edge Function (requires service role)
 */
async function createUserViaEdgeFunction(
  user: OIDCUser,
  role: string,
  tokens: any,
  config: OIDCConfig
): Promise<any> {
  const response = await fetch('/functions/v1/sso-provision-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      display_name: user.name,
      role,
      sso_provider: config.provider,
      sso_subject: user.sub,
      access_token: tokens.access_token,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to provision user');
  }

  return response.json();
}

// ============================================
// PKCE Utilities
// ============================================

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ============================================
// JWT Utilities
// ============================================

function decodeJWT(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}
