# Social Posting System

Documentation for the multi-platform social posting feature in Prompt Reviews.

## Overview

The social posting system allows users to create, schedule, and publish posts to multiple platforms simultaneously:

- **Google Business Profile (GBP)** - Posts and photo uploads to business locations
- **Bluesky** - Social posts with optional images
- **LinkedIn** - Personal profile and organization/company page posts

## Architecture

### Key Files

```
src/features/social-posting/
├── core/types/
│   ├── platform.ts          # Universal platform interfaces
│   └── scheduled.ts         # Scheduled post types
├── platforms/
│   ├── google-business-profile/
│   │   └── googleBusinessProfileClient.ts
│   ├── bluesky/
│   │   └── BlueskyAdapter.ts
│   └── linkedin/
│       └── LinkedInAdapter.ts

src/app/(app)/api/social-posting/
├── connections/route.ts     # List/manage platform connections
├── scheduled/route.ts       # Create/list scheduled posts
├── scheduled/[id]/route.ts  # Update/delete individual posts
├── bluesky/
│   ├── auth/route.ts        # Bluesky authentication
│   └── callback/route.ts
└── linkedin/
    ├── auth/route.ts        # LinkedIn OAuth initiation
    └── callback/route.ts    # LinkedIn OAuth callback

src/app/(app)/api/cron/
└── process-google-business-scheduled/route.ts  # Cron job for publishing

src/app/(app)/dashboard/social-posting/
├── page.tsx                 # Main scheduling page
└── components/
    ├── CreatePostModal.tsx  # Post creation UI
    ├── ContentQueue.tsx     # Draft management
    ├── ScheduledList.tsx    # Upcoming posts
    └── HistoryList.tsx      # Past posts
```

### Database Tables

- `social_platform_connections` - Stores OAuth credentials for Bluesky/LinkedIn
- `google_business_profiles` - GBP OAuth tokens (separate table)
- `google_business_locations` - Selected GBP locations
- `google_business_scheduled_posts` - All scheduled posts (including social platforms)
- `google_business_scheduled_post_results` - Per-location/target results

---

## Platform Setup

### Google Business Profile

1. User connects GBP via OAuth at `/dashboard/integrations`
2. Selects which locations to manage
3. Locations appear as checkboxes when creating posts

**Capabilities:**
- Text posts with optional CTA button
- Photo gallery uploads (up to 10 images)
- Multi-location posting (same post to multiple locations)

### Bluesky

1. User enters their Bluesky handle and app password at `/dashboard/integrations`
2. Credentials are validated and stored
3. Single checkbox appears when creating posts

**Capabilities:**
- Text posts (300 character limit)
- Up to 4 images per post
- Link cards (if no images attached)
- CTA URLs embedded as link cards

**App Password Setup:**
1. Go to Bluesky Settings → App Passwords
2. Create a new app password
3. Use handle (e.g., `user.bsky.social`) and app password to connect

### LinkedIn

LinkedIn supports two types of posting targets:

1. **Personal Profile** - Always available after connecting
2. **Organization Pages** - Requires admin access + LinkedIn API approval

#### Basic Setup (Personal Profile)

1. User clicks "Connect LinkedIn" at `/dashboard/integrations`
2. OAuth flow redirects to LinkedIn
3. User grants permissions
4. Personal profile appears as option when creating posts

#### Organization Pages Setup

To post to company/organization pages, additional setup is required:

**Step 1: LinkedIn Developer Portal Setup**

1. Go to https://developer.linkedin.com/
2. Select your app (or create one)
3. Go to **Products** tab
4. Request access to **"Advertising API"**
5. Wait for LinkedIn approval (can take hours to days)

**Step 2: Verify Scopes**

After approval, check **Auth** tab → **OAuth 2.0 scopes**:
- ✅ `openid` - Required for authentication
- ✅ `profile` - Required for user info
- ✅ `w_member_social` - Personal profile posting
- ✅ `w_organization_social` - Organization posting (requires Advertising API)

**Step 3: Reconnect**

1. Disconnect LinkedIn in Prompt Reviews
2. Reconnect to get the new scope granted
3. Organizations you admin will now appear

**Capabilities:**
- Text posts (3000 character limit)
- Up to 9 images per post
- CTA URLs appended to post content
- Multi-target posting (personal + multiple organizations)

---

## Creating Posts

### Post Types

1. **Post** - Text content with optional images and CTA
2. **Photo** - Photo gallery upload (GBP only)

### Schedule Modes

1. **Post now** - Publishes immediately via cron job
2. **Schedule** - Publishes on selected date at 1 PM UTC
3. **Save as draft** - Saves to drafts queue for later

### Platform Selection

When creating a post, users select which platforms/targets to post to:

**GBP Locations:**
```
☑ Location A (123 Main St)
☑ Location B (456 Oak Ave)
☐ Location C (789 Pine Rd)
```

**Bluesky:**
```
☑ @handle.bsky.social
```

**LinkedIn:**
```
☑ Chris Bolton (Personal)
☑ Acme Corp (Company)
☐ Other Company (Company)
```

### Call-to-Action (CTA)

For GBP posts, users can add a CTA button:
- **Learn more** - Links to URL
- **Book** - Links to booking URL
- **Order online** - Links to order URL
- **Buy** - Links to purchase URL
- **Sign up** - Links to signup URL
- **Call** - Initiates phone call

