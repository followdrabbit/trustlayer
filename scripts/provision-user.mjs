import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'USER_EMAIL', 'USER_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  USER_EMAIL,
  USER_PASSWORD,
  USER_DISPLAY_NAME,
  USER_ROLE,
  USER_FORCE_RESET,
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const email = USER_EMAIL.toLowerCase();
const displayName = USER_DISPLAY_NAME || USER_EMAIL;
const role = (USER_ROLE || 'user').toLowerCase();
const forceReset = USER_FORCE_RESET === '1';

if (!['user', 'admin', 'manager', 'analyst', 'viewer'].includes(role)) {
  console.error('USER_ROLE must be "user", "admin", "manager", "analyst", or "viewer".');
  process.exit(1);
}

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
    password: USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  });

  if (createResponse.error) {
    console.error(`Failed to create user: ${createResponse.error.message}`);
    process.exit(1);
  }

  user = createResponse.data.user;
  console.log('User created.');
} else if (forceReset) {
  const updateResponse = await supabase.auth.admin.updateUserById(user.id, {
    password: USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      ...user.user_metadata,
      display_name: user.user_metadata?.display_name || displayName,
    },
  });

  if (updateResponse.error) {
    console.error(`Failed to update user: ${updateResponse.error.message}`);
    process.exit(1);
  }

  user = updateResponse.data.user;
  console.log('User updated.');
} else {
  console.log('User already exists.');
}

if (!user) {
  console.error('No user available after provisioning.');
  process.exit(1);
}

const profilePayload = {
  user_id: user.id,
  email: user.email,
  display_name: user.user_metadata?.display_name || displayName,
  role,
};

const profileResponse = await supabase
  .from('profiles')
  .upsert(profilePayload, { onConflict: 'user_id' });

if (profileResponse.error) {
  console.error(`Failed to upsert profile: ${profileResponse.error.message}`);
  process.exit(1);
}

console.log('User profile ensured.');
