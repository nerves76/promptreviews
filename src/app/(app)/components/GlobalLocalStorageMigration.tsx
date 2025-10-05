"use client";
import { useEffect } from 'react';
import { useAuth } from "@/auth";

// One-time client-side localStorage migration to improve account isolation
export default function GlobalLocalStorageMigration() {
  const { account } = useAuth();
  const accountId = account?.id || null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1) Remove legacy promptPageForm_* keys without account prefix
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('promptPageForm_')) {
          // Old format: promptPageForm_<campaign>_<id> (one underscore after prefix)
          // New format: promptPageForm_<account>_<campaign>_<id> (two underscores after prefix)
          const suffix = key.replace('promptPageForm_', '');
          const underscoreCount = (suffix.match(/_/g) || []).length;
          if (underscoreCount === 1) {
            keysToDelete.push(key);
          }
        }
      }
      keysToDelete.forEach(k => localStorage.removeItem(k));

      // 2) Migrate BusinessInfoEditor legacy keys to account-scoped when possible
      if (accountId) {
        const legacyBizFormKey = 'businessInfoEditorForm';
        const legacySelectedLocationsKey = 'business-info-selected-locations';
        const newBizFormKey = `businessInfoEditorForm_${accountId}`;
        const newSelectedLocationsKey = `business-info-selected-locations_${accountId}`;

        // If new keys are empty but legacy exists, move values
        const legacyForm = localStorage.getItem(legacyBizFormKey);
        if (legacyForm && !localStorage.getItem(newBizFormKey)) {
          localStorage.setItem(newBizFormKey, legacyForm);
          localStorage.removeItem(legacyBizFormKey);
        }

        const legacyLocations = localStorage.getItem(legacySelectedLocationsKey);
        if (legacyLocations && !localStorage.getItem(newSelectedLocationsKey)) {
          localStorage.setItem(newSelectedLocationsKey, legacyLocations);
          localStorage.removeItem(legacySelectedLocationsKey);
        }

        // 3) Optionally migrate widgetEditorForm_* keys lacking account scope for 'new'
        // - Old: widgetEditorForm_new
        // - New: widgetEditorForm_<account>_new
        const widgetKeysToMigrate: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key === 'widgetEditorForm_new') {
            widgetKeysToMigrate.push(key);
          }
        }
        widgetKeysToMigrate.forEach((oldKey) => {
          const val = localStorage.getItem(oldKey);
          if (val) {
            const newKey = `widgetEditorForm_${accountId}_new`;
            if (!localStorage.getItem(newKey)) {
              localStorage.setItem(newKey, val);
            }
          }
          localStorage.removeItem(oldKey);
        });
      }
    } catch (e) {
      // Silently ignore migration errors; this is non-critical
      console.warn('LocalStorage migration encountered an issue:', e);
    }
  }, [accountId]);

  return null;
}

