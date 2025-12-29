/**
 * FAQs tab component for the help modal
 * Displays frequently asked questions with search and categorization
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { FAQ, PlanType } from './types';
import { useSubscription } from '@/auth';
import { trackEvent } from '@/utils/analytics';

interface FAQsTabProps {
  pathname: string;
  contextKeywords: string[];
  pageName: string;
}

export default function FAQsTab({ 
  pathname, 
  contextKeywords,
  pageName 
}: FAQsTabProps) {
  const { currentPlan } = useSubscription();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get user's current plan
  const userPlan: PlanType = (currentPlan as PlanType) || 'grower';

  // Extract unique categories from FAQs
  const categories = ['all', ...new Set(faqs.map(faq => faq.category))];

  useEffect(() => {
    fetchFaqs();
  }, [pathname, contextKeywords, pageName]);

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const response = await fetch('/api/docs/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextKeywords,
          plan: userPlan,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery || undefined,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
      } else {
        console.error('Failed to fetch FAQs');
        setFaqs([]);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([]);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleFaqClick = (faq: FAQ) => {
    const isExpanding = expandedFaq !== faq.id;
    setExpandedFaq(isExpanding ? faq.id : null);
    
    if (isExpanding) {
      trackEvent('help_faq_clicked', {
        faq_id: faq.id,
        faq_question: faq.question,
        context: pathname,
        relevance_score: faq.relevanceScore
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setExpandedFaq(null); // Close any expanded FAQ when changing category
    trackEvent('help_faq_category_changed', {
      category,
      context: pathname
    });
  };

  // Filter FAQs by search query
  const filteredFaqs = faqs.filter(faq => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      (faq.tags?.some(tag => tag.toLowerCase().includes(query)) ?? false) ||
      faq.category.toLowerCase().includes(query)
    );
  }).filter(faq => {
    if (selectedCategory === 'all') return true;
    return faq.category === selectedCategory;
  });

  const formatCategoryName = (category: string) => {
    if (category === 'all') return 'All Categories';
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="p-6">
      {/* Context indicator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200/50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon name="FaQuestionCircle" className="w-4 h-4 text-purple-600" size={16} />
            <span className="text-sm font-medium text-purple-800">
              Frequently Asked Questions
            </span>
          </div>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
            {filteredFaqs.length} FAQs
          </span>
        </div>
        <p className="text-sm text-purple-700">
          Find quick answers to common questions about {pageName}.
        </p>
      </div>

      {/* Search and Category Filter */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Icon 
            name="FaSearch" 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" 
            size={16} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm text-gray-900"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm'
                  : 'bg-white/80 text-gray-900 hover:bg-white border border-gray-200/50'
              }`}
            >
              {formatCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs List */}
      {loadingFaqs ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-800">Loading FAQs...</span>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="FaSearch" className="w-8 h-8 text-purple-400" size={32} />
          </div>
          <p className="text-gray-700">No FAQs found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-200/50 rounded-xl bg-white/95 backdrop-blur-sm hover:border-purple-300 hover:shadow-lg transition-all"
            >
                              <button
                  onClick={() => handleFaqClick(faq)}
                  className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-gray-100/80 text-gray-800 rounded-full">
                          {formatCategoryName(faq.category)}
                        </span>
                        {faq.plans && !faq.plans.includes('grower') && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            {faq.plans.includes('builder') ? 'Builder+' : 'Pro'}
                          </span>
                        )}
                        {faq.relevanceScore && faq.relevanceScore > 80 && (
                          <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                            Relevant
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon 
                      name={expandedFaq === faq.id ? "FaChevronUp" : "FaChevronDown"} 
                      className="w-4 h-4 text-gray-500 flex-shrink-0" 
                      size={16} 
                    />
                  </div>
                </button>
              
              {expandedFaq === faq.id && (
                <div className="px-4 pb-4 border-t border-gray-100/50">
                  <div className="pt-3 text-sm text-gray-900 leading-relaxed">
                    {faq.answer}
                  </div>
                  {(faq.tags?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100/50">
                      <div className="flex flex-wrap gap-1">
                        {faq.tags?.map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-gray-50/80 text-gray-800 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
