/**
 * Platform adapter registry
 *
 * Central lookup for review platform adapters.
 */

import type { DataForSEOPlatformId, ReviewPlatformAdapter, SearchFieldConfig } from '../types';
import { trustpilotAdapter } from './trustpilot-adapter';
import { tripadvisorAdapter } from './tripadvisor-adapter';
import { googlePlayAdapter } from './google-play-adapter';
import { appStoreAdapter } from './app-store-adapter';

const adapters: Record<DataForSEOPlatformId, ReviewPlatformAdapter> = {
  trustpilot: trustpilotAdapter,
  tripadvisor: tripadvisorAdapter,
  google_play: googlePlayAdapter,
  app_store: appStoreAdapter,
};

export function getAdapter(id: DataForSEOPlatformId): ReviewPlatformAdapter {
  const adapter = adapters[id];
  if (!adapter) {
    throw new Error(`Unknown platform: ${id}`);
  }
  return adapter;
}

export function getSupportedPlatforms(): {
  id: DataForSEOPlatformId;
  displayName: string;
  searchFields: SearchFieldConfig[];
}[] {
  return Object.values(adapters).map((adapter) => ({
    id: adapter.platformId,
    displayName: adapter.platformDisplayName,
    searchFields: adapter.getSearchFields(),
  }));
}
