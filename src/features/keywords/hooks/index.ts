// Unified Keyword System - React Hooks

export { useKeywords, useKeywordDetails } from './useKeywords';
export { useRelatedQuestions } from './useRelatedQuestions';

// New hooks for keyword concept refactoring
export {
  useAIEnrichment,
  applyEnrichmentResult,
  hasExistingEnrichmentData,
  hasEmptyEnrichmentFields,
  type EnrichmentResult,
  type UseAIEnrichmentOptions,
  type UseAIEnrichmentReturn,
} from './useAIEnrichment';

export {
  useVolumeData,
  getTermVolume,
  hasTermVolume,
  type UseVolumeDataOptions,
  type UseVolumeDataReturn,
} from './useVolumeData';

export {
  useRankStatus,
  getDiscoveredQuestions,
  getAveragePosition,
  getBestPosition,
  hasSerpVisibility,
  getRankingsForTerm,
  type SerpVisibility,
  type DiscoveredQuestion,
  type RankingData,
  type RankStatusResponse,
  type UseRankStatusOptions,
  type UseRankStatusReturn,
} from './useRankStatus';

export {
  useKeywordEditor,
  type RelevanceWarning,
  type UseKeywordEditorOptions,
  type UseKeywordEditorReturn,
} from './useKeywordEditor';
