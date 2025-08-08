/**
 * OverviewStats Component
 * 
 * Header statistics component displaying review progress, total reviews, and average star rating.
 * Includes monthly review chart similar to the user's reference image.
 */

'use client';

import Icon from '@/components/Icon';

interface MonthlyReviewData {
  month: string;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  noRating: number;
}

interface OverviewStatsProps {
  totalReviews: number;
  reviewTrend: number;
  averageRating: number;
  monthlyReviewData: MonthlyReviewData[];
  isLoading?: boolean;
}

export default function OverviewStats({
  totalReviews,
  reviewTrend,
  averageRating,
  monthlyReviewData,
  isLoading = false
}: OverviewStatsProps) {
  
  // Calculate max reviews for chart scaling
  const maxReviews = Math.max(
    ...monthlyReviewData.map(data => 
      data.fiveStar + data.fourStar + data.threeStar + data.twoStar + data.oneStar
    ),
    1 // Prevent division by zero
  );

  // Get rating percentage for circular progress
  const ratingPercentage = (averageRating / 5) * 100;

  // Calculate circumference for circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratingPercentage / 100) * circumference;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Progress Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Stats Skeletons */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Review Progress Chart */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-blue">Review Progress</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">5 Star</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-600">4 Star</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-600">3 Star</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-gray-600">2 Star</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">1 Star</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">No rating</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-40">
          <div className="flex items-end justify-between h-full space-x-2">
            {monthlyReviewData.map((data, index) => {
              const totalMonthReviews = data.fiveStar + data.fourStar + data.threeStar + data.twoStar + data.oneStar;
              const chartHeight = maxReviews > 0 ? (totalMonthReviews / maxReviews) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  {/* Stacked Bar */}
                  <div 
                    className="w-full max-w-12 relative bg-gray-100 rounded-t"
                    style={{ height: '120px' }}
                  >
                    {totalMonthReviews > 0 && (
                      <div 
                        className="absolute bottom-0 w-full rounded-t overflow-hidden"
                        style={{ height: `${chartHeight}%` }}
                      >
                        {/* Stack bars from bottom to top */}
                        <div className="relative h-full">
                          {/* 5 Star */}
                          <div 
                            className="bg-green-500 absolute bottom-0 w-full"
                            style={{ 
                              height: `${totalMonthReviews > 0 ? (data.fiveStar / totalMonthReviews) * 100 : 0}%` 
                            }}
                          ></div>
                          {/* 4 Star */}
                          <div 
                            className="bg-green-400 absolute w-full"
                            style={{ 
                              bottom: `${totalMonthReviews > 0 ? (data.fiveStar / totalMonthReviews) * 100 : 0}%`,
                              height: `${totalMonthReviews > 0 ? (data.fourStar / totalMonthReviews) * 100 : 0}%` 
                            }}
                          ></div>
                          {/* 3 Star */}
                          <div 
                            className="bg-yellow-400 absolute w-full"
                            style={{ 
                              bottom: `${totalMonthReviews > 0 ? ((data.fiveStar + data.fourStar) / totalMonthReviews) * 100 : 0}%`,
                              height: `${totalMonthReviews > 0 ? (data.threeStar / totalMonthReviews) * 100 : 0}%` 
                            }}
                          ></div>
                          {/* 2 Star */}
                          <div 
                            className="bg-orange-400 absolute w-full"
                            style={{ 
                              bottom: `${totalMonthReviews > 0 ? ((data.fiveStar + data.fourStar + data.threeStar) / totalMonthReviews) * 100 : 0}%`,
                              height: `${totalMonthReviews > 0 ? (data.twoStar / totalMonthReviews) * 100 : 0}%` 
                            }}
                          ></div>
                          {/* 1 Star */}
                          <div 
                            className="bg-red-500 absolute w-full"
                            style={{ 
                              bottom: `${totalMonthReviews > 0 ? ((data.fiveStar + data.fourStar + data.threeStar + data.twoStar) / totalMonthReviews) * 100 : 0}%`,
                              height: `${totalMonthReviews > 0 ? (data.oneStar / totalMonthReviews) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Month Label */}
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {data.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side Stats */}
      <div className="space-y-6">
        {/* Total Reviews */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-blue">Total Reviews</h3>
            <Icon name="FaStar" className="w-6 h-6 text-slate-blue" />
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-gray-900">{totalReviews.toLocaleString()}</span>
            {reviewTrend !== 0 && (
              <span className={`text-sm font-medium flex items-center ${
                reviewTrend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <Icon 
                  name={reviewTrend > 0 ? "FaArrowUp" : "FaArrowDown"} 
                  className="w-3 h-3 mr-1" 
                />
                {reviewTrend > 0 ? '+' : ''}{reviewTrend}
              </span>
            )}
          </div>
        </div>

        {/* Average Star Rating */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-blue">Average Star Rating</h3>
            <Icon name="FaStar" className="w-6 h-6 text-slate-blue" />
          </div>
          
          {/* Circular Progress */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-green-500 transition-all duration-500 ease-in-out"
                  strokeLinecap="round"
                />
              </svg>
              {/* Rating Number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Avg. star rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}