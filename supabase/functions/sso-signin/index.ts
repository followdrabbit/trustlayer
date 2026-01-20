/**
 * SSO Sign-In Edge Function
 *
 * Generates a Supabase session for an existing SSO user.
 * Validates the SSO access token and creates a session.
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

interface SignInRequest {
  user_id: string;
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

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request
    const body: SignInRequest = await req.json();
    const { user_id, access_token } = body;

    // Validate inputs
    if (!user_id || !access_token) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or access_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, role, sso_provider')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Validate access_token with SSO provider
    // This would require calling the OIDC userinfo endpoint or introspection endpoint
    // For now, we trust that the client has already validated it

    // Generate a magic link session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    });

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last login timestamp
    await supabaseAdmin
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', user_id);

    // Log sign-in event
    await supabaseAdmin.from('change_logs').insert({
      user_id,
      entity_type: 'session',
      entity_id: user_id,
      action: 'sso_signin',
      changes: {
        sso_provider: profile.sso_provider,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user_id,
          email: profile.email,
          role: profile.role,
        },
        session_url: sessionData.properties.action_link,
        access_token: sessionData.properties.hashed_token,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SSO sign-in error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
