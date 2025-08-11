/**
 * Tutorials tab component for the help modal
 * Enhanced with article association and behavioral tracking
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { Tutorial } from './types';
import { calculateRelevanceScore } from './contextMapper';
import { 
  trackUserAction, 
  getRecommendedArticles,
  getPageKeywords 
} from './articleAssociation';
import { trackEvent } from '../../../utils/analytics';

interface TutorialsTabProps {
  pathname: string;
  contextKeywords: string[];
  pageName: string;
}

export default function TutorialsTab({ 
  pathname, 
  contextKeywords,
  pageName 
}: TutorialsTabProps) {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loadingTutorials, setLoadingTutorials] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedArticles, setRecommendedArticles] = useState<string[]>([]);

  useEffect(() => {
    fetchTutorials();
    // Track page view for behavioral recommendations
    trackUserAction({
      action: 'page_view',
      page: pathname,
      timestamp: new Date(),
      success: true,
      context: pageName
    });
  }, [pathname, contextKeywords, pageName]);

  const fetchTutorials = async () => {
    setLoadingTutorials(true);
    try {
      // Get recommended articles based on current page and user behavior
      const recommendations = getRecommendedArticles(pathname, 3);
      setRecommendedArticles(recommendations);
      
      // Combine context keywords with page-specific keywords
      const pageKeywords = getPageKeywords(pathname);
      const allKeywords = [...new Set([...contextKeywords, ...pageKeywords])];
      
      const response = await fetch('/api/help-docs/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: allKeywords,
          pathname: pathname,
          recommendedArticles: recommendations
        })
      });

      if (response.ok) {
        const data = await response.json();
        const tutorialsWithScores = data.tutorials.map((tutorial: Tutorial) => ({
          ...tutorial,
          relevanceScore: calculateRelevanceScore(tutorial, allKeywords)
        }));
        setTutorials(tutorialsWithScores);
      } else {
        // Fallback to mock data if API not available
        setTutorials(getMockTutorials(allKeywords));
      }
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      // Fallback to mock data
      setTutorials(getMockTutorials(contextKeywords));
    } finally {
      setLoadingTutorials(false);
    }
  };

  const getMockTutorials = (keywords: string[]): Tutorial[] => {
    const allTutorials: Tutorial[] = [
      {
        id: '1',
        title: 'Getting Started with Prompt Pages',
        description: 'Learn how to create your first prompt page to collect customer reviews',
        url: 'https://docs.promptreviews.app/getting-started',
        category: 'getting-started',
        tags: ['prompt-pages', 'create', 'setup']
      },
      {
        id: '2',
        title: 'Customizing Your Business Profile',
        description: 'Set up your business information, branding, and contact details',
        url: 'https://docs.promptreviews.app/business/profile-setup',
        category: 'business',
        tags: ['business', 'profile', 'branding']
      },
      {
        id: '3',
        title: 'Managing Contacts and Import Options',
        description: 'Upload, organize, and manage your customer contacts effectively',
        url: 'https://docs.promptreviews.app/contacts/management',
        category: 'contacts',
        tags: ['contacts', 'upload', 'import', 'manage']
      },
      {
        id: '4',
        title: 'Embedding Review Widgets',
        description: 'Add review widgets to your website to showcase customer feedback',
        url: 'https://docs.promptreviews.app/widgets/embedding',
        category: 'widgets',
        tags: ['widgets', 'embed', 'website']
      },
      {
        id: '5',
        title: 'Google Business Profile Integration',
        description: 'Connect and sync with your Google Business Profile for enhanced visibility',
        url: 'https://docs.promptreviews.app/integrations/google-business',
        category: 'integrations',
        tags: ['google', 'business-profile', 'integration']
      },
      {
        id: '6',
        title: 'Dashboard Overview and Navigation',
        description: 'Understanding your dashboard and key features',
        url: 'https://docs.promptreviews.app/dashboard/overview',
        category: 'dashboard',
        tags: ['dashboard', 'overview', 'navigation']
      }
    ];

    // Add relevance scores and sort
    return allTutorials
      .map(tutorial => ({
        ...tutorial,
        relevanceScore: calculateRelevanceScore(tutorial, keywords)
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 6);
  };

  const handleTutorialClick = (tutorial: Tutorial) => {
    // Track tutorial click for behavioral recommendations
    trackUserAction({
      action: 'tutorial_clicked',
      page: pathname,
      timestamp: new Date(),
      success: true,
      context: tutorial.title
    });
    
    trackEvent('help_tutorial_clicked', {
      tutorial_id: tutorial.id,
      tutorial_title: tutorial.title,
      context: pathname,
      relevance_score: tutorial.relevanceScore
    });
    
    window.open(tutorial.url, '_blank', 'noopener,noreferrer');
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tutorial.title.toLowerCase().includes(query) ||
      tutorial.description.toLowerCase().includes(query) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6">
      {/* Context indicator */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon name="FaMapMarkerAlt" className="w-4 h-4 text-blue-600" size={16} />
            <span className="text-sm font-medium text-blue-800">
              {pageName}
            </span>
          </div>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            Smart recommendations
          </span>
        </div>
        <p className="text-sm text-blue-700">
          These tutorials are tailored to what you're working on and your recent activity.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Icon 
            name="FaSearch" 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
            size={16} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          />
        </div>
      </div>

      {/* Tutorials List */}
      {loadingTutorials ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue"></div>
          <span className="ml-3 text-gray-600">Loading tutorials...</span>
        </div>
      ) : filteredTutorials.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="FaSearch" className="w-12 h-12 text-gray-300 mx-auto mb-3" size={48} />
          <p className="text-gray-500">No tutorials found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              onClick={() => handleTutorialClick(tutorial)}
              className="p-4 border border-gray-200 rounded-lg hover:border-slate-blue hover:shadow-md transition-all cursor-pointer group bg-white"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900 group-hover:text-slate-blue transition-colors line-clamp-2">
                  {tutorial.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {recommendedArticles.includes(tutorial.id) && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full whitespace-nowrap">
                      Recommended
                    </span>
                  )}
                  {tutorial.relevanceScore && tutorial.relevanceScore > 80 && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                      Relevant
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {tutorial.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {tutorial.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <Icon 
                  name="FaExternalLinkAlt" 
                  className="w-4 h-4 text-gray-400 group-hover:text-slate-blue transition-colors flex-shrink-0" 
                  size={16} 
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Browse all tutorials link */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <a
          href="https://docs.promptreviews.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-slate-blue hover:text-slate-blue/80 font-medium"
          onClick={() => trackEvent('help_browse_all_clicked', { context: pathname })}
        >
          <Icon name="FaBook" className="w-4 h-4" size={16} />
          <span>Browse all tutorials</span>
          <Icon name="FaExternalLinkAlt" className="w-3 h-3" size={12} />
        </a>
      </div>
    </div>
  );
}