For Bluesky and LinkedIn, the CTA URL is appended to the post content.

---

## Cron Job Processing

The cron job runs at scheduled intervals to process pending posts.

**Endpoint:** `/api/cron/process-google-business-scheduled`

**Flow:**

1. Fetch all posts with `status = 'pending'` and `scheduled_date <= today`
2. For each post:
   a. Update status to `processing`
   b. Process GBP locations (if any)
   c. Process Bluesky (if enabled)
   d. Process LinkedIn targets (if enabled)
   e. Update status to `completed`, `partial_success`, or `failed`

**Rate Limiting:**
- 5 second delay between operations (configurable via `GBP_SCHEDULED_RATE_DELAY_MS`)
- Max 25 jobs per run (configurable via `GBP_SCHEDULED_MAX_JOBS`)

**Result Tracking:**

Each target gets its own result row in `google_business_scheduled_post_results`:

```sql
-- GBP location result
location_id: 'locations/123456789'
platform: NULL (default for GBP)
status: 'success'

-- Bluesky result
location_id: 'bluesky-standalone'
platform: 'bluesky'
status: 'success'

-- LinkedIn personal result
location_id: 'linkedin-personal-abc123'
platform: 'linkedin'
status: 'success'

-- LinkedIn organization result
location_id: 'linkedin-organization-urn:li:organization:12345'
platform: 'linkedin'
status: 'success'
```

---

## Data Structures

### Scheduled Post (additionalPlatforms)

```typescript
{
  additionalPlatforms: {
    bluesky?: {
      enabled: boolean;
      connectionId: string;
    };
    linkedin?: {
      enabled: boolean;
      connectionId: string;
      targets?: Array<{
        type: 'personal' | 'organization';
        id: string;      // Connection ID or org URN
        name: string;    // Display name
      }>;
    };
  }
}
```

### LinkedIn Connection Metadata

```typescript
{
  metadata: {
    name: string;           // User's name
    handle: string;         // Display handle
    linkedinId: string;     // urn:li:person:XXXXX
    picture?: string;       // Profile picture URL
    email?: string;         // Email address
    organizations: Array<{
      id: string;           // urn:li:organization:XXXXX
      name: string;         // Organization name
      logoUrl?: string;     // Logo URL
    }>;
  }
}
```

---

## API Reference

### GET /api/social-posting/connections

Returns all platform connections for the current account.

**Response:**
```json
{
  "connections": [
    {
      "id": "uuid",
      "platform": "linkedin",
      "status": "active",
      "handle": "Chris Bolton",
      "organizations": [
        { "id": "urn:li:organization:123", "name": "Acme Corp" }
      ]
    }
  ]
}
```

### POST /api/social-posting/scheduled

Create a new scheduled post.

**Request:**
```json
{
  "postKind": "post",
  "content": {
    "summary": "Check out our latest updates!",
    "callToAction": {
      "actionType": "LEARN_MORE",
      "url": "https://example.com"
    }
  },
  "scheduledDate": "2025-01-15",
  "timezone": "America/New_York",
  "locations": [
    { "id": "locations/123", "name": "Main Office" }
  ],
  "additionalPlatforms": {
    "bluesky": { "enabled": true, "connectionId": "uuid" },
    "linkedin": {
      "enabled": true,
      "connectionId": "uuid",
      "targets": [
        { "type": "personal", "id": "uuid", "name": "Chris Bolton" },
        { "type": "organization", "id": "urn:li:organization:123", "name": "Acme Corp" }
      ]
    }
  },
  "status": "pending"
}
```

### PATCH /api/social-posting/scheduled/[id]

Update an existing draft or pending post.

### DELETE /api/social-posting/scheduled/[id]

Cancel a pending post (sets status to 'cancelled').

---

## Environment Variables

```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Bluesky (no env vars needed - uses app passwords)

# Google Business Profile
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://app.promptreviews.app/api/google-business/callback

# Cron
CRON_SECRET_TOKEN=your_secret
GBP_SCHEDULED_RATE_DELAY_MS=5000
GBP_SCHEDULED_MAX_JOBS=25
```

---

## Troubleshooting

### LinkedIn organizations not appearing

1. **Check admin access** - You must be an admin of the LinkedIn company page
2. **Check API approval** - Your LinkedIn app needs "Advertising API" product enabled
3. **Check scopes** - Verify `w_organization_social` is listed in Auth → OAuth 2.0 scopes
4. **Reconnect** - Disconnect and reconnect LinkedIn to get new scopes

### Bluesky connection failing

1. **Use app password** - Not your regular Bluesky password
2. **Check handle format** - Use full handle like `user.bsky.social`
3. **Verify app password** - Create a new one if the old one was revoked

### GBP posts failing

1. **Check token expiry** - Reconnect GBP if tokens expired
2. **Check location access** - Verify you still have access to the location
3. **Check rate limits** - GBP has daily posting limits per location

### Posts stuck in "processing"

1. Check Vercel function logs for errors
2. Verify cron job is running (check Vercel cron dashboard)
3. Manually trigger cron with proper auth header for testing

---

## Credits

Each scheduled post costs **1 credit** when scheduled (not when published). Drafts don't consume credits until scheduled.
