/**
 * SSO User Provisioning Edge Function
 *
 * Just-in-time (JIT) user provisioning for SSO authentication.
 * Creates new users via service role when they don't exist.
 *
 * Required env vars:
 * - SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 * - SUPABASE_URL (auto-injected)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProvisionUserRequest {
  email: string;
  display_name?: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  sso_provider: string;
  sso_subject: string;
  access_token: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request
    const body: ProvisionUserRequest = await req.json();
    const { email, display_name, role, sso_provider, sso_subject, access_token } = body;

    // Validate inputs
    if (!email || !role || !sso_provider || !sso_subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'analyst', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, email')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'User already exists', user_id: existingProfile.user_id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure random password (user won't use it)
    const randomPassword = generateRandomPassword();

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,  // Auto-confirm for SSO users
      user_metadata: {
        display_name,
        sso_provider,
        sso_subject,
      },
    });

    if (authError || !authUser.user) {
      console.error('Failed to create auth user:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: authError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create profile with role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        email,
        display_name,
        role,
        sso_provider,
        sso_subject,
        language: 'pt-BR',  // Default language
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);

      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);

      return new Response(
        JSON.stringify({ error: 'Failed to create profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session for the new user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'User created but session generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log provisioning event
    await supabaseAdmin.from('change_logs').insert({
      user_id: authUser.user.id,
      entity_type: 'user',
      entity_id: authUser.user.id,
      action: 'sso_provision',
      changes: {
        email,
        role,
        sso_provider,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({
        user: {
          id: authUser.user.id,
          email,
          role,
        },
        session_url: sessionData.properties.action_link,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SSO provision error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateRandomPassword(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}
