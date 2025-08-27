/**
 * Help System Configuration
 * Centralized configuration for the help system integration
 */

export const HELP_CONFIG = {
  // API Configuration
  api: {
    docsUrl: process.env.DOCS_API_URL || 'https://docs.promptreviews.app/api/search',
    timeout: 5000, // 5 seconds
    maxRetries: 2,
    fallbackEnabled: true
  },
  
  // UI Configuration
  ui: {
    keyboardShortcut: '?',
    bubblePosition: {
      bottom: '1.5rem', // 6 in Tailwind
      right: '1.5rem'   // 6 in Tailwind
    },
    modalSize: {
      maxWidth: '64rem', // max-w-4xl
      maxHeight: '90vh'
    },
    maxTutorials: 6,
    searchDebounce: 300 // milliseconds
  },
  
  // Behavioral Tracking
  tracking: {
    enabled: true,
    maxActions: 50, // Store last 50 user actions
    relevanceThreshold: 80, // Minimum score for "Relevant" badge
    recommendationThreshold: 60 // Minimum score for recommendations
  },
  
  // Article Categories
  categories: {
    'getting-started': { priority: 'high', color: 'blue' },
    'prompt-pages': { priority: 'high', color: 'green' },
    'contacts': { priority: 'high', color: 'purple' },
    'ai': { priority: 'medium', color: 'orange' },
    'support': { priority: 'medium', color: 'gray' },
    'integrations': { priority: 'medium', color: 'indigo' },
    'business': { priority: 'medium', color: 'teal' },
    'widgets': { priority: 'medium', color: 'pink' }
  },
  
  // Default Fallback Content
  fallback: {
    title: 'Help & Support',
    description: 'Get help, find tutorials, or report issues',
    tutorials: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'Quick start guide for new users',
        url: 'https://docs.promptreviews.app/getting-started',
        category: 'getting-started',
        tags: ['getting-started', 'setup', 'overview']
      }
    ]
  }
};

/**
 * Get category configuration
 */
export function getCategoryConfig(category: string) {
  return HELP_CONFIG.categories[category as keyof typeof HELP_CONFIG.categories] || 
         { priority: 'low', color: 'gray' };
}

/**
 * Check if help system is enabled
 */
export function isHelpEnabled(): boolean {
  return true; // Can be extended with feature flags
}

/**
 * Get API URL with fallback
 */
export function getDocsApiUrl(): string {
  return HELP_CONFIG.api.docsUrl;
}
