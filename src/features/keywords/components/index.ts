// Unified Keyword System - UI Components

export { default as KeywordChip, SimpleKeywordChip } from './KeywordChip';
export {
  default as KeywordGroupAccordion,
  UngroupedKeywordsSection,
} from './KeywordGroupAccordion';
export { default as KeywordManager } from './KeywordManager';
export { default as UnifiedKeywordsInput } from './UnifiedKeywordsInput';
export { default as KeywordRotationPanel } from './KeywordRotationPanel';
export {
  default as KeywordRotationAlerts,
  KeywordRotationBadge,
} from './KeywordRotationAlerts';
export { default as KeywordConceptInput } from './KeywordConceptInput';
export {
  KeywordDetailsSidebar,
  type KeywordDetailsSidebarProps,
} from './KeywordDetailsSidebar';
export { default as ConceptCard } from './ConceptCard';
export { default as CollapsibleSection } from './CollapsibleSection';

// Legacy adapter - provides same interface as old KeywordsInput but uses unified system
export { default as KeywordsInputLegacyAdapter } from './KeywordsInputLegacyAdapter';
