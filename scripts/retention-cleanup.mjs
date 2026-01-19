import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const apply = process.env.RETENTION_APPLY === 'true';

const policies = [
  { table: 'change_logs', column: 'created_at', env: 'RETENTION_CHANGE_LOGS_DAYS', dateOnly: false },
  { table: 'maturity_snapshots', column: 'snapshot_date', env: 'RETENTION_SNAPSHOTS_DAYS', dateOnly: true },
  { table: 'siem_metrics', column: 'timestamp', env: 'RETENTION_SIEM_METRICS_DAYS', dateOnly: false },
];

function parseDays(value) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function formatCutoff(days, dateOnly) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return dateOnly ? cutoff.toISOString().split('T')[0] : cutoff.toISOString();
}

async function runPolicy(client, policy, days) {
  const cutoff = formatCutoff(days, policy.dateOnly);
  const { count, error } = await client
    .from(policy.table)
    .select('id', { count: 'exact', head: true })
    .lt(policy.column, cutoff);

  if (error) {
    console.error(`[${policy.table}] count failed:`, error.message);
    return;
  }

  const total = count || 0;
  if (total === 0) {
    console.log(`[${policy.table}] no rows older than ${cutoff}.`);
    return;
  }

  if (!apply) {
    console.log(`[${policy.table}] would delete ${total} rows older than ${cutoff}.`);
    return;
  }

  const { count: deleted, error: deleteError } = await client
    .from(policy.table)
    .delete({ count: 'exact' })
    .lt(policy.column, cutoff);

  if (deleteError) {
    console.error(`[${policy.table}] delete failed:`, deleteError.message);
    return;
  }

  console.log(`[${policy.table}] deleted ${deleted || 0} rows older than ${cutoff}.`);
}

async function run() {
  console.log(`Retention cleanup ${apply ? 'APPLY' : 'DRY RUN'}`);

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  for (const policy of policies) {
    const days = parseDays(process.env[policy.env]);
    if (!days) {
      continue;
    }
    await runPolicy(client, policy, days);
  }
}

run().catch((error) => {
  console.error('Retention cleanup failed:', error);
  process.exit(1);
});
