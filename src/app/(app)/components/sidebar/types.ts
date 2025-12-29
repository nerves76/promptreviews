import { IconName } from "@/components/Icon";

/**
 * Represents a single navigation item in the sidebar
 */
export interface NavItem {
  /** Unique identifier (URL path) */
  path: string;
  /** Display label for the nav item */
  label: string;
  /** Icon name from the Icon component */
  icon: IconName;
  /** Optional description shown in tooltips */
  description?: string;
  /** If true, item is disabled when user has no business */
  requiresBusiness?: boolean;
  /** Conditional rendering rules */
  conditional?: "workManager" | "gbpAccess" | "adminOnly";
  /** External link (opens in new tab) */
  external?: boolean;
}

/**
 * Represents a collapsible section in the sidebar
 */
export interface NavSection {
  /** Unique section identifier */
  id: string;
  /** Section header label */
  label: string;
  /** Icon for the section header */
  icon?: IconName;
  /** Navigation items within this section */
  items: NavItem[];
  /** If true, section is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * Database record for a pinned favorite
 */
export interface SidebarFavorite {
  id: string;
  account_id: string;
  nav_item_path: string;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

/**
 * Sidebar component state
 */
export interface SidebarState {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Collapsed sections by ID */
  collapsedSections: Record<string, boolean>;
}

/**
 * Props for the main Sidebar component
 */
export interface SidebarProps {
  /** Current active path */
  activePath?: string;
  /** Whether the user has a business profile */
  hasBusiness?: boolean;
  /** Whether user has multiple accounts */
  hasMultipleAccounts?: boolean;
  /** Whether user has access to GBP features */
  hasGbpAccess?: boolean;
  /** Whether user is admin */
  isAdmin?: boolean;
}

/**
 * Props for SidebarNavItem component
 */
export interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isFavorited: boolean;
  isDisabled?: boolean;
  onToggleFavorite: (path: string) => void;
}

/**
 * Props for SidebarSection component
 */
export interface SidebarSectionProps {
  section: NavSection;
  activePath: string;
  isCollapsed: boolean;
  isSectionCollapsed: boolean;
  favorites: string[];
  disabledItems?: string[];
  onToggleSection: (sectionId: string) => void;
  onToggleFavorite: (path: string) => void;
}

/**
 * Props for SidebarFavorites component
 */
export interface SidebarFavoritesProps {
  favorites: SidebarFavorite[];
  activePath: string;
  isCollapsed: boolean;
  isLoading?: boolean;
  onRemoveFavorite: (path: string) => void;
}

/**
 * Props for SidebarTooltip component
 */
export interface SidebarTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "right" | "top" | "bottom";
  disabled?: boolean;
}
