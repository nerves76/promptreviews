# Concept Schedule Feature Changelog

## [2025-12-28]
### Added - Review Matching Support
- **New check type**: Review matching can now be included in concept schedules
- **Database**: Added `review_matching_enabled` column to `concept_schedules` table
- **Cost**: 1 credit per review matching check (flat rate)
- **UI**: Added toggle in Schedule Settings Modal with amber star icon
- **Cost Display**: Review matching now shows in cost breakdown display

### Files Changed
- `services/credits.ts` - Added `REVIEW_MATCHING_CREDIT_COST` and updated cost calculation
- `utils/types.ts` - Added `ReviewMatchingCostBreakdown` and `reviewMatchingResult` types
- `components/ScheduleSettingsModal.tsx` - Added review matching toggle
- `components/CostBreakdownDisplay.tsx` - Added review matching line item

### Related
- Manual review check: `POST /api/keywords/[id]/check-reviews` (1 credit)
- Cron job: `/api/cron/run-scheduled-concepts` now executes review matching

## [2025-12-27]
### Initial Implementation
- Created concept schedule system for unified keyword tracking
- Supports: Search rank, Geo-grid, LLM visibility checks
- Database table: `concept_schedules` with scheduling options (daily/weekly/monthly)
- Features:
  - Cost estimation before scheduling
  - Automatic pausing of individual schedules when concept schedule is created
  - Restoration of paused schedules when concept schedule is deleted
  - Credit checking and deduction with refund on failure
