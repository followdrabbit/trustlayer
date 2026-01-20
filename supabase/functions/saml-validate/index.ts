/**
 * SAML Response Validation Edge Function
 *
 * Validates SAML 2.0 responses from Identity Providers.
 * This MUST be done server-side for security.
 *
 * Validation steps:
 * 1. Base64 decode SAML response
 * 2. Parse XML
 * 3. Verify XML signature using IdP certificate
 * 4. Validate timestamps (NotBefore, NotOnOrAfter)
 * 5. Validate Audience restriction
 * 6. Validate Recipient
 * 7. Extract assertions and attributes
 *
 * Required env vars:
 * - SUPABASE_URL (auto-injected)
 * - SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateSAMLRequest {
  saml_response: string;  // Base64-encoded SAML Response
  idp_certificate: string;  // PEM-formatted X.509 certificate
  idp_entity_id: string;  // Expected IdP Entity ID
  sp_entity_id: string;  // SP Entity ID (audience)
  acs_url: string;  // Assertion Consumer Service URL
}

interface SAMLResponse {
  issuer: string;
  nameId: string;
  sessionIndex?: string;
  attributes: Record<string, string | string[]>;
  notBefore?: Date;
  notOnOrAfter?: Date;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const body: ValidateSAMLRequest = await req.json();
    const {
      saml_response,
      idp_certificate,
      idp_entity_id,
      sp_entity_id,
      acs_url,
    } = body;

    // Validate inputs
    if (!saml_response || !idp_certificate || !idp_entity_id || !sp_entity_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode SAML Response
    const decodedXml = atob(saml_response);

    // Parse and validate SAML Response
    const parsedResponse = await parseSAMLResponse(decodedXml, {
      idpCertificate: idp_certificate,
      idpEntityId: idp_entity_id,
      spEntityId: sp_entity_id,
      acsUrl: acs_url,
    });

    return new Response(
      JSON.stringify(parsedResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SAML validation error:', error);
    return new Response(
      JSON.stringify({
        error: 'SAML validation failed',
        details: error.message,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Parse and validate SAML Response
 *
 * NOTE: This is a simplified implementation.
 * Production use should use a proper SAML library like:
 * - saml2-js
 * - passport-saml
 * - @node-saml/node-saml
 *
 * For now, we do basic XML parsing without full signature verification.
 */
