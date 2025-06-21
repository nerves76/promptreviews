import { NextResponse } from 'next/server';

export async function GET() {
  // Test data with multiple reviews
  const testData = {
    id: 'test-multi',
    widget_type: 'multi',
    name: 'Test Multi Widget',
    theme: {
      showQuotes: true,
      showRelativeDate: true,
      showSubmitReviewButton: true
    },
    reviews: [
      {
        star_rating: 5,
        review_content: "This is the first test review to verify Swiper functionality works correctly with multiple reviews.",
        first_name: "John",
        last_name: "Doe",
        reviewer_role: "Customer",
        created_at: "2024-01-15T10:30:00Z"
      },
      {
        star_rating: 4,
        review_content: "This is the second test review. The Swiper should show navigation controls for multiple reviews.",
        first_name: "Jane",
        last_name: "Smith",
        reviewer_role: "Client",
        created_at: "2024-01-14T15:45:00Z"
      },
      {
        star_rating: 5,
        review_content: "This is the third test review. You should see pagination dots and navigation arrows.",
        first_name: "Mike",
        last_name: "Johnson",
        reviewer_role: "Business Owner",
        created_at: "2024-01-13T09:20:00Z"
      }
    ],
    design: {
      showQuotes: true,
      showRelativeDate: true,
      showSubmitReviewButton: true
    },
    businessSlug: "test-business"
  };

  return NextResponse.json(testData);
} 