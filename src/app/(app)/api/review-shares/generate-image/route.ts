/**
 * Review Share Image Generation API
 * Handles image generation for social media sharing
 *
 * Priority Logic:
 * 1. If review has an existing photo (from photo + testimonial), use that
 * 2. If no photo, generate a quote card image
 * 3. Store generated image in Supabase Storage
 * 4. Return image URL for sharing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

// Initialize Supabase client with service key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STORAGE_BUCKET = 'share-review-images';
const OG_IMAGE_ENDPOINT = '/api/review-shares/og-image';

/**
 * POST /api/review-shares/generate-image
 * Generate or retrieve share image for a review
 */
export async function POST(request: NextRequest) {
  // CSRF Protection
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { review_id, regenerate = false } = body;

    // Validate required fields
    if (!review_id) {
      return NextResponse.json(
        { error: 'Missing required field: review_id' },
        { status: 400 }
      );
    }

    // Get user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Fetch review data - check both tables
    const reviewSubmission = await prisma.review_submissions.findUnique({
      where: { id: review_id },
      include: {
        businesses: true,
      },
    });

    const widgetReview = !reviewSubmission
      ? await prisma.widget_reviews.findUnique({
          where: { id: review_id },
        })
      : null;

    const review = reviewSubmission || widgetReview;

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify business belongs to account
    if (review.business_id) {
      const business = await prisma.businesses.findUnique({
        where: { id: review.business_id },
        select: { account_id: true }
      });

      if (business?.account_id !== accountId) {
        return NextResponse.json(
          { error: 'You do not have permission to generate images for this review' },
          { status: 403 }
        );
      }
    }

    // PRIORITY 1: Check if review has existing photo
    if (review.photo_url && !regenerate) {
      return NextResponse.json({
        success: true,
        image_url: review.photo_url,
        source: 'existing_photo',
        message: 'Using existing review photo',
      });
    }

    // PRIORITY 2: Check if quote card already exists (unless regenerating)
    if (!regenerate) {
      // Use account-scoped path for security: {accountId}/{reviewId}.png
      const existingImagePath = `${accountId}/${review_id}.png`;

      // Check if image exists in storage
      const { data: existingFile } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(accountId, {
          search: `${review_id}.png`,
        });

      if (existingFile && existingFile.length > 0) {
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(existingImagePath);

        return NextResponse.json({
          success: true,
          image_url: publicUrlData.publicUrl,
          source: 'cached_quote_card',
          message: 'Using cached quote card image',
        });
      }
    }

    // PRIORITY 3: Generate new quote card image
    // Build OG image URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const ogImageUrl = `${baseUrl}${OG_IMAGE_ENDPOINT}?reviewId=${review_id}`;

    // Fetch the generated OG image (pass auth header for authentication)
    const imageResponse = await fetch(ogImageUrl, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Failed to generate OG image:', imageResponse.status, imageResponse.statusText, errorText);
      return NextResponse.json(
        {
          error: 'Failed to generate quote card image',
          fallback: true,
          message: 'Image generation failed - use text-only share',
          details: errorText,
        },
        { status: 500 }
      );
    }

    // Get image buffer (use Buffer for Node.js compatibility instead of Blob)
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Generate account-scoped filename for security: {accountId}/{reviewId}.png
    const timestamp = regenerate ? `-${Date.now()}` : '';
    const filename = `${accountId}/${review_id}${timestamp}.png`;

    // Upload to Supabase Storage (Buffer works better in Node.js than Blob)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: regenerate, // Overwrite if regenerating
      });

    if (uploadError) {
      console.error('Error uploading image to storage:', uploadError);
      return NextResponse.json(
        {
          error: 'Failed to store generated image',
          fallback: true,
          message: 'Storage failed - use text-only share',
        },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename);

    // Store metadata about generated image (optional - for tracking/cleanup)
    await prisma.review_share_images.create({
      data: {
        id: nanoid(),
        review_id: review_id,
        account_id: accountId,
        image_url: publicUrlData.publicUrl,
        storage_path: filename,
        generated_at: new Date(),
        image_type: 'quote_card',
      },
    }).catch((err) => {
      // Non-critical - log but don't fail the request
      console.warn('Failed to store image metadata:', err);
    });

    return NextResponse.json({
      success: true,
      image_url: publicUrlData.publicUrl,
      source: 'generated_quote_card',
      message: 'Successfully generated quote card image',
    });

  } catch (error) {
    console.error('Error in POST /api/review-shares/generate-image:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        fallback: true,
        message: 'Unexpected error - use text-only share',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/review-shares/generate-image?reviewId={id}
 * Delete generated quote card image (useful for cleanup or regeneration)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Missing required parameter: reviewId' },
        { status: 400 }
      );
    }

    // Get user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Find all images for this review
    const images = await prisma.review_share_images.findMany({
      where: {
        review_id: reviewId,
        account_id: accountId,
      },
    });

    if (!images || images.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images found to delete',
      });
    }

    // Delete from storage
    const filePaths = images.map((img) => img.storage_path);
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting images from storage:', deleteError);
    }

    // Delete metadata
    await prisma.review_share_images.deleteMany({
      where: {
        review_id: reviewId,
        account_id: accountId,
      },
    });

    return NextResponse.json({
      success: true,
      deleted_count: images.length,
      message: 'Successfully deleted share images',
    });

  } catch (error) {
    console.error('Error in DELETE /api/review-shares/generate-image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
