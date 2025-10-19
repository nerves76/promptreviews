/**
 * Test Endpoint: Post Monthly Community Stats
 *
 * THIS IS FOR TESTING ONLY - Creates a test post with last month's stats
 * Use this to preview how the monthly stats post will look
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GENERAL_CHANNEL_ID = '641f29a9-155a-4e01-9c6f-91861cd25e5b';
const PROMPTYBOT_EMAIL = 'promptybot@promptreviews.app';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get or create PromptyBot user
    const { data: botUser, error: botUserError } = await supabaseAdmin.auth.admin.listUsers();

    if (botUserError) {
      console.error('Error fetching users:', botUserError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    let promptyBotId = botUser.users.find(u => u.email === PROMPTYBOT_EMAIL)?.id;

    if (!promptyBotId) {
      // Create PromptyBot user
      const { data: newBot, error: createBotError } = await supabaseAdmin.auth.admin.createUser({
        email: PROMPTYBOT_EMAIL,
        email_confirm: true,
        user_metadata: {
          first_name: 'Prompty',
          last_name: 'Bot'
        }
      });

      if (createBotError || !newBot.user) {
        console.error('Error creating PromptyBot:', createBotError);
        return NextResponse.json({ error: 'Failed to create bot user' }, { status: 500 });
      }

      promptyBotId = newBot.user.id;

      // Create community profile for PromptyBot
      const { error: profileError } = await supabaseAdmin
        .from('community_profiles')
        .insert({
          user_id: promptyBotId,
          username: 'prompty-bot',
          display_name_override: 'Prompty @ Prompt Reviews',
          opted_in_at: new Date().toISOString(),
          guidelines_ack_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error creating bot profile:', profileError);
        return NextResponse.json({ error: 'Failed to create bot profile' }, { status: 500 });
      }

      console.log('✅ PromptyBot user and profile created');
    }

    // Get or create PromptyBot account
    const { data: existingAccount, error: accountCheckError } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('email', PROMPTYBOT_EMAIL)
      .single();

    let promptyBotAccountId: string;

    if (accountCheckError || !existingAccount) {
      // Create PromptyBot account
      const { data: newAccount, error: createAccountError } = await supabaseAdmin
        .from('accounts')
        .insert({
          id: promptyBotId, // Use the same ID as the user
          email: PROMPTYBOT_EMAIL,
          first_name: 'Prompty',
          last_name: 'Bot',
          business_name: 'Prompt Reviews',
          status: 'active',
          plan: 'system' // Special plan for system accounts
        })
        .select()
        .single();

      if (createAccountError || !newAccount) {
        console.error('Error creating PromptyBot account:', createAccountError);
        return NextResponse.json({ error: 'Failed to create bot account' }, { status: 500 });
      }

      promptyBotAccountId = newAccount.id;
      console.log('✅ PromptyBot account created');

      // Create business for PromptyBot
      const { error: businessError } = await supabaseAdmin
        .from('businesses')
        .insert({
          account_id: promptyBotAccountId,
          name: 'Prompt Reviews',
          logo_url: '/images/prompty-icon-prompt-reviews.png'
        });

      if (businessError) {
        console.error('Error creating PromptyBot business:', businessError);
      } else {
        console.log('✅ PromptyBot business created');
      }
    } else {
      promptyBotAccountId = existingAccount.id;
    }

    // Calculate stats for LAST MONTH (not current month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const lastMonthName = lastMonth.toLocaleString('en-US', { month: 'long' });
    const currentMonthName = now.toLocaleString('en-US', { month: 'long' });

    console.log(`Calculating stats for: ${lastMonthName} ${lastMonth.getFullYear()}`);

    // Get total accounts
    const { count: totalAccounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Get total reviews
    const { count: totalReviewsCount, error: totalReviewsError } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true });

    if (totalReviewsError) {
      console.error('Error fetching total reviews:', totalReviewsError);
      return NextResponse.json({ error: 'Failed to fetch total reviews' }, { status: 500 });
    }

    // Get reviews from last month
    const { count: lastMonthReviewsCount, error: lastMonthReviewsError } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
      .lte('created_at', lastMonthEnd.toISOString());

    if (lastMonthReviewsError) {
      console.error('Error fetching last month reviews:', lastMonthReviewsError);
      return NextResponse.json({ error: 'Failed to fetch last month reviews' }, { status: 500 });
    }

    // Format numbers with commas
    const formatNumber = (num: number) => num.toLocaleString('en-US');

    // Create the post body with simple formatting (no markdown needed)
    const postTitle = `Happy ${currentMonthName} Star Catchers! 🌟`;
    const postBody = `How many reviews did you capture last month?

📊 ${lastMonthName} Review Stats

👥 ${formatNumber(totalAccounts || 0)} Prompt Reviews Accounts
⭐ ${formatNumber(totalReviewsCount || 0)} Total Reviews Captured
🎉 ${formatNumber(lastMonthReviewsCount || 0)} New Reviews in ${lastMonthName}

Keep up the amazing work capturing those reviews! 💫`;

    console.log('Post preview:');
    console.log('Title:', postTitle);
    console.log('Body:', postBody);

    // Create the community post
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        channel_id: GENERAL_CHANNEL_ID,
        author_id: promptyBotId,
        account_id: promptyBotAccountId,
        title: postTitle,
        body: postBody
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return NextResponse.json({ error: 'Failed to create post', details: postError }, { status: 500 });
    }

    console.log('✅ Test post created successfully:', post.id);

    return NextResponse.json({
      success: true,
      message: 'Test post created! Check the community page.',
      post_id: post.id,
      post_url: `/community?post=${post.id}`,
      stats: {
        total_accounts: totalAccounts || 0,
        total_reviews: totalReviewsCount || 0,
        last_month_reviews: lastMonthReviewsCount || 0,
        month: lastMonthName,
        date_range: {
          start: lastMonth.toISOString(),
          end: lastMonthEnd.toISOString()
        }
      },
      preview: {
        title: postTitle,
        body: postBody
      }
    });

  } catch (error) {
    console.error('Error in test-monthly-stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
