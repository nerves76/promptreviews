# Kanban View Implementation for Campaign Prompt Pages

## Overview

This document outlines the implementation plan for adding a Kanban board view to the Individual Prompt Pages feature (`/prompt-pages/individual`). The Kanban view will provide a visual, drag-and-drop interface for managing prompt pages organized by their status.

## Current State

The Individual Prompt Pages currently display as a table (PromptPagesTable component) with:
- Tab-based filtering by status (Draft, In Queue, Sent, Follow Up, Complete)
- Sorting by first name, last name, or review type
- Bulk actions (status updates, delete)
- Communication buttons (SMS, Email, WhatsApp)
- Share/embed features (QR codes, copy link)

## Goals

1. **Add Kanban view** as an alternative to the table view
2. **Enable custom status labels** that users can edit per account
3. **Maintain existing functionality** while simplifying the Kanban UI
4. **Preserve accessibility** and mobile responsiveness

## Design Decisions

### Layout
- **5 columns** representing the 5 status states (Draft, In Queue, Sent, Follow Up, Complete)
- **Horizontal scroll** for responsive design (works on mobile, tablet, desktop)
- **Vertical scroll within columns** (like Trello) for handling many cards
- **Columns always visible** even when empty
- **Glassmorphic design** consistent with existing app styling

### Card States

#### Collapsed Card (Default)
- Contact name (first_name + last_name)
- Review type badge (service, product, video, photo, event)
- Created date
- Contact method icons (email/phone)
- Edit link (visible on hover)

#### Expanded Card (Click to Toggle)
- All collapsed state info PLUS:
- Full contact details
- Notes preview
- Communication buttons (SMS, Email, WhatsApp)
- Copy link button
- QR code button
- Last updated timestamp

### Drag & Drop
- Drag cards between any columns (no transition restrictions)
- Status updates immediately on drop
- Visual feedback: card lifts with shadow
- Supports mouse, keyboard, and touch input
- Accessible with ARIA labels and keyboard navigation

### Custom Status Labels
- Users can rename status columns (e.g., "Draft" → "To Do")
- Labels stored per account in database
- 20 character maximum per label
- Pencil icon in column header to edit
- Changes reflect immediately in both Kanban and Table views

### View Toggle
- Button to switch between Table and Kanban views
- User preference saved to localStorage per account
- Defaults to Table view for first-time users

### Filtering & Actions
- Type filter works across all Kanban columns
- Search by contact name (filters all columns)
- Bulk actions remain Table-only (not in Kanban view)
- No status dropdown in Kanban (drag to change status instead)

## Technical Architecture

### Technology Choices

#### Drag-and-Drop Library: @hello-pangea/dnd
**Why this library:**
- Maintained fork of react-beautiful-dnd
- React 19 and Next.js 15 compatible
- Best-in-class for Kanban/multi-list layouts
- Built-in accessibility (keyboard, screen reader)
- Touch device support
- Simple API for status-based columns

**Alternatives considered:**
- @dnd-kit: More flexible but more complex
- Pragmatic drag-and-drop: Overkill for this use case
- Native HTML5 drag-and-drop: Poor accessibility

### Database Schema

#### New Field: `accounts.prompt_page_status_labels`
```sql
ALTER TABLE accounts
ADD COLUMN prompt_page_status_labels JSONB DEFAULT '{
  "draft": "Draft",
  "in_queue": "In Queue",
  "sent": "Sent",
  "follow_up": "Follow Up",
  "complete": "Complete"
}'::jsonb;
```

**Design rationale:**
- PostgreSQL enum (`prompt_page_status`) remains unchanged for data integrity
- Custom labels are display-only, stored as JSONB
- Account-scoped (each business can customize independently)
- Backward compatible (defaults match current labels)
- Easy to extend later (could add colors, icons, etc.)

### Component Architecture

```
individual/page.tsx
├── View toggle (Table vs Kanban)
├── Type filter & search
├── PromptPagesTable (existing, updated with custom labels)
└── PromptPagesKanban (new)
    ├── useStatusLabels hook
    ├── StatusLabelEditor
    └── For each column:
        ├── Column header (custom label + edit icon)
        └── PromptPageCard[] (new)
            ├── Collapsed state (default)
            └── Expanded state (toggle)
```

