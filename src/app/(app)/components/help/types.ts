/**
 * Type definitions for the Help system
 */

export type TabType = 'tutorials' | 'faqs' | 'issues';
export type FeedbackCategory = 'bug_report' | 'feature_request' | 'general_feedback';

export type PlanType = 'grower' | 'builder' | 'maven' | 'enterprise';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  plans?: PlanType[]; // Which plans can access this tutorial
  relevanceScore?: number;
}

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArticleId?: string;
  initialKeywords?: string[];
  initialTab?: TabType;
}

export interface CategoryOption {
  value: FeedbackCategory;
  label: string;
  icon: string;
  description: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  plans?: PlanType[];
  relevanceScore?: number;
}

export interface HelpContext {
  pathname: string;
  keywords: string[];
  pageName?: string;
}
