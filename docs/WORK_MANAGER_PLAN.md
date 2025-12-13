# Work Manager Implementation Plan

## Overview

Work Manager is a Kanban-based task management feature for agencies managing multiple client accounts. It allows agencies to create task boards for clients, track work progress, and collaborate with clients on task completion.

## Key Concepts

- **Board**: A Kanban board created for a specific client account
- **Task**: An individual work item with title, description, status, priority, due date, and assignee
- **Multi-account user**: A user with access to 2+ accounts (the "agency" user)
- **Client**: An account that has a board created for it

## User Experience Flow

### For Multi-Account Users (Agency)

1. User with 2+ accounts sees "Work Manager" link in the account switcher bar
2. Clicking it navigates to `/work-manager` dashboard
3. Dashboard shows:
   - List of all boards the user has access to (across all their accounts)
   - "Create Board" button
4. "Create Board" opens a modal to select which account to create a board for
5. Clicking a board navigates to `/work-manager/[boardId]` showing the Kanban

### For Single-Account Users (Client)

1. If their account has a board created for it, "Work Manager" appears in the **main nav (sidebar)**
2. Clicking it navigates directly to their board at `/work-manager/[boardId]`
3. They never see the account switcher bar (that's only for multi-account users)

## Database Schema

### Naming Convention
All tables use `wm_` prefix for clear isolation from other features.

### Tables

#### `wm_boards`
One record per account that has Work Manager enabled.

```sql
CREATE TABLE wm_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT, -- Optional, defaults to account/business name
  status_labels JSONB DEFAULT '{"backlog": "Backlog", "todo": "To Do", "in_progress": "In Progress", "review": "Review", "done": "Done"}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id) -- One board per account
);
```

#### `wm_tasks`
Individual task records.

```sql
CREATE TYPE wm_task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE wm_task_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE wm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES wm_boards(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, -- Denormalized for RLS
  title TEXT NOT NULL,
  description TEXT,
  status wm_task_status NOT NULL DEFAULT 'backlog',
  priority wm_task_priority DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wm_tasks_board_id ON wm_tasks(board_id);
CREATE INDEX idx_wm_tasks_account_id ON wm_tasks(account_id);
CREATE INDEX idx_wm_tasks_status ON wm_tasks(status);
CREATE INDEX idx_wm_tasks_assigned_to ON wm_tasks(assigned_to);
CREATE INDEX idx_wm_tasks_due_date ON wm_tasks(due_date);
```

#### `wm_task_actions`
Activity log for tasks (status changes, comments, etc.).

```sql
CREATE TYPE wm_action_type AS ENUM (
  'note',
  'status_change',
  'assignment_change',
  'priority_change',
  'due_date_change',
  'created',
  'updated'
);

CREATE TABLE wm_task_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES wm_tasks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  activity_type wm_action_type NOT NULL,
  content TEXT, -- For notes
  metadata JSONB, -- For structured data like {from_status, to_status}
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wm_task_actions_task_id ON wm_task_actions(task_id);
CREATE INDEX idx_wm_task_actions_account_id ON wm_task_actions(account_id);
CREATE INDEX idx_wm_task_actions_created_at ON wm_task_actions(created_at);
```

#### `wm_resources` (Phase 2)
Per-client resources and quick links.

```sql
CREATE TYPE wm_resource_type AS ENUM ('link', 'document', 'note');

CREATE TABLE wm_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES wm_boards(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  type wm_resource_type DEFAULT 'link',
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wm_resources_board_id ON wm_resources(board_id);
```

### Row Level Security (RLS)

All tables will use account-based RLS policies:

```sql
-- wm_boards: Users can access boards for accounts they belong to
ALTER TABLE wm_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view boards for their accounts" ON wm_boards
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards for their accounts" ON wm_boards
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Similar policies for wm_tasks, wm_task_actions, wm_resources
```

## File Structure

```
src/app/(app)/
├── work-manager/
│   ├── page.tsx                         # Dashboard: board list + create
│   ├── layout.tsx                       # Optional layout wrapper
│   ├── [boardId]/
│   │   └── page.tsx                     # Individual board Kanban view
│   └── components/
│       ├── WorkManagerKanban.tsx        # Main Kanban board component
│       ├── WorkManagerCard.tsx          # Task card component
│       ├── WorkManagerDetailsPanel.tsx  # Task details side panel
│       ├── BoardList.tsx                # List of boards on dashboard
│       ├── CreateBoardModal.tsx         # Modal to create new board
│       ├── CreateTaskModal.tsx          # Modal to create new task
│       ├── WMStatusLabelEditor.tsx      # Customize status labels
│       └── TaskActivityTimeline.tsx     # Activity feed in details panel

src/app/(app)/api/work-manager/
├── boards/
│   └── route.ts                         # GET all boards, POST create board
├── boards/[boardId]/
│   └── route.ts                         # GET, PATCH, DELETE single board
├── tasks/
│   └── route.ts                         # GET tasks (by board), POST create task
├── tasks/[taskId]/
│   └── route.ts                         # GET, PATCH, DELETE single task
├── tasks/reorder/
│   └── route.ts                         # PATCH batch reorder tasks
├── task-actions/
│   └── route.ts                         # GET, POST task actions
└── status-labels/[boardId]/
    └── route.ts                         # GET, PUT status labels for board

src/hooks/
├── useWMBoards.ts                       # Fetch boards for current user
├── useWMTasks.ts                        # Fetch tasks for a board
├── useWMStatusLabels.ts                 # Fetch/update status labels
└── useWMTaskActions.ts                  # Fetch task activity

src/types/
└── workManager.ts                       # TypeScript types for Work Manager
```

## API Endpoints

### Boards

#### `GET /api/work-manager/boards`
Returns all boards the current user has access to (across all their accounts).

Response:
```json
{
  "boards": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "name": "Acme Corp Tasks",
      "account_name": "Acme Corp",
      "task_count": 12,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/work-manager/boards`
Creates a new board for an account.

Request:
```json
{
  "account_id": "uuid",
  "name": "Optional custom name"
}
```

#### `GET /api/work-manager/boards/[boardId]`
Returns board details including status labels.

#### `PATCH /api/work-manager/boards/[boardId]`
Updates board name or status labels.

#### `DELETE /api/work-manager/boards/[boardId]`
Deletes a board and all its tasks.

### Tasks

#### `GET /api/work-manager/tasks?boardId=xxx`
Returns all tasks for a board.

Response:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Update widget design",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2025-01-15T00:00:00Z",
      "assigned_to": {
        "id": "uuid",
        "name": "John Doe",
        "avatar_url": "..."
      },
      "sort_order": 1,
      "created_by": {...},
      "created_at": "..."
    }
  ]
}
```

#### `POST /api/work-manager/tasks`
Creates a new task.

Request:
```json
{
  "board_id": "uuid",
  "title": "Task title",
  "description": "Optional description",
  "status": "backlog",
  "priority": "medium",
  "due_date": null,
  "assigned_to": null
}
```

#### `PATCH /api/work-manager/tasks/[taskId]`
Updates a task (title, description, status, priority, due_date, assigned_to).

#### `DELETE /api/work-manager/tasks/[taskId]`
Deletes a task.

#### `PATCH /api/work-manager/tasks/reorder`
Batch updates sort_order for tasks (used during drag & drop).

Request:
```json
{
  "updates": [
    { "id": "uuid", "sort_order": 0, "status": "in_progress" },
    { "id": "uuid", "sort_order": 1, "status": "in_progress" }
  ]
}
```

### Task Actions

#### `GET /api/work-manager/task-actions?taskId=xxx`
Returns activity log for a task.

#### `POST /api/work-manager/task-actions`
Creates a new action (note, etc.).

Request:
```json
{
  "task_id": "uuid",
  "activity_type": "note",
  "content": "Called client, they approved the design"
}
```

## Navigation Integration

### Multi-Account Users: Account Switcher Bar
In `src/app/(app)/components/AccountUtilityBar.tsx`:

The account switcher bar already only renders for users with 2+ accounts. Add a "Work Manager" link inside it:

```tsx
// Inside AccountUtilityBar (which already checks hasMultipleAccounts)
<Link href="/work-manager" className="...">
  Work Manager
