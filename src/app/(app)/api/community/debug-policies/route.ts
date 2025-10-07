import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/auth/providers/supabase';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get policies for posts table
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_posts_policies', {});

    // Get current auth.uid()
    const { data: authUid, error: authUidError } = await supabase
      .rpc('auth_uid', {});

    // Check if specific post can be deleted
    const postId = request.nextUrl.searchParams.get('postId');
    let postCheck = null;

    if (postId) {
      const { data: post } = await supabase
        .from('posts')
        .select('id, author_id, deleted_at')
        .eq('id', postId)
        .single();

      postCheck = {
        post,
        userIsAuthor: post?.author_id === user.id,
        currentUserId: user.id,
      };
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      policies: 'Check with SQL directly',
      postCheck,
      debug: {
        message: 'Use Supabase dashboard SQL editor to check policies',
        query: `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'posts' AND schemaname = 'public';`
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      user: { id: user.id }
    }, { status: 500 });
  }
}
