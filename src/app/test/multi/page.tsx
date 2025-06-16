'use client';

import { useEffect, useState } from 'react';

declare global {
    interface Window {
        Swiper?: any;
        PromptReviews?: any;
        renderMultiWidget: (container: HTMLElement, data: any) => void;
    }
}

export default function TestPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if scripts are loaded
        if (window.PromptReviews && window.Swiper) {
            setIsLoaded(true);
        } else {
            // Wait for scripts to load
            const checkLoaded = setInterval(() => {
                if (window.PromptReviews && window.Swiper) {
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

        // Initialize widget
        const container = document.getElementById('widget-container');
        if (container) {
            window.PromptReviews.renderMultiWidget(container, widgetData);
        }
    }, [isLoaded]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-8">Multi Widget Test</h1>
            <div id="widget-container" className="max-w-7xl mx-auto"></div>
        </div>
    );
} 