</Link>
```

### Single-Account Users: Main Nav (Sidebar)
In `src/app/(app)/components/Sidebar.tsx` (or equivalent):

```tsx
// For single-account users, check if their account has a board
// If so, show "Work Manager" in main nav linking directly to their board

const { hasMultipleAccounts, selectedAccountId } = useAccountData();
const { data: board } = useWMBoardForAccount(selectedAccountId);

// Show in main nav only for single-account users with a board
{!hasMultipleAccounts && board && (
  <NavLink href={`/work-manager/${board.id}`}>
    Work Manager
  </NavLink>
)}
```

### Summary Table

| User Type | Has Board? | Where Link Appears | Links To |
|-----------|------------|-------------------|----------|
| Multi-account | N/A | Account switcher bar | `/work-manager` (dashboard) |
| Single-account | Yes | Main nav (sidebar) | `/work-manager/[boardId]` |
| Single-account | No | Nowhere | N/A |

## Components (Copied & Adapted from Prompt Pages Kanban)

### WorkManagerKanban.tsx
Based on `PromptPagesKanban.tsx`:
- 5 columns: Backlog, To Do, In Progress, Review, Done
- Drag & drop via `@hello-pangea/dnd`
- Glassmorphic column styling
- Status label customization
- "Add Task" button in each column or floating

### WorkManagerCard.tsx
Based on `PromptPageCard.tsx`:
- Title
- Priority badge (color-coded)
- Due date (with overdue indicator)
- Assignee avatar
- Drag handle

### WorkManagerDetailsPanel.tsx
Based on `PromptPageDetailsPanel.tsx`:
- Full task details form
- Edit title, description, priority, due date, assignee
- Activity timeline
- Delete button

## Implementation Phases

### Phase 1: Core Infrastructure (MVP)
1. Database migrations (wm_boards, wm_tasks, wm_task_actions)
2. TypeScript types
3. API endpoints (boards CRUD, tasks CRUD)
4. Dashboard page with board list
5. Create board modal
6. Basic Kanban board (copy from existing)
7. Task cards with drag & drop
8. Navigation integration

### Phase 2: Task Features
1. Task details panel
2. Task creation modal
3. Status label customization
4. Priority visualization
5. Due date with overdue indicators
6. Assignee selection (from account users)
7. Activity timeline

### Phase 3: Dashboard & Polish
1. Dashboard analytics (tasks by status, overdue count, etc.)
2. Quick filters (my tasks, overdue, high priority)
3. Search tasks
4. Keyboard shortcuts

### Phase 4: Templates & Resources (Future)
1. Task templates (for new client onboarding)
2. Per-client resource library
3. Quick links section

## Status Column Configuration

Default statuses and suggested colors:

| Status | Label | Color (Glassmorphic) |
|--------|-------|----------------------|
| backlog | Backlog | `bg-slate-300/60` |
| todo | To Do | `bg-blue-300/60` |
| in_progress | In Progress | `bg-amber-300/60` |
| review | Review | `bg-purple-300/60` |
| done | Done | `bg-emerald-300/60` |

## Priority Configuration

| Priority | Label | Color |
|----------|-------|-------|
| low | Low | Gray badge |
| medium | Medium | Blue badge |
| high | High | Red badge |

## Account Isolation

All operations must respect account boundaries:
- Use `getRequestAccountId()` in API routes
- Filter by `account_id` in all queries
- RLS policies enforce access control
- Board creation requires user to be member of target account

## Testing Checklist

- [ ] Multi-account user sees "Work Manager" in account switcher bar
- [ ] Multi-account user clicking it goes to `/work-manager` dashboard
- [ ] Single-account user does NOT see account switcher bar at all
- [ ] Single-account user WITH a board sees "Work Manager" in main nav (sidebar)
- [ ] Single-account user clicking it goes directly to `/work-manager/[boardId]`
- [ ] Single-account user WITHOUT a board sees no Work Manager link anywhere
- [ ] Create board for a client account works
- [ ] After board creation, client sees it in their nav
- [ ] Create, edit, delete tasks
- [ ] Drag & drop between columns
- [ ] Reorder within column
- [ ] Assign task to account member
- [ ] Due date and priority display correctly
- [ ] Activity timeline records changes
- [ ] Account isolation - no cross-account data leakage
