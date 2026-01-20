/**
 * MFA TOTP Enable Edge Function
 *
 * Generates a TOTP secret and backup codes for the user.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://deno.land/x/otpauth@v9.1.4/dist/otpauth.esm.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if TOTP is already enabled
    const { data: existingMFA } = await supabase
      .from('mfa_factors')
      .select('id')
      .eq('user_id', user.id)
      .eq('factor_type', 'totp')
      .eq('status', 'verified')
      .single();

    if (existingMFA) {
      return new Response(
        JSON.stringify({ error: 'TOTP is already enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: 'TrustLayer',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;

    // Generate backup codes (8 codes, 8 characters each)
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = generateBackupCode();
      backupCodes.push(code);
    }

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(async (code) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(code);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      })
    );

    // Store TOTP secret (temporarily, until verified)
    await supabase.from('mfa_factors').insert({
      user_id: user.id,
      factor_type: 'totp',
      secret: secret,  // In production, encrypt this
      status: 'unverified',
      backup_codes: hashedBackupCodes,
    });

    // Generate QR code URL
    const qrCodeUrl = totp.toString();

    return new Response(
      JSON.stringify({
        secret,
        qrCodeUrl,
        backupCodes,  // Return plaintext codes only during setup
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('TOTP enable error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}
