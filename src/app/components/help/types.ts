/**
 * Type definitions for the Help system
 */

export type TabType = 'tutorials' | 'issues';
export type FeedbackCategory = 'bug_report' | 'feature_request' | 'general_feedback';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  relevanceScore?: number;
}

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CategoryOption {
  value: FeedbackCategory;
  label: string;
  icon: string;
  description: string;
}

export interface HelpContext {
  pathname: string;
  keywords: string[];
  pageName?: string;
}