## Implementation Plan

### Phase 1: Database & API (1-2 hours)

**Files to create:**
1. `/supabase/migrations/[timestamp]_add_custom_status_labels.sql`
2. `/src/app/api/account/status-labels/route.ts`
3. `/src/hooks/useStatusLabels.ts`

**Tasks:**
- Create migration to add `prompt_page_status_labels` JSONB field
- Apply migration: `npx supabase db push`
- Sync Prisma: `npx prisma db pull && npx prisma generate`
- Create API endpoint for GET/PUT operations
- Create React hook for fetching and updating labels

**API Endpoint Structure:**
```typescript
// GET /api/account/status-labels
// Returns: { draft: "Draft", in_queue: "In Queue", ... }

// PUT /api/account/status-labels
// Body: { draft: "To Do", in_queue: "Ready", ... }
// Validates: non-empty, max 20 chars each
```

### Phase 2: Kanban Component (2-3 hours)

**Files to create:**
1. `/src/app/(app)/components/PromptPagesKanban.tsx`

**Tasks:**
- Install @hello-pangea/dnd: `npm install @hello-pangea/dnd`
- Set up DragDropContext with onDragEnd handler
- Create 5 Droppable columns
- Group promptPages by status
- Render PromptPageCard for each page
- Handle status updates on drag completion
- Add empty states for columns with 0 cards
- Implement glassmorphic column styling
- Add vertical scroll within columns

**Key Props:**
```typescript
interface PromptPagesKanbanProps {
  promptPages: PromptPage[];
  business: any;
  account: any;
  universalUrl: string;
  onStatusUpdate: (pageId: string, newStatus: PromptPage["status"]) => void;
  onDeletePages: (pageIds: string[]) => void;
  statusLabels: Record<string, string>;
}
```

### Phase 3: Card Component (1-2 hours)

**Files to create:**
1. `/src/app/(app)/components/PromptPageCard.tsx`

**Tasks:**
- Create card component with collapsed/expanded states
- Implement glassmorphic styling (bg-white/10 backdrop-blur-lg)
- Add expand/collapse toggle on click
- Show contact info, type badge, date in collapsed state
- Show communication buttons, links in expanded state
- Add drag handle indicator
- Add hover effects (shadow, lift)
- Ensure touch-friendly hit targets

**Glassmorphic Styling:**
```css
bg-white/10 backdrop-blur-lg
border border-white/30
rounded-lg shadow-lg
hover:shadow-xl hover:bg-white/20
transition-all duration-200
```

### Phase 4: Status Label Editor (1 hour)

**Files to create:**
1. `/src/app/(app)/components/StatusLabelEditor.tsx`

**Tasks:**
- Create modal or popover component
- Add 5 input fields (one per status)
- Add character counter (20 max)
- Validate non-empty labels
- Call API endpoint on save
- Show success/error feedback
- Trigger in Kanban column headers (pencil icon)

### Phase 5: Integration (1 hour)

**Files to modify:**
1. `/src/app/(app)/prompt-pages/individual/page.tsx`
2. `/src/app/(app)/components/PromptPagesTable.tsx`

**Tasks:**
- Add view toggle UI (Table vs Kanban icons)
- Add view state: `useState<'table' | 'kanban'>('table')`
- Load preference from localStorage on mount
- Save preference to localStorage on change
- Fetch status labels using useStatusLabels hook
- Pass labels to both PromptPagesTable and PromptPagesKanban
- Conditionally render based on view mode
- Update PromptPagesTable to use custom labels in tabs/dropdowns

**localStorage key format:**
```typescript
`promptpage-view-preference-${accountId}`
```

### Phase 6: Styling & Polish (1-2 hours)

**Tasks:**
- Add drag animations (card lift, shadow)
- Style empty states
- Add loading states
- Test responsive behavior (mobile, tablet, desktop)
- Test horizontal scroll on small screens
- Test vertical scroll within columns
- Keyboard navigation testing
- Screen reader testing
- Cross-browser testing

