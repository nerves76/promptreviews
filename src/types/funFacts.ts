/**
 * Fun Facts Feature Types
 *
 * Types for the Fun Facts feature that displays business information
 * as key-value pairs on prompt pages.
 */

export interface FunFact {
  /** Unique identifier for the fact */
  id: string;
  /** Label/title of the fact (e.g., "Year founded") */
  label: string;
  /** Value of the fact (e.g., "1995") */
  value: string;
  /** ISO timestamp when the fact was created */
  created_at: string;
}

export interface FunFactsSettings {
  /** Whether fun facts feature is enabled */
  enabled: boolean;
  /** Array of selected fun fact IDs for display */
  selectedFactIds: string[];
  /** All fun facts in the account library */
  allFacts: FunFact[];
}

export interface FunFactsApiResponse {
  facts: FunFact[];
}

export interface CreateFunFactRequest {
  label: string;
  value: string;
}

export interface DeleteFunFactRequest {
  factId: string;
}
