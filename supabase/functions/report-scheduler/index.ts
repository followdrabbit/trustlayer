/**
 * Report Scheduler Edge Function
 * Runs periodically to execute scheduled reports
 * Trigger: Cron job (every 5 minutes)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportSchedule {
  id: string;
  organization_id: string;
  template_id: string;
  name: string;
  cron_expression: string;
  timezone: string;
  enabled: boolean;
  filters: Record<string, any>;
  output_formats: string[];
  recipients: string[];
  cc?: string[];
  subject_template?: string;
  body_template?: string;
  next_run_at: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🕐 Report Scheduler: Checking for due schedules...');

    // Find all enabled schedules that are due to run
    const now = new Date().toISOString();

    const { data: dueSchedules, error: fetchError } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('enabled', true)
      .lte('next_run_at', now)
      .order('next_run_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch schedules: ${fetchError.message}`);
    }

    console.log(`📋 Found ${dueSchedules?.length || 0} schedules to execute`);

    if (!dueSchedules || dueSchedules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No schedules due to run',
          executed: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const results = [];

    // Execute each schedule
    for (const schedule of dueSchedules as ReportSchedule[]) {
      try {
        console.log(`▶️ Executing schedule: ${schedule.name} (${schedule.id})`);

        // Create report run record
        const { data: run, error: createRunError } = await supabase
          .from('report_runs')
          .insert({
            organization_id: schedule.organization_id,
            schedule_id: schedule.id,
            template_id: schedule.template_id,
            status: 'pending',
            filters_used: schedule.filters,
          })
          .select()
          .single();

        if (createRunError) {
          throw new Error(`Failed to create run: ${createRunError.message}`);
        }

        console.log(`📝 Created run: ${run.id}`);

        // Trigger report generation (async)
        await triggerReportGeneration(run.id, schedule);

        // Calculate next run time (simple: add 1 day for now)
        // TODO: Implement proper cron parsing
        const nextRun = new Date();
        nextRun.setDate(nextRun.getDate() + 1);

        // Update schedule with last run info and next run time
        const { error: updateError } = await supabase
          .from('report_schedules')
          .update({
            last_run_at: now,
            last_run_status: 'running',
            next_run_at: nextRun.toISOString(),
            run_count: schedule.run_count + 1,
            updated_at: now,
          })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`Failed to update schedule: ${updateError.message}`);
        }

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          run_id: run.id,
          status: 'triggered',
        });

        console.log(`✅ Schedule executed successfully`);
      } catch (error) {
        console.error(`❌ Failed to execute schedule ${schedule.id}:`, error);

        // Update schedule with error status
        await supabase
          .from('report_schedules')
          .update({
            last_run_at: now,
            last_run_status: 'failed',
            updated_at: now,
          })
          .eq('id', schedule.id);

        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Executed ${results.length} schedules`,
        executed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Scheduler error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Trigger report generation (call report-generator function)
 */
async function triggerReportGeneration(
  runId: string,
  schedule: ReportSchedule
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Call report-generator edge function
  const response = await fetch(`${supabaseUrl}/functions/v1/report-generator`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      run_id: runId,
      template_id: schedule.template_id,
      filters: schedule.filters,
      formats: schedule.output_formats,
      recipients: schedule.recipients,
      cc: schedule.cc,
      subject: schedule.subject_template,
      body: schedule.body_template,
    }),
  });

  if (!response.ok) {
    throw new Error(`Report generation failed: ${response.statusText}`);
  }

  console.log(`📊 Report generation triggered for run ${runId}`);
}
