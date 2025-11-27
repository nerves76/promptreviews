import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import {
  calculateProfileCompleteness,
  processReviewTrends,
  identifyOptimizationOpportunities,
  formatPerformanceData,
} from '@/utils/googleBusinessProfile/overviewDataHelpers';

interface OAuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null;
}

export interface PostData {
  createTime: string;
  topicType: string;
  summary?: string;
}

export interface GoogleOverviewResult {
  businessInfo: {
    name: string;
    locationName: string;
    address: any | null;
    phone: string | null;
    website: string | null;
    categories?: any;
  } | null;
  profileData: ReturnType<typeof calculateProfileCompleteness>;
  engagementData: {
    unrespondedReviews: number;
    totalReviews?: number;
    totalQuestions: number;
    unansweredQuestions: number;
    recentPosts: number;
    recentPhotos?: number;
    lastPostDate?: string;
    lastPhotoDate?: string;
  };
  performanceData: ReturnType<typeof formatPerformanceData>;
  reviewTrends: ReturnType<typeof processReviewTrends>;
  optimizationOpportunities: ReturnType<typeof identifyOptimizationOpportunities>;
  reviewsAvailable: boolean;
  insightsAvailable: boolean;
  locationData?: any;
  postsData?: PostData[];
}

function mapBusinessInfo(location: any, fallbackName: string) {
  if (!location) return null;
  const phoneNumbers = location.phoneNumbers || {};
  const categories = location.categories || (location.primaryCategory ? [location.primaryCategory] : undefined);
  return {
    name: location.title || location.locationName || location.displayName || fallbackName,
    locationName: fallbackName,
    address: location.storefrontAddress || location.address || null,
    phone: phoneNumbers.primaryPhone || location.primaryPhone || null,
    website: location.websiteUri || location.websiteUrl || null,
    categories,
  };
}

export async function buildOverviewData({ tokens, locationId }: { tokens: OAuthTokens; locationId: string }): Promise<GoogleOverviewResult> {
  const client = new GoogleBusinessProfileClient({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken || undefined,
    expiresAt: tokens.expiresAt ?? undefined,
  });

  const accounts = await client.listAccounts();
  let targetLocation: any | null = null;
  let targetAccount: any | null = null;

  const targetLocationIdCanonical = canonicalizeLocationId(locationId);

  for (const account of accounts) {
    try {
      const locations = await client.listLocations(account.name);
      const found = locations.find((loc: any) => {
        const locCanonical = canonicalizeLocationId(loc.name);
        return (
          loc.name === locationId ||
          locCanonical === locationId ||
          locCanonical === targetLocationIdCanonical
        );
      });
      if (found) {
        targetLocation = found;
        targetAccount = account;
        break;
      }
    } catch (error) {
      console.error('Failed to list locations for account', account.name, error);
    }
  }

  if (!targetLocation) {
    throw new Error(`Location ${locationId} not found in connected Google account`);
  }

  const cleanLocationId = targetLocationIdCanonical.replace('locations/', '');
  const cleanAccountId = targetAccount?.name?.replace('accounts/', '') || '';

  const [reviewsResult, photosResult, postsResult, insightsResult] = await Promise.allSettled([
    client.getReviews(targetLocation.name),
    client.getMedia(targetLocation.name),
    targetAccount && cleanAccountId ? client.listLocalPosts(cleanAccountId, cleanLocationId) : Promise.resolve([]),
    client.getLocationInsights(targetLocation.name, 'THIRTY_DAYS'),
  ]);

  const reviewsAvailable = reviewsResult.status === 'fulfilled';
  const insightsAvailable = insightsResult.status === 'fulfilled';

  const reviewsData = reviewsAvailable ? reviewsResult.value : [];
  const photosData = photosResult.status === 'fulfilled' ? photosResult.value : [];
  const postsData = postsResult.status === 'fulfilled' ? postsResult.value : [];
  const insightsData = insightsAvailable ? insightsResult.value : [];

  const profileData = calculateProfileCompleteness(targetLocation, [], photosData);
  const reviewTrends = processReviewTrends(reviewsData);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentPhotos = photosData.filter((photo: any) => {
    if (!photo.createTime) return false;
    const photoDate = new Date(photo.createTime);
    return photoDate >= thirtyDaysAgo;
  });

  const recentPosts = postsData.filter((post: any) => {
    if (!post.createTime) return false;
    const postDate = new Date(post.createTime);
    return postDate >= thirtyDaysAgo;
  });

  const getLatestDate = (items: any[], field: string) => {
    if (items.length === 0) return undefined;
    const dates = items
      .map((item) => item[field])
      .filter(Boolean)
      .map((value) => new Date(value))
      .sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0].toISOString() : undefined;
  };

  const engagementData = {
    unrespondedReviews: reviewsData.filter((review: any) => !review.reviewReply).length,
    totalReviews: reviewsData.length,
    totalQuestions: 0,
    unansweredQuestions: 0,
    recentPosts: recentPosts.length,
    recentPhotos: recentPhotos.length,
    lastPostDate: getLatestDate(postsData, 'createTime'),
    lastPhotoDate: getLatestDate(photosData, 'createTime'),
  };

  const performanceData = formatPerformanceData(insightsData, []);

  const optimizationOpportunities = identifyOptimizationOpportunities(
    targetLocation,
    profileData,
    engagementData,
    photosData,
  );

  // Map posts data for the posting frequency chart
  const mappedPostsData: PostData[] = postsData
    .filter((post: any) => post.createTime)
    .map((post: any) => ({
      createTime: post.createTime,
      topicType: post.topicType || 'STANDARD',
      summary: post.summary,
    }));

  return {
    businessInfo: mapBusinessInfo(targetLocation, targetLocation.name),
    profileData,
    engagementData,
    performanceData,
    reviewTrends,
    optimizationOpportunities,
    reviewsAvailable,
    insightsAvailable,
    locationData: targetLocation,
    postsData: mappedPostsData,
  };
}
function canonicalizeLocationId(id: string) {
  if (!id) return id;
  if (id.startsWith('accounts/')) {
    const parts = id.split('/');
    const last = parts[parts.length - 1];
    return `locations/${last}`;
  }
  return id.startsWith('locations/') ? id : `locations/${id}`;
}
