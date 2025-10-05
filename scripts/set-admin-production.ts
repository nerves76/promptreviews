#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function setAdminFlag() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('accounts')
    .update({ is_admin: true })
    .eq('email', 'chris@diviner.agency')
    .select('id, email, is_admin');

  if (error) {
    console.error('Error setting admin flag:', error);
    process.exit(1);
  }

  console.log('✅ Admin flag set successfully:');
  console.log(data);
}

setAdminFlag();
