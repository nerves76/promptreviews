/**
 * Cron Job: Post Monthly Community Stats
 *
 * Posts a monthly update to the community "general" channel with platform stats:
 * - Total number of accounts
 * - Total reviews captured across all accounts
 * - New reviews captured in the previous month
 *
 * This endpoint is called by Vercel's cron service on the 1st of each month.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GENERAL_CHANNEL_ID = '641f29a9-155a-4e01-9c6f-91861cd25e5b';
const PROMPTYBOT_EMAIL = 'promptybot@promptreviews.app';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    } else {
      promptyBotAccountId = existingAccount.id;
    }

    // Calculate stats
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const lastMonthName = lastMonth.toLocaleString('en-US', { month: 'long' });
    const currentMonthName = now.toLocaleString('en-US', { month: 'long' });

    // Get total accounts
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    const totalAccounts = accounts || 0;

    // Get total reviews
    const { data: totalReviews, error: totalReviewsError } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true });

    if (totalReviewsError) {
      console.error('Error fetching total reviews:', totalReviewsError);
      return NextResponse.json({ error: 'Failed to fetch total reviews' }, { status: 500 });
    }

    const totalReviewsCount = totalReviews || 0;

    // Get reviews from last month
    const { data: lastMonthReviews, error: lastMonthReviewsError } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
      .lte('created_at', lastMonthEnd.toISOString());

    if (lastMonthReviewsError) {
      console.error('Error fetching last month reviews:', lastMonthReviewsError);
      return NextResponse.json({ error: 'Failed to fetch last month reviews' }, { status: 500 });
    }

    const lastMonthReviewsCount = lastMonthReviews || 0;

    // Format numbers with commas
    const formatNumber = (num: number) => num.toLocaleString('en-US');

    // Create the post body with improved text-based formatting
    const postTitle = `Happy ${currentMonthName} Star Catchers! 🌟`;
    const postBody = `How many reviews did you capture last month?

📊 **${lastMonthName} Review Stats**

👥 **${formatNumber(totalAccounts)}** Prompt Reviews Accounts

⭐ **${formatNumber(totalReviewsCount)}** Total Reviews Captured

🎉 **${formatNumber(lastMonthReviewsCount)}** New Reviews in ${lastMonthName}

Keep up the amazing work capturing those reviews! 💫`;

    // Create the community post with Prompty avatar
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        channel_id: GENERAL_CHANNEL_ID,
        author_id: promptyBotId,
        account_id: promptyBotAccountId,
        title: postTitle,
        body: postBody,
        logo_url: '/images/prompty-icon-prompt-reviews.png' // Prompty avatar
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    console.log('✅ Monthly stats post created successfully:', post.id);

    return NextResponse.json({
      success: true,
      post_id: post.id,
      stats: {
        total_accounts: totalAccounts,
        total_reviews: totalReviewsCount,
        last_month_reviews: lastMonthReviewsCount,
        month: lastMonthName
      }
    });

  } catch (error) {
    console.error('Error in post-monthly-stats cron:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
