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
    label: "Business profile",
    icon: "FaStore",
    description: "Edit your business details",
  },
  {
    path: "/community",
    label: "Community",
    icon: "FaUsers",
    description: "Connect with other users",
  },
];

/**
 * Reviews section - core product features
 */
export const REVIEWS_SECTION: NavSection = {
  id: "reviews",
  label: "Get reviews",
  icon: "FaStar",
  collapsible: false,
  items: [
    {
      path: "/prompt-pages",
      label: "Prompt Pages",
      icon: "prompty",
      description: "Create review collection pages",
    },
    {
      path: "/dashboard/reviews",
      label: "Reviews",
      icon: "FaStar",
      description: "Manage, verify, and share",
    },
    {
      path: "/dashboard/widget",
      label: "Widgets",
      icon: "FaCode",
      description: "Embed on your website",
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
  ],
};

/**
 * Google Business section
 */
export const GOOGLE_BUSINESS_SECTION: NavSection = {
  id: "google-business",
  label: "Google Business Profile",
  icon: "FaGoogle",
  collapsible: false,
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
      label: "Post scheduling",
      icon: "FaCalendarAlt",
      description: "Queue and schedule posts",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/integrations",
      label: "Connect",
      icon: "FaShare",
      description: "Connect GBP, Bluesky, and LinkedIn",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/rss-feeds",
      label: "RSS feeds",
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
  label: "SEO & AI visibility",
  icon: "FaChartLine",
  collapsible: false,
  items: [
    {
      path: "/dashboard/keywords",
      label: "Keyword Concepts",
      icon: "FaKey",
      description: "Manage your keyword library.",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/local-ranking-grids",
      label: "Local ranking grids",
      icon: "FaMapMarker",
      description: "Track local search rankings",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/keywords/llm-visibility",
      label: "AI Search",
      icon: "FaSparkles",
      description: "Track LLM visibility",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/research",
      label: "Research",
      icon: "FaSearch",
      description: "Keywords, domains, backlinks",
      requiresBusiness: true,
    },
    {
      path: "/dashboard/rank-tracking",
      label: "Rank tracking",
      icon: "FaChartLine",
      description: "Track rankings in Google",
      requiresBusiness: true,
    },
  ],
};

/**
 * Bottom navigation items (conditional)
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard/analytics",
    label: "Analytics",
    icon: "FaChartLine",
    description: "View performance metrics",
    requiresBusiness: true,
  },
  {
    path: "/work-manager",
    label: "Work Manager",
    icon: "FaBriefcase",
    description: "Manage tasks and workflows",
    conditional: "workManager",
  },
];

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
