import { createClient } from '@supabase/supabase-js';

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_DISPLAY_NAME,
  ADMIN_FORCE_RESET,
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const email = ADMIN_EMAIL.toLowerCase();
const displayName = ADMIN_DISPLAY_NAME || ADMIN_EMAIL;
const forceReset = ADMIN_FORCE_RESET === '1';

const listResponse = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});

if (listResponse.error) {
  console.error(`Failed to list users: ${listResponse.error.message}`);
  process.exit(1);
}

let user = listResponse.data.users.find((item) => item.email?.toLowerCase() === email);

if (!user) {
  const createResponse = await supabase.auth.admin.createUser({
    email,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  });

  if (createResponse.error) {
    console.error(`Failed to create admin user: ${createResponse.error.message}`);
    process.exit(1);
  }

  user = createResponse.data.user;
  console.log('Admin user created.');
} else if (forceReset) {
  const updateResponse = await supabase.auth.admin.updateUserById(user.id, {
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      ...user.user_metadata,
      display_name: user.user_metadata?.display_name || displayName,
    },
  });

  if (updateResponse.error) {
    console.error(`Failed to update admin user: ${updateResponse.error.message}`);
    process.exit(1);
  }

  user = updateResponse.data.user;
  console.log('Admin user updated.');
} else {
  console.log('Admin user already exists.');
}

if (!user) {
  console.error('No admin user available after provisioning.');
  process.exit(1);
}

const profilePayload = {
  user_id: user.id,
  email: user.email,
  display_name: user.user_metadata?.display_name || displayName,
  role: 'admin',
};

const profileResponse = await supabase
  .from('profiles')
  .upsert(profilePayload, { onConflict: 'user_id' });

if (profileResponse.error) {
  console.error(`Failed to upsert profile: ${profileResponse.error.message}`);
  process.exit(1);
}

console.log('Admin profile ensured.');
