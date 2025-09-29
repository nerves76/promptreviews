# Google Business Optimizer Embed – Current Status

## TL;DR
- OAuth flow succeeds and we can fetch at least one real Google Business location, but the embed drops back to sample data after auto-selecting Murmur Creative.
- Location groups returned by Google (e.g. Murmur’s LOCATION_GROUP account) still fail on the Business Profile `accounts/{id}/locations` endpoint, so only the business-information fallback returns data.
- Because the second detail fetch returns `availableLocations: []`, the UI was clearing the selector and hiding the “Choose a different location” button until we patched it.
- We continue to see noisy `postMessage` warnings when running outside an iframe—the code attempts to contact the parent window even in standalone mode.

## Test Environment
- URL: `http://localhost:3002/embed/google-business-optimizer`
- Browser: Chrome (DevTools console output provided)
- Google account: `nerves76@gmail.com`
- Session reset via `localStorage.removeItem('google-biz-optimizer-*')` before each run

## Reproduction Steps
1. Visit the embed URL directly in the browser (not inside an iframe).
2. Clear prior session keys in DevTools console:
   ```js
   localStorage.removeItem('google-biz-optimizer-token');
   localStorage.removeItem('google-biz-optimizer-expiry');
   localStorage.removeItem('google-biz-optimizer-session-id');
   localStorage.removeItem('google-biz-optimizer-lead-id');
   ```
3. Refresh the page and click “Connect with Google.”
4. Complete the OAuth consent flow.
5. Observe the embed reload with a success toast and a short appearance of the real Murmur Creative data before the dashboard reverts to sample content.
6. Open DevTools → Network → `/api/embed/google-business/data` response logs.

## Observed Behaviour
- **First `/api/embed/google-business/data` call** (no `location` param):
  - `availableLocations` contains a single entry for `locations/13812146122422003226` (Murmur Creative).
  - `locationDebug` shows 404 responses for:
    - `https://businessprofile.googleapis.com/v1/accounts/116860748345887321994/locations`
    - `https://mybusiness.googleapis.com/v4/accounts/116860748345887321994/locations`
  - `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/116860748345887321994/locations` succeeds. This is the only source returning locations.
- **Second `/api/embed/google-business/data` call** (with `location` + `legacyLocation` query params):
  - Returns business info + reviews for Murmur but an empty `availableLocations` array.
  - Prior to the latest patch, the UI set state with that empty array and hid the selector, forcing the sample content path.
- **UI symptoms**:
  - “Choose a different location” button appears briefly, then vanishes.
  - No way to pick other verified businesses from the group (they are never loaded or displayed).
- **Console noise**:
  - Repeated `Failed to execute 'postMessage' on 'DOMWindow': The target origin provided (…) does not match…` because we keep broadcasting to the parent even when running standalone.

## Root Causes Identified
1. **Location-group API mismatch** – The Business Profile v1 API requires `locationGroups/{id}/locations` instead of `accounts/{id}/locations` for LOCATION_GROUP accounts. We only recently added the legacy fallback and now the v1 location-group endpoints; prior requests were 404’ing, so only Murmur (first location) was ever returned.
2. **State overwrite on detail fetch** – The second fetch (detail call) returns `availableLocations: []`, and we were overwriting the existing list, erasing the selector.
3. **Auto-selection hides selector** – When only one location is found the code auto-selects it and closes the chooser. That’s acceptable if there is truly one business, but in our case we have more businesses hidden behind the failing endpoints.
4. **Iframe messaging in standalone mode** – The embed constantly posts resize events to the parent. When not framed, this throws warnings that can mask useful console output.

## Latest Changes (24 Sep)
- Added canonical `locations/{id}` normalization for every returned location so detail/review/insight calls succeed even when the API mixes account/path formats.
- Added Business Profile + Business Information location-group endpoints to the fetcher to avoid the 404s.
- Prevented the second detail response from clearing `availableLocations` when empty, so the selector persists.

