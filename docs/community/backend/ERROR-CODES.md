# Community Feature - Error Codes

**Version**: 1.0.0
**Date**: 2025-10-06

---

## Error Response Format

All API errors follow this standard format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": ["Optional array of specific validation errors"]
}
```

---

## HTTP Status Codes

### 400 - Bad Request

Request is malformed or validation failed.

| Code | Message | Meaning |
|------|---------|---------|
| `VALIDATION_ERROR` | Validation failed | Input data failed validation checks. See `details` array for specifics. |
| `INVALID_REACTION` | Invalid reaction type | Reaction must be one of: thumbs_up, star, celebrate, clap, laugh |
| `INVALID_USERNAME` | Invalid username format | Username must only contain lowercase letters, numbers, and hyphens |

**Example**:
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    "Title is required",
    "Title must be 200 characters or less"
  ]
}
```

---

### 401 - Unauthorized

Authentication is required but missing or invalid.

| Code | Message | Meaning |
|------|---------|---------|
| `UNAUTHORIZED` | Authentication required | No Bearer token provided in Authorization header |
| `INVALID_TOKEN` | Invalid authentication token | Bearer token is expired or invalid |

**Example**:
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

---

### 403 - Forbidden

User is authenticated but lacks permission for the requested action.

| Code | Message | Meaning |
|------|---------|---------|
| `FORBIDDEN` | You can only update your own posts | User attempted to modify content they don't own |
| `FORBIDDEN` | You can only delete your own comments | User attempted to delete someone else's comment |
| `ADMIN_ONLY` | This action requires admin privileges | User attempted admin-only action |

**Example**:
```json
{
  "error": "You can only delete your own posts",
  "code": "FORBIDDEN"
}
```

---

### 404 - Not Found

The requested resource does not exist or has been deleted.

| Code | Message | Meaning |
|------|---------|---------|
| `NOT_FOUND` | Post not found | Post ID doesn't exist or post has been deleted |
| `NOT_FOUND` | Comment not found | Comment ID doesn't exist or comment has been deleted |
| `NOT_FOUND` | Channel not found | Channel ID doesn't exist |
| `NOT_FOUND` | User not found | User ID doesn't exist in community profiles |

**Example**:
```json
{
  "error": "Post not found",
  "code": "NOT_FOUND"
}
```

---

### 500 - Internal Server Error

Server encountered an unexpected error.

| Code | Message | Meaning |
|------|---------|---------|
| `SERVER_ERROR` | Internal server error | Unexpected server error occurred |
| `SERVER_ERROR` | Failed to create post | Database error during post creation |
| `SERVER_ERROR` | Failed to fetch comments | Database error during comment retrieval |
| `SERVER_ERROR` | Failed to generate username | Username generation function failed |

**Example**:
```json
{
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
```

---

## Validation Error Details

When `code` is `VALIDATION_ERROR`, the `details` array contains specific validation failures:

### Post Validation Errors

- `"Title is required"`
- `"Title cannot be empty"`
- `"Title must be 200 characters or less"`
- `"Body must be a string"`
- `"Body must be 10,000 characters or less"`
- `"External URL must be a string"`
- `"External URL must be a valid HTTP/HTTPS URL"`
- `"Channel ID is required"`

### Comment Validation Errors

- `"Comment body is required"`
- `"Comment body cannot be empty"`
- `"Comment body must be 10,000 characters or less"`

### Reaction Validation Errors

- `"Reaction type is required"`
- `"Invalid reaction type. Must be one of: thumbs_up, star, celebrate, clap, laugh"`

### Profile Validation Errors

- `"Display name must be a string"`
- `"Display name must be 100 characters or less"`
- `"Username must only contain lowercase letters, numbers, and hyphens"`
- `"Username must be between 3 and 50 characters"`

### Search Validation Errors

- `"Query must be at least 2 characters"`
- `"Query parameter 'q' is required"`

---

## Common Error Scenarios

### Scenario: Creating a Post Without Title

**Request**:
```bash
POST /api/community/posts
{
  "channel_id": "uuid",
  "body": "Content without title"
}
```

**Response** (400):
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    "Title is required"
  ]
}
```

---

### Scenario: Updating Someone Else's Post

**Request**:
```bash
PATCH /api/community/posts/OTHER_USER_POST_UUID
{
  "title": "Trying to edit"
}
```

**Response** (403):
```json
{
  "error": "You can only update your own posts",
  "code": "FORBIDDEN"
}
```

---

### Scenario: Accessing Deleted Post

**Request**:
```bash
GET /api/community/posts/DELETED_POST_UUID
```

**Response** (404):
```json
{
  "error": "Post not found",
  "code": "NOT_FOUND"
}
```

---

### Scenario: Invalid Reaction Type

**Request**:
```bash
POST /api/community/posts/POST_UUID/react
{
  "reaction": "fire"
}
```

**Response** (400):
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    "Invalid reaction type. Must be one of: thumbs_up, star, celebrate, clap, laugh"
  ]
}
```

---

### Scenario: Expired Authentication Token

**Request**:
```bash
GET /api/community/posts
Authorization: Bearer EXPIRED_TOKEN
```

**Response** (401):
```json
{
  "error": "Invalid authentication token",
  "code": "INVALID_TOKEN"
}
```

---

## Handling Errors in Frontend

### TypeScript Example

```typescript
interface APIError {
  error: string;
  code: string;
  details?: string[];
}

async function createPost(data: PostData) {
  try {
    const response = await fetch('/api/community/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error: APIError = await response.json();

      // Handle specific error codes
      switch (error.code) {
        case 'UNAUTHORIZED':
          redirectToLogin();
          break;
        case 'VALIDATION_ERROR':
          showValidationErrors(error.details || []);
          break;
        case 'FORBIDDEN':
          showErrorToast('You do not have permission for this action');
          break;
        default:
          showErrorToast(error.error);
      }

      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('Network error:', err);
    showErrorToast('Network error. Please try again.');
    return null;
  }
}
```

---

## Rate Limit Errors (Phase 2)

Future rate limit errors will use this format:

**Response** (429 Too Many Requests):
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600
}
```

---

**Last Updated**: 2025-10-06
**Version**: 1.0.0
