# Community Feature - API Reference

**Version**: 1.0.0
**Date**: 2025-10-06
**Base URL**: `/api/community`

---

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

**Error Response (401 Unauthorized)**:
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

---

## Channels

### List Channels

**Endpoint**: `GET /api/community/channels`
**Description**: Returns list of all active community channels

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "General",
      "slug": "general",
      "description": "Open discussion, introductions, questions",
      "icon": "💬",
      "category": "discussion",
      "is_active": true,
      "admin_only_posting": false,
      "sort_order": 0,
      "created_at": "2025-10-06T12:00:00Z"
    }
  ]
}
```

**Example**:
```bash
curl -X GET 'https://app.promptreviews.app/api/community/channels' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Posts

### List Posts

**Endpoint**: `GET /api/community/posts`
**Description**: Returns paginated list of posts

**Query Parameters**:
- `channel_id` (optional): Filter by channel UUID
- `limit` (optional): Number of posts to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "channel_id": "uuid",
      "author_id": "uuid",
      "title": "My First Post",
      "body": "This is the post content with @alex-7h3n mentioned",
      "external_url": "https://example.com",
      "is_pinned": false,
      "is_from_promptreviews_team": false,
      "created_at": "2025-10-06T12:00:00Z",
      "updated_at": "2025-10-06T12:00:00Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45
  }
}
```

**Example**:
```bash
curl -X GET 'https://app.promptreviews.app/api/community/posts?channel_id=CHANNEL_UUID&limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### Create Post

**Endpoint**: `POST /api/community/posts`
**Description**: Creates a new post and automatically parses @mentions

**Request Body**:
```json
{
  "channel_id": "uuid",
  "title": "My Post Title",
  "body": "Post content with @username mentions",
  "external_url": "https://example.com"
}
```

**Validation**:
- `channel_id`: Required, must be valid UUID
- `title`: Required, max 200 characters
- `body`: Optional, max 10,000 characters
- `external_url`: Optional, must be valid HTTP/HTTPS URL

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "channel_id": "uuid",
    "author_id": "uuid",
    "title": "My Post Title",
    "body": "Post content",
    "external_url": "https://example.com",
    "created_at": "2025-10-06T12:00:00Z",
    "updated_at": "2025-10-06T12:00:00Z"
  }
}
```

**Example**:
```bash
curl -X POST 'https://app.promptreviews.app/api/community/posts' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "channel_id": "CHANNEL_UUID",
    "title": "Check out this strategy",
    "body": "Hey @alex-7h3n, what do you think about this approach?"
  }'
```

---

### Get Single Post

**Endpoint**: `GET /api/community/posts/:id`
**Description**: Returns a single post by ID

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "channel_id": "uuid",
    "author_id": "uuid",
    "title": "Post Title",
    "body": "Post content",
    "external_url": null,
    "created_at": "2025-10-06T12:00:00Z",
    "updated_at": "2025-10-06T12:00:00Z"
  }
}
```

**Example**:
```bash
curl -X GET 'https://app.promptreviews.app/api/community/posts/POST_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### Update Post

**Endpoint**: `PATCH /api/community/posts/:id`
**Description**: Updates a post (author only)

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "body": "Updated content",
  "external_url": "https://newurl.com"
}
```

**Authorization**: Only the post author can update

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "body": "Updated content",
    "updated_at": "2025-10-06T13:00:00Z"
  }
}
```

**Example**:
```bash
curl -X PATCH 'https://app.promptreviews.app/api/community/posts/POST_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated title"
  }'
```

---

### Delete Post

**Endpoint**: `DELETE /api/community/posts/:id`
**Description**: Soft deletes a post (author or admin only)

**Authorization**: Only the post author or admins can delete

**Response**:
```json
{
  "success": true
}
```

**Example**:
```bash
curl -X DELETE 'https://app.promptreviews.app/api/community/posts/POST_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Comments

### List Comments

**Endpoint**: `GET /api/community/posts/:id/comments`
**Description**: Returns paginated list of comments for a post

