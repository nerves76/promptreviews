'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if scripts are loaded
        if ((window as any).PromptReviews && (window as any).PromptReviewsSingle && (window as any).PromptReviewsPhoto && (window as any).Swiper) {
            setIsLoaded(true);
        } else {
            // Wait for scripts to load
            const checkLoaded = setInterval(() => {
                if ((window as any).PromptReviews && (window as any).PromptReviewsSingle && (window as any).PromptReviewsPhoto && (window as any).Swiper) {
                    setIsLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);

            // Cleanup
            return () => clearInterval(checkLoaded);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        // Sample widget data
        const widgetData = {
            reviews: [
                {
                    rating: 5,
                    content: "This is an amazing product! I've been using it for months and it's been a game-changer for my workflow.",
                    reviewer: {
                        name: "John Doe",
                        role: "Product Manager"
                    }
                },
                {
                    rating: 4,
                    content: "Great product with excellent features. The only reason I'm giving it 4 stars is because of the initial learning curve.",
                    reviewer: {
                        name: "Jane Smith",
                        role: "Software Engineer"
                    }
                },
                {
                    rating: 5,
                    content: "Absolutely love this! The interface is intuitive and the support team is incredibly helpful.",
                    reviewer: {
                        name: "Mike Johnson",
                        role: "UX Designer"
                    }
                }
            ]
        };

        // Initialize all three widgets
        const multiContainer = document.getElementById('multi-widget-container');
        const singleContainer = document.getElementById('single-widget-container');
        const photoContainer = document.getElementById('photo-widget-container');

        if (multiContainer && (window as any).PromptReviews) {
            (window as any).PromptReviews.renderMultiWidget(multiContainer, widgetData);
        }

        if (singleContainer && (window as any).PromptReviewsSingle) {
            (window as any).PromptReviewsSingle.initializeWidget('promptreviews-single-widget', widgetData.reviews, {
                bgColor: '#ffffff',
                textColor: '#333333',
                accentColor: '#4f46e5',
                showQuotes: true,
                showRelativeDate: true,
                autoAdvance: true,
                slideshowSpeed: 4
            }, 'test-business');
        }

        if (photoContainer && (window as any).PromptReviewsPhoto) {
            (window as any).PromptReviewsPhoto.initializeWidget('promptreviews-photo-widget', widgetData.reviews, {
                bgColor: '#ffffff',
                textColor: '#333333',
                accentColor: '#4f46e5',
                showQuotes: true,
                showRelativeDate: true,
                autoAdvance: true,
                slideshowSpeed: 4
            }, 'test-business');
        }
    }, [isLoaded]);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Widget Test Page</h1>
            <p className="text-center mb-8 text-gray-600">Testing all three widget types</p>
            
            <div className="space-y-12">
                {/* Multi Widget */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Multi Widget</h2>
                    <div id="multi-widget-container" className="max-w-7xl mx-auto"></div>
                </div>

                {/* Single Widget */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Single Widget</h2>
                    <div id="single-widget-container" className="max-w-4xl mx-auto">
                        <div id="promptreviews-single-widget"></div>
                    </div>
                </div>

                {/* Photo Widget */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Photo Widget</h2>
                    <div id="photo-widget-container" className="max-w-4xl mx-auto">
                        <div id="promptreviews-photo-widget"></div>
                    </div>
                </div>
            </div>
        </div>
    );
} 