## Latest Fixes (27 Sep 2025)
- **Fixed postMessage warnings**: Added iframe detection to prevent posting messages when running standalone
- **Fixed location list persistence**: Implemented caching mechanism to preserve availableLocations between API calls
- **Fixed sample data fallback**: Replaced hardcoded sample data with proper "no data available" state
- **Enhanced debug capabilities**: Added debug endpoint and UI button for detailed diagnostics
- **Improved location selector UX**: Made selector always accessible, shows location count, and includes address hints
- **Aggregated location-group fetches**: Merge results across account + location-group endpoints so multi-location groups surface every business
- **Location group warning banner**: Detects when Google only returns one location from a LOCATION_GROUP account and prompts the user to move other listings into the group
- **Explicit location selection**: Embed now keeps metrics in preview mode until the user picks a location, preventing auto-loading a single listing and then asking for a manual choice
- **Shared overview pipeline**: Embed detail requests now reuse the app’s overview aggregator, so profile optimization and opportunities stay consistent across both surfaces
- **Personal account inclusion**: PERSONAL accounts are no longer skipped when listing counts are missing, allowing single-owner profiles to populate the selector

## Outstanding Issues (After Fixes)
1. **Missing additional businesses in group** – Even with the new fallback, we still receive only Murmur Creative in `availableLocations`. This appears to be a Google API limitation or account configuration issue. The debug endpoint can help diagnose whether:
   - Other businesses exist but aren't being returned
   - The account truly only has one location
   - OAuth scopes are limiting access

## Resolved Issues
- ✅ **postMessage warnings** - Fixed by checking `window.parent !== window` before posting
- ✅ **State persistence** - Fixed with `cachedLocationsRef` to preserve location list
- ✅ **Sample data fallback** - Fixed with proper "no data available" state
- ✅ **Selector UX** - Fixed with persistent "Change Location" button showing count
- ✅ **Debug visibility** - Added debug endpoint and UI button for diagnostics

## How to Use Debug Features
1. **Debug Button**: Click the purple "Debug" button when connected to see:
   - Google email associated with the OAuth token
   - All accounts found and their types (PERSONAL, LOCATION_GROUP, etc.)
   - Number of locations discovered
   - API endpoint attempts and their status

2. **Debug API Endpoint**: Call `/api/embed/google-business/data?debug=true` for detailed JSON output including:
   - Full account metadata
   - Location samples
   - API attempt history
   - Session information

3. **Console Logging**: Enhanced logging throughout shows:
   - 🔍 LOCATION_GROUP detection
   - 📍 Location caching events
   - ✅ Successful API calls with location counts
   - ⚠️ Data availability warnings

## Suggested Fix Plan
1. **API layer**
   - Instrument `fetchLocationsForAccount` to log which endpoint (account vs location-group) succeeded for LOCATION_GROUP accounts.
   - If location-group endpoints still return 404/empty, consider using `accounts:list` to enumerate `accountName` slugs and call the Business Profile `locations:search` endpoint as a fallback.
   - Expose a debug endpoint (`/api/embed/google-business/data?debug=1`) that returns the raw accounts/locations payload to help diagnose customer issues without touching the UI.

2. **Frontend**
   - Cache the first non-empty `availableLocations` array in state and reuse it for subsequent renders.
   - Keep the “Choose a different location” UI visible (or move to a dropdown) even when only one location was initially detected.
   - Show a clear error card instead of booting back to the demo data when no live metrics are available.

3. **Testing**
   - Manual: use a Google account with multiple verified businesses across different groups and confirm each appears in the selector.
   - Automated: add integration tests that mock the API layer returning multiple locations and ensure the selector/metrics update correctly when switching.

## Tracking & Follow-Up
- Create tickets for:
  1. Location-group API support (ensure `business-profile-location-group` success).
  2. UI selector persistence & no-data messaging.
  3. postMessage hardening for embed vs standalone.
  4. Automated tests covering multi-location flows.
- Once fixes land, re-test the embed both standalone and inside an iframe on the marketing WordPress site.