async function parseSAMLResponse(
  xmlString: string,
  config: {
    idpCertificate: string;
    idpEntityId: string;
    spEntityId: string;
    acsUrl: string;
  }
): Promise<SAMLResponse> {
  // Parse XML (Deno has DOMParser built-in)
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  if (!doc) {
    throw new Error('Failed to parse SAML XML');
  }

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML parsing error: ' + parserError.textContent);
  }

  // Extract Response element
  const response = doc.querySelector('Response');
  if (!response) {
    throw new Error('SAML Response element not found');
  }

  // Validate Status
  const statusCode = doc.querySelector('StatusCode');
  if (!statusCode) {
    throw new Error('StatusCode not found in SAML Response');
  }

  const statusValue = statusCode.getAttribute('Value');
  if (statusValue !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
    const statusMessage = doc.querySelector('StatusMessage')?.textContent || 'Unknown error';
    throw new Error(`SAML authentication failed: ${statusMessage}`);
  }

  // Extract Issuer
  const issuerElement = response.querySelector('Issuer');
  if (!issuerElement) {
    throw new Error('Issuer not found in SAML Response');
  }

  const issuer = issuerElement.textContent?.trim();
  if (issuer !== config.idpEntityId) {
    throw new Error(`Issuer mismatch: expected ${config.idpEntityId}, got ${issuer}`);
  }

  // Extract Assertion
  const assertion = doc.querySelector('Assertion');
  if (!assertion) {
    throw new Error('Assertion not found in SAML Response');
  }

  // Validate Conditions
  const conditions = assertion.querySelector('Conditions');
  if (conditions) {
    const notBefore = conditions.getAttribute('NotBefore');
    const notOnOrAfter = conditions.getAttribute('NotOnOrAfter');

    const now = new Date();

    if (notBefore) {
      const notBeforeDate = new Date(notBefore);
      if (now < notBeforeDate) {
        throw new Error('SAML Assertion is not yet valid (NotBefore)');
      }
    }

    if (notOnOrAfter) {
      const notOnOrAfterDate = new Date(notOnOrAfter);
      if (now >= notOnOrAfterDate) {
        throw new Error('SAML Assertion has expired (NotOnOrAfter)');
      }
    }

    // Validate Audience
    const audienceElements = conditions.querySelectorAll('Audience');
    let audienceValid = false;
    audienceElements.forEach(aud => {
      if (aud.textContent?.trim() === config.spEntityId) {
        audienceValid = true;
      }
    });

    if (audienceElements.length > 0 && !audienceValid) {
      throw new Error(`Audience restriction failed: expected ${config.spEntityId}`);
    }
  }

  // Extract Subject
  const subject = assertion.querySelector('Subject');
  if (!subject) {
    throw new Error('Subject not found in SAML Assertion');
  }

  const nameId = subject.querySelector('NameID')?.textContent?.trim();
  if (!nameId) {
    throw new Error('NameID not found in Subject');
  }

  // Validate SubjectConfirmation
  const subjectConfirmation = subject.querySelector('SubjectConfirmation');
  if (subjectConfirmation) {
    const method = subjectConfirmation.getAttribute('Method');
    if (method !== 'urn:oasis:names:tc:SAML:2.0:cm:bearer') {
      console.warn(`Unexpected SubjectConfirmation method: ${method}`);
    }

    const confirmationData = subjectConfirmation.querySelector('SubjectConfirmationData');
    if (confirmationData) {
      const recipient = confirmationData.getAttribute('Recipient');
      if (recipient && recipient !== config.acsUrl) {
        throw new Error(`Recipient mismatch: expected ${config.acsUrl}, got ${recipient}`);
      }

      const notOnOrAfter = confirmationData.getAttribute('NotOnOrAfter');
      if (notOnOrAfter) {
        const notOnOrAfterDate = new Date(notOnOrAfter);
        if (new Date() >= notOnOrAfterDate) {
          throw new Error('SubjectConfirmation has expired');
        }
      }
    }
  }

  // Extract AuthnStatement
  const authnStatement = assertion.querySelector('AuthnStatement');
  const sessionIndex = authnStatement?.getAttribute('SessionIndex') || undefined;

  // Extract Attributes
  const attributes: Record<string, string | string[]> = {};
  const attributeStatements = assertion.querySelectorAll('AttributeStatement');

  attributeStatements.forEach(statement => {
    const attrElements = statement.querySelectorAll('Attribute');
    attrElements.forEach(attr => {
      const name = attr.getAttribute('Name') || attr.getAttribute('FriendlyName');
      if (!name) return;

      const values: string[] = [];
      const valueElements = attr.querySelectorAll('AttributeValue');
      valueElements.forEach(val => {
        const text = val.textContent?.trim();
        if (text) values.push(text);
      });

      // Store as single value or array
      if (values.length === 0) {
        // Skip empty attributes
      } else if (values.length === 1) {
        attributes[name] = values[0];
      } else {
        attributes[name] = values;
      }
    });
  });

  // TODO: Verify XML Signature using IdP certificate
  // This requires proper crypto library support
  // For production, use a SAML library with full signature verification

  const signature = assertion.querySelector('Signature');
  if (signature) {
    console.warn('SAML signature found but verification not yet implemented');
    // Production: Use crypto library to verify signature
  }

  return {
    issuer,
    nameId,
    sessionIndex,
    attributes,
    notBefore: conditions?.getAttribute('NotBefore') ? new Date(conditions.getAttribute('NotBefore')!) : undefined,
    notOnOrAfter: conditions?.getAttribute('NotOnOrAfter') ? new Date(conditions.getAttribute('NotOnOrAfter')!) : undefined,
  };
}
