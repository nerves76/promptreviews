/**
 * OG Image Generation Route for Review Quote Cards
 * Generates social media share images with dynamic styling from Prompt Pages
 *
 * Usage: /api/review-shares/og-image?reviewId={id}
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * Truncate review text to specified length with ellipsis
 */
function truncateReviewText(text: string, maxLength: number = 180): string {
  if (!text) return '';
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLength) return cleaned;
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
}

/**
 * Calculate relative luminance of a hex color
 * Returns value between 0 (darkest) and 1 (lightest)
 */
function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map(val => {
    const channel = parseInt(val, 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determine if background is dark based on gradient colors
 */
function isBackgroundDark(gradientStart: string, gradientEnd: string): boolean {
  const startLuminance = getLuminance(gradientStart);
  const endLuminance = getLuminance(gradientEnd);
  const avgLuminance = (startLuminance + endLuminance) / 2;
  return avgLuminance < 0.5;
}

/**
 * GET /api/review-shares/og-image
 * Generate OG image for review sharing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const includeReviewerName = searchParams.get('includeReviewerName') === 'true';

    if (!reviewId) {
      return new Response('Missing reviewId parameter', { status: 400 });
    }

    // Fetch the logo image with error handling
    let logoDataUrl = '';
    try {
      const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/images/prompt-reviews-logo.png`;
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBase64 = Buffer.from(logoArrayBuffer).toString('base64');
        logoDataUrl = `data:image/png;base64,${logoBase64}`;
      }
    } catch (err) {
      console.error('[OG Image] Failed to fetch PromptReviews logo:', err);
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let review: any = null;
    let business: any = null;

    // Try review_submissions first (most common from Reviews page)
    const { data: reviewSubmission } = await supabase
      .from('review_submissions')
      .select('*, prompt_pages!inner(account_id)')
      .eq('id', reviewId)
      .maybeSingle();

    if (reviewSubmission) {
      review = reviewSubmission;
      const accountId = reviewSubmission.prompt_pages?.account_id;

      if (accountId) {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', accountId)
          .limit(1)
          .maybeSingle();
        business = businessData;
      }
    } else {
      // Try widget_reviews as fallback
      const { data: widgetReview } = await supabase
        .from('widget_reviews')
        .select('*')
        .eq('id', reviewId)
        .maybeSingle();

      if (widgetReview?.account_id) {
        review = widgetReview;
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', widgetReview.account_id)
          .limit(1)
          .maybeSingle();
        business = businessData;
      }
    }

    if (!review) {
      console.error('[OG Image] Review not found for ID:', reviewId);
      return new Response('Review not found', { status: 404 });
    }

    if (!business) {
      console.error('[OG Image] Business not found for review ID:', reviewId);
      return new Response('Business not found', { status: 404 });
    }

    console.log('[OG Image] Successfully loaded review and business data');

    // Extract review details
    const reviewText = review.review_content || 'Great service!';
    const reviewerName = review.reviewer_name || review.first_name || 'Customer';
    const starRating = review.star_rating || 5;
    const truncatedText = truncateReviewText(reviewText, 180);

    // Extract styling - use glassy defaults as fallback (app's default style)
    const backgroundType = business.background_type || 'gradient';
    const gradientStart = business.gradient_start || '#2563EB'; // Glassy blue
    const gradientMiddle = business.gradient_middle || '#7864C8'; // Glassy purple
    const gradientEnd = business.gradient_end || '#914AAE'; // Glassy magenta
    const primaryColor = business.primary_color || '#FFFFFF'; // White for glassy
    const secondaryColor = business.secondary_color || '#FFFFFF'; // White for glassy
    const textColor = business.text_color || '#1F2937';
    const businessName = business.name || 'Customer Review';
    // Skip business logo for now - causing rendering issues
    const businessLogoUrl = null;

    const backgroundStyle = backgroundType === 'gradient'
      ? `linear-gradient(135deg, ${gradientStart} 0%, ${gradientMiddle} 50%, ${gradientEnd} 100%)`
      : (business.background_color || '#FFFFFF');

    // Render stars as SVG to avoid font rendering issues
    const renderStars = () => {
      const stars = [];
      for (let i = 0; i < 5; i++) {
        const filled = i < starRating;
        stars.push(
          <svg
            key={i}
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill={filled ? '#F59E0B' : '#D1D5DB'}
            style={{ marginRight: '4px' }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      }
      return stars;
    };

    // Adjust card padding and font size based on review length
    const cardPadding = '40px 50px 50px 50px'; // Top padding for logo overlap
    const reviewFontSize = truncatedText.length > 120 ? '32px' : '36px';
    const quoteSize = '80px'; // Decorative quote marks
    const quoteOpacity = 0.12;
    const logoSize = 120; // Size of the circular business logo

    // Determine logo color based on background
    const isDark = isBackgroundDark(gradientStart, gradientEnd);
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 80px',
            background: backgroundStyle,
            position: 'relative',
          }}
        >
          {/* Main card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: cardPadding,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxWidth: '900px',
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Business Logo - Half on card, half off */}
            {businessLogoUrl && (
              <img
                src={businessLogoUrl}
                width={logoSize}
                height={logoSize}
                alt="Business logo"
                style={{
                  position: 'absolute',
                  top: `-${logoSize / 2}px`,
                  left: `calc(50% - ${logoSize / 2}px)`,
                  width: `${logoSize}px`,
                  height: `${logoSize}px`,
                  borderRadius: '50%',
                  background: 'white',
                  border: '5px solid white',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  objectFit: 'cover',
                }}
              />
            )}

            {/* Opening Quote - Top Left - always show */}
            <span
              style={{
                position: 'absolute',
                top: '30px',
                left: '40px',
                fontSize: quoteSize,
                fontFamily: 'Georgia, serif',
                color: textColor,
                opacity: quoteOpacity,
                lineHeight: '1',
                display: 'flex',
              }}
            >
              "
            </span>

            {/* Closing Quote - Bottom Right */}
            <span
              style={{
                position: 'absolute',
                bottom: '30px',
                right: '40px',
                fontSize: quoteSize,
                fontFamily: 'Georgia, serif',
                color: textColor,
                opacity: quoteOpacity,
                lineHeight: '1',
                display: 'flex',
              }}
            >
              "
            </span>

            {/* Star Rating */}
            <div style={{ display: 'flex', marginBottom: '24px', marginTop: businessLogoUrl ? `${logoSize / 2 + 20}px` : '0' }}>
              {renderStars()}
            </div>

            {/* Review Text */}
            <p
              style={{
                display: 'flex',
                fontSize: reviewFontSize,
                lineHeight: '1.5',
                color: textColor,
                textAlign: 'center',
                fontFamily: 'system-ui, sans-serif',
                maxWidth: '750px',
                margin: 0,
              }}
            >
              {truncatedText}
            </p>

            {/* Reviewer Name - optional, subtle attribution */}
            {includeReviewerName && (
              <p
                style={{
                  display: 'flex',
                  fontSize: '20px',
                  color: '#6B7280',
                  fontWeight: 500,
                  fontFamily: 'system-ui, sans-serif',
                  marginTop: '20px',
                  margin: '20px 0 0 0',
                }}
              >
                — {reviewerName}
              </p>
            )}
          </div>

          {/* Logo - Bottom Right */}
          {logoDataUrl && (
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '28px',
                display: 'flex',
              }}
            >
              <img
                src={logoDataUrl}
                width={140}
                alt="Prompt Reviews logo"
                style={{
                  filter: isDark ? 'invert(1)' : 'none',
                  opacity: isDark ? 0.9 : 0.7,
                }}
              />
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('[OG Image] Error generating OG image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    return new Response(
      JSON.stringify({
        error: 'Error generating image',
        message: errorMessage,
        stack: errorStack,
        reviewId: new URL(request.url).searchParams.get('reviewId'),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