**Query Parameters**:
- `limit` (optional): Number of comments to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "author_id": "uuid",
      "body": "Great post! @chris-9k2l you should see this",
      "created_at": "2025-10-06T12:00:00Z",
      "updated_at": "2025-10-06T12:00:00Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 12
  }
}
```

**Example**:
```bash
curl -X GET 'https://app.promptreviews.app/api/community/posts/POST_UUID/comments' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### Create Comment

**Endpoint**: `POST /api/community/posts/:id/comments`
**Description**: Creates a new comment on a post

**Request Body**:
```json
{
  "body": "This is my comment with @username mentions"
}
```

**Validation**:
- `body`: Required, max 10,000 characters

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "author_id": "uuid",
    "body": "This is my comment",
    "created_at": "2025-10-06T12:00:00Z",
    "updated_at": "2025-10-06T12:00:00Z"
  }
}
```

**Example**:
```bash
curl -X POST 'https://app.promptreviews.app/api/community/posts/POST_UUID/comments' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "body": "Great insight! Thanks for sharing @alex-7h3n"
  }'
```

---

### Update Comment

**Endpoint**: `PATCH /api/community/comments/:id`
**Description**: Updates a comment (author only)

**Request Body**:
```json
{
  "body": "Updated comment text"
}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "body": "Updated comment text",
    "updated_at": "2025-10-06T13:00:00Z"
  }
}
```

**Example**:
```bash
curl -X PATCH 'https://app.promptreviews.app/api/community/comments/COMMENT_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "body": "Corrected my comment"
  }'
```

---

### Delete Comment

**Endpoint**: `DELETE /api/community/comments/:id`
**Description**: Soft deletes a comment (author or admin only)

**Response**:
```json
{
  "success": true
}
```

**Example**:
```bash
curl -X DELETE 'https://app.promptreviews.app/api/community/comments/COMMENT_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Reactions

### React to Post

**Endpoint**: `POST /api/community/posts/:id/react`
**Description**: Toggles a reaction on a post (add if doesn't exist, remove if exists)

**Request Body**:
```json
{
  "reaction": "thumbs_up"
}
```

**Allowed Reactions**:
- `thumbs_up`
- `star`
- `celebrate`
- `clap`
- `laugh`

**Response** (added):
```json
{
  "action": "added",
  "reaction": "thumbs_up"
}
```

**Response** (removed):
```json
{
  "action": "removed",
  "reaction": "thumbs_up"
}
```

**Example**:
```bash
curl -X POST 'https://app.promptreviews.app/api/community/posts/POST_UUID/react' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "reaction": "celebrate"
  }'
```

---

### React to Comment

**Endpoint**: `POST /api/community/comments/:id/react`
**Description**: Toggles a reaction on a comment

**Request Body**:
```json
{
  "reaction": "thumbs_up"
}
```

**Response**: Same as post reactions

**Example**:
```bash
curl -X POST 'https://app.promptreviews.app/api/community/comments/COMMENT_UUID/react' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "reaction": "star"
  }'
```

---

## Mentions

### List Mentions

**Endpoint**: `GET /api/community/mentions`
**Description**: Returns list of mentions for the authenticated user

**Query Parameters**:
- `unread_only` (optional): If `true`, only returns unread mentions (default: false)
- `limit` (optional): Number of mentions to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "source_type": "post",
      "source_id": "uuid",
      "mentioned_user_id": "uuid",
      "author_id": "uuid",
      "created_at": "2025-10-06T12:00:00Z",
      "read_at": null
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 5
  }
}
```

**Example**:
```bash
curl -X GET 'https://app.promptreviews.app/api/community/mentions?unread_only=true' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### Mark Mentions as Read

**Endpoint**: `PATCH /api/community/mentions/read`
**Description**: Marks one or more mentions as read

**Request Body**:
```json
{
  "mention_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**:
```json
{
  "data": {
    "updated": 3
  }
}
```

**Example**:
```bash
curl -X PATCH 'https://app.promptreviews.app/api/community/mentions/read' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "mention_ids": ["MENTION_UUID_1", "MENTION_UUID_2"]
  }'
