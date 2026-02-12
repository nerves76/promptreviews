import { NavSection, NavItem } from "./types";

/**
 * Top standalone navigation items
 */
export const TOP_NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "FaHome",
    description: "Overview and quick actions",
  },
  {
    path: "/dashboard/business-profile",
    label: "Business Profile",
    icon: "FaStore",
    description: "Edit your business details",
  },
  {
    path: "/work-manager",
    label: "Work Manager",
    icon: "FaBriefcase",
    description: "Manage tasks and workflows",
    conditional: "workManager",
  },
  {
    path: "/community",
    label: "Community",
    icon: "FaUsers",
    description: "Connect with other users",
  },
  {
    path: "/dashboard/integrations",
    label: "Connect",
    icon: "FaShare",
    description: "Connect GBP, Bluesky, and LinkedIn",
    requiresBusiness: true,
  },
];

/**
 * Reviews section - core product features
 */
export const REVIEWS_SECTION: NavSection = {
  id: "reviews",
  label: "Get Reviews",
  icon: "FaStar",
  collapsible: true,
  items: [
    {
      path: "/prompt-pages",
      label: "Prompt Pages",
      icon: "promptPages",
      description: "Create review collection pages",
    },
    {
      path: "/prompt-pages?tab=campaign",
      label: "Campaigns",
      icon: "FaCommentDots",
      description: "Run personalized review campaigns",
    },
    {
      path: "/dashboard/reviews",
      label: "Reviews",
      icon: "FaStar",
      description: "Manage, verify, and share",
    },
    {
      path: "/dashboard/review-import",
      label: "Review Import",
      icon: "FaUpload",
      description: "Import from Trustpilot, TripAdvisor, and more",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/widget",
      label: "Widgets",
      icon: "FaCode",
      description: "Embed on your website",
    },
    {
      path: "/dashboard/surveys",
      label: "Surveys",
      icon: "FaFileAlt",
      description: "Create and manage surveys",
    },
    {
      path: "/dashboard/contacts",
      label: "Contacts",
      icon: "FaUsers",
      description: "Upload and manage contacts",
    },
    {
      path: "/dashboard/get-reviews/sentiment-analyzer",
      label: "Sentiment Analyzer",
      icon: "FaSentimentAnalyzer",
      description: "AI insights and discovery",
    },
    {
      path: "/dashboard/analytics",
      label: "Analytics",
      icon: "FaChartBar",
      description: "View performance metrics",
      requiresBusiness: true,
    },
  ],
};

/**
 * Google Business section
 */
export const GOOGLE_BUSINESS_SECTION: NavSection = {
  id: "google-business",
  label: "Google Business Profile",
  icon: "FaGoogle",
  collapsible: true,
  items: [
    {
      path: "/dashboard/google-business",
      label: "Google Business Profile",
      icon: "FaGoogle",
      description: "Manage your Google Business Profile",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/social-posting",
      label: "Post Scheduling",
      icon: "FaCalendarAlt",
      description: "Queue and schedule posts",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/rss-feeds",
      label: "RSS Feeds",
      icon: "FaRss",
      description: "Auto post from RSS to GBP, LinkedIn, and Blue Sky.",
      requiresBusiness: true,
    },
  ],
};

/**
 * SEO & AI Visibility section
 */
export const SEO_VISIBILITY_SECTION: NavSection = {
  id: "seo-visibility",
  label: "SEO & AI Visibility",
  icon: "FaChartLine",
  collapsible: true,
  defaultCollapsed: true,
  items: [
    {
      path: "/dashboard/research",
      label: "Research",
      icon: "FaSearch",
      description: "Keywords, domains, backlinks",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/keywords",
      label: "Keyword Concepts",
      icon: "FaKey",
      description: "Manage your keyword library.",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/local-ranking-grids",
      label: "Local Ranking Grids",
      icon: "FaMapMarker",
      description: "Track local search rankings",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/ai-search",
      label: "LLM Visibility",
      icon: "FaSparkles",
      description: "Track visibility in ChatGPT and more!",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/keywords/rank-tracking",
      label: "Rank Tracking",
      icon: "FaChartLine",
      description: "Track rankings in Google",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/web-page-outlines",
      label: "Web Page Planner",
      icon: "FaFileAlt",
      description: "AI-powered web page content planner",
      requiresBusiness: true,
    },
  ],
};

/**
 * Bottom navigation items (conditional)
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [];

/**
 * All navigation sections for the sidebar
 */
export const NAV_SECTIONS: NavSection[] = [
  REVIEWS_SECTION,
  GOOGLE_BUSINESS_SECTION,
  SEO_VISIBILITY_SECTION,
];

// Legacy exports for compatibility
export const DASHBOARD_NAV: NavItem = TOP_NAV_ITEMS[0];
export const OTHER_NAV_ITEMS: NavItem[] = BOTTOM_NAV_ITEMS;

/**
 * Get all navigation items as a flat array (for favorites lookup)
 */
export function getAllNavItems(): NavItem[] {
  return [
    ...TOP_NAV_ITEMS,
    ...NAV_SECTIONS.flatMap((section) => section.items),
    ...BOTTOM_NAV_ITEMS,
  ];
}

/**
 * Find a nav item by its path
 */
export function findNavItemByPath(path: string): NavItem | undefined {
  return getAllNavItems().find((item) => item.path === path);
}

/**
 * Check if a path matches a nav item (including nested routes)
 */
export function isPathActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === "/dashboard") {
    // Dashboard should only be active on exact match
    return currentPath === "/dashboard";
  }
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
}
