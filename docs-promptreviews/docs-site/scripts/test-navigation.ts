#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load PRODUCTION environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNavigation() {
  console.log('🔍 Fetching navigation from:', supabaseUrl);
  console.log('');

  const { data, error } = await supabase.rpc('get_navigation_tree');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Navigation fetched successfully!\n');
  console.log(JSON.stringify(data, null, 2));
}

testNavigation().catch(console.error);