## File Checklist

### New Files (6)
- [ ] `/supabase/migrations/[timestamp]_add_custom_status_labels.sql`
- [ ] `/src/app/api/account/status-labels/route.ts`
- [ ] `/src/hooks/useStatusLabels.ts`
- [ ] `/src/app/(app)/components/PromptPagesKanban.tsx`
- [ ] `/src/app/(app)/components/PromptPageCard.tsx`
- [ ] `/src/app/(app)/components/StatusLabelEditor.tsx`

### Modified Files (4)
- [ ] `/package.json` (add @hello-pangea/dnd)
- [ ] `/prisma/schema.prisma` (after db pull)
- [ ] `/src/app/(app)/prompt-pages/individual/page.tsx`
- [ ] `/src/app/(app)/components/PromptPagesTable.tsx`

### Documentation (1)
- [ ] `/docs/KANBAN_IMPLEMENTATION.md` (this file)

## Accessibility Requirements

### Keyboard Navigation
- Tab through all interactive elements
- Space/Enter to pick up and drop cards
- Arrow keys to move between drop zones
- Escape to cancel drag operation
- Skip links for jumping between columns

### Screen Readers
- ARIA labels on all drag handles
- Live region announcements for drag operations
- Descriptive labels for all buttons/links
- Column count and card count announcements

### Visual
- High contrast focus indicators
- Sufficient color contrast ratios
- No color-only information
- Clear visual feedback during drag

## Testing Strategy

### Unit Tests
- Status label validation (max length, non-empty)
- Card state management (expand/collapse)
- Drag-drop handlers update database correctly

### Integration Tests
- View toggle persists to localStorage
- Status changes sync between Table and Kanban views
- Type filter works across Kanban columns
- Plan limits apply correctly in Kanban view

