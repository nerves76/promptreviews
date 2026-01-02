/**
 * Social Media Posts API Route
 * Handles post creation and publishing across platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { postManager } from '@/features/social-posting';
import { GoogleBusinessProfileAdapter } from '@/features/social-posting/platforms/google-business-profile/adapter';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import type { UniversalPost, PlatformId } from '@/features/social-posting';

// LinkedIn target for multi-target posting (personal profile + organizations)
interface LinkedInTarget {
  type: 'personal' | 'organization';
  id: string;
  name: string;
}

// Extended post data type to include additionalPlatforms
interface ExtendedPostData extends UniversalPost {
  additionalPlatforms?: {
    bluesky?: boolean | { enabled: boolean; connectionId: string };
    linkedin?: boolean | {
      enabled: boolean;
      connectionId: string;
      targets?: LinkedInTarget[];
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const postData: ExtendedPostData = await request.json();
    
    // Validate request
    if (!postData.content || !postData.platforms || postData.platforms.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Post content and platforms are required' 
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get user's Google Business Profile tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (tokenError || !tokens) {
      return NextResponse.json({
        success: false,
        error: 'Platform google-business-profile is not authenticated'
      }, { status: 401 });
    }

    // Initialize adapters if not already registered or if tokens have changed
    const platformId: PlatformId = 'google-business-profile';
    if (!postManager.getAdapter(platformId)) {
      // Create Google Business Profile client with actual user tokens
      const client = new GoogleBusinessProfileClient({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at).getTime()
      });

      // Get the account ID from the tokens or stored data
      // We need to get this to avoid extra API calls in the adapter
      const { data: locationData } = await supabase
        .from('google_business_locations')
        .select('account_name')
        .eq('account_id', accountId)
        .limit(1);

      let gbpAccountId: string | null = null;
      if (locationData && locationData.length > 0 && locationData[0].account_name) {
        // Extract GBP account ID from the stored account name (accounts/{id})
        gbpAccountId = locationData[0].account_name.replace('accounts/', '');
      }

      // Create adapter with the authenticated client
      const gbpAdapter = new GoogleBusinessProfileAdapter({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      });

      // Set the client, GBP account ID, and mark as authenticated
      (gbpAdapter as any).client = client;
      (gbpAdapter as any).accountId = gbpAccountId; // Pass GBP account ID to avoid API calls
      (gbpAdapter as any).isAuth = true;
      
      postManager.registerAdapter('google-business-profile', gbpAdapter);
    }
    
    // Validate the post across all platforms
    const validationResults = await postManager.validatePost(postData);
    
    // Check if any platform has validation errors
    const hasErrors = Object.values(validationResults).some(result => !result.isValid);
    if (hasErrors) {
      return NextResponse.json({
        success: false,
        error: 'Post validation failed',
        validationResults
      }, { status: 400 });
    }
    
    // Publish the post to GBP
    const publishResults = await postManager.publishPost(postData);

    // Check if any GBP publication failed
    const hasGbpFailures = Object.values(publishResults).some(result => !result.success);

    // Handle LinkedIn cross-posting if requested
    // Supports both legacy boolean format and new targets format
    let linkedinResults: Array<{ target: string; success: boolean; postId?: string; error?: string }> = [];

    const linkedinConfig = postData.additionalPlatforms?.linkedin;
    if (linkedinConfig) {
      try {
        // Fetch LinkedIn connection for this account
        const { data: linkedinConnection, error: connError } = await supabase
          .from('social_platform_connections')
          .select('id, credentials, status')
          .eq('account_id', accountId)
          .eq('platform', 'linkedin')
          .eq('status', 'active')
          .maybeSingle();

        if (connError || !linkedinConnection) {
          console.warn('[Posts] LinkedIn cross-post requested but no active connection found');
          linkedinResults.push({ target: 'linkedin', success: false, error: 'LinkedIn connection not found or inactive' });
        } else {
          const credentials = linkedinConnection.credentials as {
            accessToken: string;
            refreshToken?: string;
            expiresAt?: string;
            linkedinId: string;
          };

          if (!credentials.accessToken || !credentials.linkedinId) {
            linkedinResults.push({ target: 'linkedin', success: false, error: 'Missing LinkedIn credentials' });
          } else {
            // Check if token needs refresh
            let tokenRefreshFailed = false;
            if (credentials.expiresAt && new Date(credentials.expiresAt) < new Date()) {
              if (credentials.refreshToken) {
                try {
                  const { LinkedInAdapter } = await import('@/features/social-posting/platforms/linkedin');
                  const refreshedTokens = await LinkedInAdapter.refreshAccessToken(credentials.refreshToken);

                  // Update stored credentials
                  const newExpiresAt = new Date(Date.now() + refreshedTokens.expiresIn * 1000).toISOString();
                  await supabase
                    .from('social_platform_connections')
                    .update({
                      credentials: {
                        ...credentials,
                        accessToken: refreshedTokens.accessToken,
                        expiresAt: newExpiresAt,
                      },
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', linkedinConnection.id);

                  credentials.accessToken = refreshedTokens.accessToken;
                  credentials.expiresAt = newExpiresAt;
                } catch (refreshError) {
                  console.error('[Posts] LinkedIn token refresh failed:', refreshError);
                  linkedinResults.push({ target: 'linkedin', success: false, error: 'LinkedIn token expired and refresh failed' });
                  tokenRefreshFailed = true;
                }
              } else {
                linkedinResults.push({ target: 'linkedin', success: false, error: 'LinkedIn token expired' });
                tokenRefreshFailed = true;
              }
            }

            // If token is valid, proceed with posting
            if (!tokenRefreshFailed) {
              const { LinkedInAdapter } = await import('@/features/social-posting/platforms/linkedin');
              const adapter = new LinkedInAdapter({
                accessToken: credentials.accessToken,
                refreshToken: credentials.refreshToken || '',
                expiresAt: credentials.expiresAt || new Date(Date.now() + 3600000).toISOString(),
                linkedinId: credentials.linkedinId,
              });

              // Determine targets to post to
              let targets: LinkedInTarget[] = [];

              if (typeof linkedinConfig === 'boolean') {
                // Legacy format: just post to personal profile
                targets = [{ type: 'personal', id: credentials.linkedinId, name: 'Personal Profile' }];
              } else if (linkedinConfig.targets && linkedinConfig.targets.length > 0) {
                // New format: use provided targets
                targets = linkedinConfig.targets;
              } else {
                // New format but no targets specified: default to personal profile
                targets = [{ type: 'personal', id: credentials.linkedinId, name: 'Personal Profile' }];
              }

              // Post to each target
              for (const target of targets) {
                try {
                  // Determine the author URN based on target type
                  const authorUrn = target.type === 'organization'
                    ? target.id  // Organization URN (urn:li:organization:XXX)
                    : credentials.linkedinId.startsWith('urn:')
                      ? credentials.linkedinId
                      : `urn:li:person:${credentials.linkedinId}`;

                  const result = await adapter.createPost(
                    {
                      content: postData.content,
                      platforms: ['linkedin'],
                      mediaUrls: postData.mediaUrls,
                      status: 'published',
                      callToAction: postData.callToAction,
                    },
                    authorUrn  // Pass author URN for organization posting
                  );

                  linkedinResults.push({
                    target: target.name,
                    success: result.success,
                    postId: result.platformPostId,
                    error: result.error,
                  });

                  if (result.success) {
                    console.log(`[Posts] LinkedIn cross-post to ${target.name} successful:`, result.platformPostId);
                  } else {
                    console.warn(`[Posts] LinkedIn cross-post to ${target.name} failed:`, result.error);
                  }

                  // Small delay between posts to avoid rate limiting
                  if (targets.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                } catch (targetError) {
                  console.error(`[Posts] LinkedIn cross-post to ${target.name} error:`, targetError);
                  linkedinResults.push({
                    target: target.name,
                    success: false,
                    error: targetError instanceof Error ? targetError.message : 'Unknown error',
                  });
                }
              }
            }
          }
        }
      } catch (linkedinError) {
        console.error('[Posts] LinkedIn cross-post error:', linkedinError);
        linkedinResults.push({
          target: 'linkedin',
          success: false,
          error: linkedinError instanceof Error ? linkedinError.message : 'Unknown LinkedIn error',
        });
      }
    }

    // Determine overall success
    const hasLinkedInFailures = linkedinResults.length > 0 && linkedinResults.some(r => !r.success);
    const hasFailures = hasGbpFailures || hasLinkedInFailures;

    return NextResponse.json({
      success: !hasFailures,
      data: {
        validationResults,
        publishResults,
        linkedin: linkedinResults.length > 0 ? linkedinResults : undefined,
        optimizedContent: postManager.optimizePostForPlatforms(postData)
      }
    });
    
  } catch (error) {
    console.error('Error publishing post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish post',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement post history/listing
    return NextResponse.json({
      success: true,
      data: {
        posts: [],
        message: 'Post history not yet implemented'
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch posts' 
      },
      { status: 500 }
    );
  }
} 