```

---

## Profile

### Get Profile

**Endpoint**: `GET /api/community/profile`
**Description**: Returns user's community profile, creating one if it doesn't exist

**Response** (existing profile):
```json
{
  "data": {
    "user_id": "uuid",
    "username": "alex-7h3n",
    "display_name_override": "Alex the Baker",
    "guidelines_accepted_at": "2025-10-06T12:00:00Z",
    "opted_in_at": "2025-10-06T12:00:00Z",
    "created_at": "2025-10-06T12:00:00Z",
    "updated_at": "2025-10-06T12:00:00Z"
  }
}
```

**Response** (201 Created - new profile):
```json
{
  "data": {
    "user_id": "uuid",
    "username": "chris-9k2l",
    "display_name_override": null,
    "guidelines_accepted_at": null,
    "opted_in_at": "2025-10-06T12:00:00Z",
    "created_at": "2025-10-06T12:00:00Z"
  }
}
```

**Example**:
```bash
curl -X GET 'https://app.promptreviews.app/api/community/profile' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### Update Profile

**Endpoint**: `PATCH /api/community/profile`
**Description**: Updates user's community profile settings

**Request Body**:
```json
{
  "display_name_override": "Alex the Great Baker"
}
```

**Validation**:
- `display_name_override`: Optional, max 100 characters, set to null to remove

**Response**:
```json
{
  "data": {
    "user_id": "uuid",
    "username": "alex-7h3n",
    "display_name_override": "Alex the Great Baker",
    "updated_at": "2025-10-06T13:00:00Z"
  }
}
```

**Example**:
```bash
curl -X PATCH 'https://app.promptreviews.app/api/community/profile' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "display_name_override": "Alex the Great Baker"
  }'
```

---

### Acknowledge Guidelines

**Endpoint**: `POST /api/community/profile/acknowledge-guidelines`
**Description**: Records that the user has acknowledged community guidelines

**Request Body**: None

**Response**:
```json
{
  "data": {
    "user_id": "uuid",
    "username": "alex-7h3n",
    "guidelines_accepted_at": "2025-10-06T12:00:00Z"
  }
}
```

**Example**:
```bash
curl -X POST 'https://app.promptreviews.app/api/community/profile/acknowledge-guidelines' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## User Search

### Search Users

**Endpoint**: `GET /api/community/users/search`
**Description**: Searches community profiles for @mention autocomplete

**Query Parameters**:
- `q` (required): Search query (min 2 characters)
- `limit` (optional): Number of results to return (default: 10, max: 50)

**Response**:
```json
{
  "data": [
    {
      "user_id": "uuid",
      "username": "alex-7h3n",
      "display_name_override": "Alex the Baker",
      "full_display": "Alex the Baker (alex-7h3n) • Fireside Bakery"
    },
    {
      "user_id": "uuid",
      "username": "alex-2k9m",
      "display_name_override": null,
      "full_display": "alex-2k9m • Another Business"
    }
  ]
}
```

**Example**:
```bash
curl -X GET 'https://app.promptreviews.app/api/community/users/search?q=alex&limit=5' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Error Codes

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": ["Optional array of validation errors"]
}
```

**Common Error Codes**:
- `UNAUTHORIZED` (401): Missing or invalid authentication token
- `FORBIDDEN` (403): User lacks permission for this action
- `NOT_FOUND` (404): Resource does not exist
- `VALIDATION_ERROR` (400): Input validation failed
- `SERVER_ERROR` (500): Internal server error

See [ERROR-CODES.md](./ERROR-CODES.md) for complete list.

---

## Rate Limiting (Phase 2)

Currently not implemented. Future limits:
- 10 posts per hour per user
- 50 comments per hour per user
- 100 reactions per hour per user
- 100 searches per hour per user

---

## Realtime Updates

For live updates, subscribe to Supabase Realtime channels:

```typescript
const channel = supabase
  .channel('community_posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts',
    filter: `channel_id=eq.${channelId}`
  }, handleNewPost)
  .subscribe();
```

See frontend documentation for complete realtime setup.

---

**Last Updated**: 2025-10-06
**API Version**: 1.0.0
