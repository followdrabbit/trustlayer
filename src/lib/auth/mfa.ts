/**
 * Multi-Factor Authentication (MFA) Support
 *
 * Supports:
 * 1. TOTP (Time-based One-Time Password) - RFC 6238
 *    - Compatible with Google Authenticator, Microsoft Authenticator, Authy
 * 2. WebAuthn (Web Authentication API)
 *    - FIDO2 security keys (YubiKey, etc.)
 *    - Platform authenticators (TouchID, FaceID, Windows Hello)
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TOTP (Time-based One-Time Password)
// ============================================

export interface TOTPSetupResponse {
  secret: string;  // Base32-encoded secret
  qrCodeUrl: string;  // otpauth:// URL for QR code
  backupCodes: string[];  // One-time backup codes
}

export interface TOTPVerifyRequest {
  code: string;  // 6-digit code
}

/**
 * Enable TOTP for the current user
 */
export async function enableTOTP(): Promise<TOTPSetupResponse> {
  const response = await fetch('/functions/v1/mfa-totp-enable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to enable TOTP: ${error.error}`);
  }

  return response.json();
}

/**
 * Verify TOTP code and complete setup
 */
export async function verifyTOTPSetup(code: string): Promise<{ success: boolean }> {
  const response = await fetch('/functions/v1/mfa-totp-verify-setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to verify TOTP: ${error.error}`);
  }

  return response.json();
}

/**
 * Verify TOTP code during login
 */
export async function verifyTOTPLogin(code: string): Promise<{ session: any }> {
  const response = await fetch('/functions/v1/mfa-totp-verify-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to verify TOTP: ${error.error}`);
  }

  return response.json();
}

/**
 * Disable TOTP for the current user
 */
export async function disableTOTP(code: string): Promise<{ success: boolean }> {
  const response = await fetch('/functions/v1/mfa-totp-disable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to disable TOTP: ${error.error}`);
  }

  return response.json();
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(code: string): Promise<{ backupCodes: string[] }> {
  const response = await fetch('/functions/v1/mfa-backup-codes-regenerate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to regenerate backup codes: ${error.error}`);
  }

  return response.json();
}

/**
 * Use backup code for login
 */
export async function verifyBackupCode(code: string): Promise<{ session: any }> {
  const response = await fetch('/functions/v1/mfa-backup-code-verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to verify backup code: ${error.error}`);
  }

  return response.json();
}

// ============================================
// WebAuthn (FIDO2 / Passkeys)
// ============================================

export interface WebAuthnCredential {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
  transports: AuthenticatorTransport[];
}

/**
 * Check if WebAuthn is supported in this browser
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create &&
    navigator.credentials.get
  );
}

/**
 * Register a new WebAuthn credential
 */
export async function registerWebAuthn(
  credentialName: string
): Promise<WebAuthnCredential> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Step 1: Get registration options from server
  const optionsResponse = await fetch('/functions/v1/mfa-webauthn-register-begin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ name: credentialName }),
  });

  if (!optionsResponse.ok) {
    throw new Error('Failed to get WebAuthn registration options');
  }

  const options = await optionsResponse.json();

  // Step 2: Create credential using browser API
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: base64UrlDecode(options.challenge),
      rp: {
        name: options.rp.name,
        id: options.rp.id,
      },
      user: {
        id: base64UrlDecode(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams,
      authenticatorSelection: options.authenticatorSelection,
      timeout: options.timeout,
      attestation: options.attestation,
    },
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to create WebAuthn credential');
  }

  // Step 3: Send credential to server for verification
  const response = credential.response as AuthenticatorAttestationResponse;
  const verifyResponse = await fetch('/functions/v1/mfa-webauthn-register-complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      name: credentialName,
      id: credential.id,
      rawId: base64UrlEncode(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        clientDataJSON: base64UrlEncode(new Uint8Array(response.clientDataJSON)),
        attestationObject: base64UrlEncode(new Uint8Array(response.attestationObject)),
      },
    }),
  });

  if (!verifyResponse.ok) {
    throw new Error('Failed to verify WebAuthn credential');
  }

  return verifyResponse.json();
}

/**
 * Authenticate using WebAuthn
 */
export async function authenticateWebAuthn(): Promise<{ session: any }> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Step 1: Get authentication options from server
  const optionsResponse = await fetch('/functions/v1/mfa-webauthn-login-begin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!optionsResponse.ok) {
    throw new Error('Failed to get WebAuthn authentication options');
  }

  const options = await optionsResponse.json();

  // Step 2: Get credential using browser API
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: base64UrlDecode(options.challenge),
      timeout: options.timeout,
      rpId: options.rpId,
      allowCredentials: options.allowCredentials.map((c: any) => ({
        id: base64UrlDecode(c.id),
        type: c.type,
        transports: c.transports,
      })),
      userVerification: options.userVerification,
    },
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to get WebAuthn credential');
  }

  // Step 3: Send assertion to server for verification
  const response = credential.response as AuthenticatorAssertionResponse;
  const verifyResponse = await fetch('/functions/v1/mfa-webauthn-login-complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      id: credential.id,
      rawId: base64UrlEncode(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        clientDataJSON: base64UrlEncode(new Uint8Array(response.clientDataJSON)),
        authenticatorData: base64UrlEncode(new Uint8Array(response.authenticatorData)),
        signature: base64UrlEncode(new Uint8Array(response.signature)),
        userHandle: response.userHandle ? base64UrlEncode(new Uint8Array(response.userHandle)) : null,
      },
    }),
  });

  if (!verifyResponse.ok) {
    throw new Error('Failed to verify WebAuthn assertion');
  }

  return verifyResponse.json();
}

/**
 * List all WebAuthn credentials for the current user
 */
export async function listWebAuthnCredentials(): Promise<WebAuthnCredential[]> {
  const response = await fetch('/functions/v1/mfa-webauthn-list', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list WebAuthn credentials');
  }

  return response.json();
}

/**
 * Delete a WebAuthn credential
 */
export async function deleteWebAuthnCredential(credentialId: string): Promise<{ success: boolean }> {
  const response = await fetch('/functions/v1/mfa-webauthn-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ credential_id: credentialId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete WebAuthn credential');
  }

  return response.json();
}

// ============================================
// MFA Status
// ============================================

export interface MFAStatus {
  totpEnabled: boolean;
  webauthnEnabled: boolean;
  webauthnCredentials: number;
  backupCodesRemaining: number;
}

/**
 * Get MFA status for the current user
 */
export async function getMFAStatus(): Promise<MFAStatus> {
  const response = await fetch('/functions/v1/mfa-status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get MFA status');
  }

  return response.json();
}

// ============================================
// Utilities
// ============================================

function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate QR code data URL for TOTP
 */
export function generateTOTPQRCode(otpauthUrl: string): Promise<string> {
  // Use QRCode library (needs to be installed: npm install qrcode)
  // For now, return the otpauth URL
  return Promise.resolve(otpauthUrl);
}