### Manual Testing
- [ ] Drag card between all column combinations
- [ ] Edit status labels and verify immediate update
- [ ] Toggle between Table and Kanban views
- [ ] Test on mobile (horizontal scroll, touch drag)
- [ ] Test on tablet (touch drag, responsive layout)
- [ ] Test on desktop (mouse drag, keyboard nav)
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Test with empty columns
- [ ] Test with 100+ cards (performance)
- [ ] Test long contact names (layout doesn't break)

## Performance Considerations

### Current Implementation
- Plan limits already restrict card counts (4/100/500)
- Most users will have < 100 cards
- Initial implementation doesn't need virtualization

### Future Optimizations (if needed)
- Virtual scrolling within columns (react-window)
- Pagination per column
- "Show more" buttons to load additional cards
- Debounced search filtering

## Mobile Responsiveness

### All Screen Sizes
- Horizontal scroll enabled
- All 5 columns always visible
- Minimum column width: 300px
- Cards stack vertically within columns

### Touch Devices
- @hello-pangea/dnd touch support enabled
- Adequate touch targets (44x44px minimum)
- Visual feedback on touch drag
- Scroll containers don't conflict with drag

### Layout Breakpoints
- Mobile (< 640px): Horizontal scroll essential
- Tablet (640-1024px): 2-3 columns visible at once
- Desktop (> 1024px): All 5 columns comfortably visible

## Future Enhancements (Phase 2)

### Real-time Collaboration
**Problem:** Multiple users may drag the same card simultaneously

**Solution:**
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('prompt-pages-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'prompt_pages',
      filter: `account_id=eq.${accountId}`
    }, (payload) => {
      // Refresh cards that changed
      handleRealtimeUpdate(payload);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [accountId]);
```

**Features:**
- Supabase real-time subscriptions on `prompt_pages` table
- Toast notification: "John updated a card"
- Automatic refresh of changed cards
- Optimistic locking to prevent conflicts

### Advanced Filtering
- Filter by date range
- Filter by contact method (has email, has phone)
- Filter by review type within Kanban
- Save filter presets

### Card Customization
- Add custom fields to cards
- Drag to reorder fields
- Show/hide fields per user preference
- Card templates per review type

### Status Workflow Rules
- Define allowed transitions (e.g., Draft → In Queue only)
- Require confirmation for certain transitions
- Automatic status changes based on actions (e.g., "Sent" when SMS sent)

### Analytics
- Time in each status
- Conversion rates between statuses
- Bottleneck identification
- Status change history per card

## Dependencies

### Required
- `@hello-pangea/dnd`: ^0.5.0 (drag-and-drop functionality)
- `react`: 19.1.0 (already installed)
- `next`: ^15.3.2 (already installed)
- `@supabase/supabase-js`: ^2.49.8 (already installed)

### No Additional Dependencies Needed
- Styling: Tailwind CSS (already configured)
- Icons: react-icons (already installed)
- State management: React hooks (built-in)

## Estimated Timeline

### Total: 8-12 hours

**Breakdown:**
- Phase 1 (Database & API): 1-2 hours
- Phase 2 (Kanban component): 2-3 hours
- Phase 3 (Card component): 1-2 hours
- Phase 4 (Label editor): 1 hour
- Phase 5 (Integration): 1 hour
- Phase 6 (Polish & testing): 1-2 hours
- Buffer for bugs/adjustments: 1-2 hours

## Success Criteria

### Functional Requirements
- ✅ Users can toggle between Table and Kanban views
- ✅ Users can drag cards between any columns
- ✅ Status updates persist to database immediately
- ✅ Users can customize status labels per account
- ✅ Custom labels appear in both Table and Kanban views
- ✅ Cards can expand/collapse to show more details
- ✅ Empty columns display appropriate empty states
- ✅ View preference persists across sessions

### Non-Functional Requirements
- ✅ Kanban works on mobile, tablet, and desktop
- ✅ Touch drag works on iOS and Android
- ✅ Keyboard navigation fully functional
- ✅ Screen reader compatible
- ✅ No performance issues with 100+ cards
- ✅ Glassmorphic design matches existing app style
- ✅ Horizontal and vertical scroll work smoothly

## Rollout Plan

### Development
1. Create feature branch: `feature/kanban-view`
2. Implement phases 1-6
3. Test thoroughly on localhost
4. Peer review code changes

### Staging
1. Deploy to staging environment
2. Run through test checklist
3. Get user feedback from beta testers
4. Fix any bugs found

### Production
1. Merge to main branch
2. Deploy during low-traffic period
3. Monitor Sentry for errors
4. Monitor user adoption metrics
5. Gather user feedback

### Rollback Plan
- If critical bugs found, toggle Kanban view off via feature flag
- Database migration is additive (safe to keep even if feature disabled)
- Users can still use Table view

## Questions & Answers

### Q: Why not use a dedicated status table instead of JSONB?
**A:** JSONB is simpler for this use case. We have exactly 5 fixed statuses that won't change. A separate table would be overkill and add unnecessary joins.

### Q: Why allow dragging between any statuses? Shouldn't there be workflow rules?
**A:** We want flexibility in V1. Different businesses have different workflows. We can add optional workflow rules in Phase 2 if users request it.

### Q: Why expand/collapse instead of showing all details by default?
**A:** With many cards, showing all details would make columns too long. Collapsed cards provide a cleaner overview while still allowing quick access to details.

### Q: Why localStorage instead of database for view preference?
**A:** Faster (no API call) and simpler. View preference is non-critical data that doesn't need to sync across devices.

### Q: What if a user has 500+ prompt pages?
**A:** Plan limits restrict this (max 500 for Maven plan). If performance becomes an issue, we'll add virtual scrolling or pagination in Phase 2.

### Q: Will this work with the existing plan limits (Grower: 4, Builder: 100, Maven: 500)?
**A:** Yes! The same `accessiblePromptPages` logic from PromptPagesTable will be reused in PromptPagesKanban.

## References

- [@hello-pangea/dnd documentation](https://github.com/hello-pangea/dnd)
- [Kanban board design patterns](https://www.nngroup.com/articles/kanban-boards/)
- [Web accessibility for drag-and-drop](https://www.w3.org/WAI/ARIA/apg/patterns/drag-and-drop/)
- [PromptReviews tech stack](../CLAUDE.md)

## Changelog

- **2025-01-12**: Initial specification created
