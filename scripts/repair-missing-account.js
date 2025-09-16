#!/usr/bin/env node

/**
 * Repair Missing Account Records
 * 
 * This script finds users who exist in Supabase Auth but are missing
 * corresponding account records, and creates them.
 */

const { createClient } = require('@supabase/supabase-js');

async function repairMissingAccount() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🔧 Starting account repair process...');

  try {
    // Get the specific user ID from command line or use default
    const targetUserId = process.argv[2] || '605d0eb8-c410-4fb6-93b9-b9ad6da20540';
    
    console.log(`🔍 Checking user: ${targetUserId}`);

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(targetUserId);
    
    if (authError || !authUser.user) {
      console.error('❌ User not found in auth.users:', authError?.message || 'User does not exist');
      process.exit(1);
    }

    console.log('✅ User found in auth.users:', authUser.user.email);

    // Check if account exists
    const { data: existingAccount, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (accountError && accountError.code !== 'PGRST116') {
      console.error('❌ Error checking existing account:', accountError);
      process.exit(1);
    }

    if (existingAccount) {
      console.log('✅ Account already exists for user');
      console.log('🔍 Checking account_users link...');
      
      // Check account_users link
      const { data: accountUser, error: linkError } = await supabase
        .from('account_users')
        .select('account_id, role')
        .eq('user_id', targetUserId)
        .eq('account_id', existingAccount.id)
        .maybeSingle();

      if (linkError && linkError.code !== 'PGRST116') {
        console.error('❌ Error checking account_users link:', linkError);
        process.exit(1);
      }

      if (!accountUser) {
        console.log('🔧 Creating missing account_users link...');
        const { error: createLinkError } = await supabase
          .from('account_users')
          .insert({
            account_id: existingAccount.id,
            user_id: targetUserId,
            role: 'owner'
          });

        if (createLinkError) {
          console.error('❌ Error creating account_users link:', createLinkError);
          process.exit(1);
        }

        console.log('✅ Account_users link created successfully');
      } else {
        console.log('✅ Account_users link already exists');
      }

      console.log('✅ Account repair completed - no account creation needed');
      return;
    }

    console.log('🆕 Creating missing account record...');

    // Get user metadata
    const user = authUser.user;
    const email = user.email;
    const firstName = user.user_metadata?.first_name || email?.split('@')[0] || '';
    const lastName = user.user_metadata?.last_name || '';

    // Create account record
    const accountData = {
      id: targetUserId,
      user_id: targetUserId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      plan: 'grower', // Default trial plan
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      is_free_account: false,
      custom_prompt_page_count: 0,
      contact_count: 0,
      has_had_paid_plan: false,
      review_notifications_enabled: true,
      created_at: user.created_at || new Date().toISOString()
    };

    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert(accountData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating account:', createError);
      process.exit(1);
    }

    console.log('✅ Account created successfully:', newAccount.id);

    // Create account_users link
    console.log('🔗 Creating account_users link...');
    const { error: linkError } = await supabase
      .from('account_users')
      .insert({
        account_id: targetUserId,
        user_id: targetUserId,
        role: 'owner'
      });

    if (linkError) {
      console.error('❌ Error creating account_users link:', linkError);
      process.exit(1);
    }

    console.log('✅ Account_users link created successfully');

    // Initialize onboarding tasks
    console.log('📋 Initializing onboarding tasks...');
    const defaultTasks = [
      'business-profile',
      'style-prompt-pages', 
      'customize-universal',
      'create-prompt-page',
      'share'
    ];

    const taskData = defaultTasks.map(taskId => ({
      account_id: targetUserId,
      task_id: taskId,
      completed: false,
      completed_at: null
    }));

    const { error: tasksError } = await supabase
      .from('onboarding_tasks')
      .insert(taskData);

    if (tasksError) {
      console.error('⚠️  Warning: Could not create onboarding tasks:', tasksError);
      // Don't fail the whole process for this
    } else {
      console.log('✅ Onboarding tasks initialized');
    }

    console.log('🎉 Account repair completed successfully!');
    console.log('📊 Summary:');
    console.log(`   User ID: ${targetUserId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Account ID: ${targetUserId}`);
    console.log(`   Plan: grower (14-day trial)`);
    console.log('   Account Status: ✅ Fixed');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the repair
repairMissingAccount(); 