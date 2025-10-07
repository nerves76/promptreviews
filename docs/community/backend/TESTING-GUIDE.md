# Community Feature - API Testing Guide

**Version**: 1.0.0
**Date**: 2025-10-06

---

## Prerequisites

Before testing, you need:

1. **Valid Supabase JWT Token**
2. **Base URL**: `https://app.promptreviews.app` (production) or `http://localhost:3002` (local)
3. **Test account** with community profile created

---

## Getting an Auth Token

### Method 1: Browser Console

1. Log in to PromptReviews
2. Open browser console
3. Run:
```javascript
const session = await supabase.auth.getSession();
console.log(session.data.session.access_token);
```

### Method 2: Direct API Call

```bash
curl -X POST 'https://YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }'
```

---

## Test Sequence

Run these tests in order to verify all endpoints:

### 1. Get Channels

```bash
curl -X GET 'http://localhost:3002/api/community/channels' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: List of 5 channels (General, Strategy, Google Business, Feature Requests, Promote)

---

### 2. Create Community Profile

```bash
curl -X GET 'http://localhost:3002/api/community/profile' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: New profile created with generated username (e.g., `alex-7h3n`)

**Save the username** for mention tests.

---

### 3. Create a Post

```bash
curl -X POST 'http://localhost:3002/api/community/posts' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "channel_id": "GENERAL_CHANNEL_UUID",
    "title": "My first test post",
    "body": "This is a test post to verify the API works"
  }'
```

**Expected**: 201 status with post object

**Save the post ID** for subsequent tests.

---

### 4. List Posts

```bash
curl -X GET 'http://localhost:3002/api/community/posts?limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: List of posts including the one just created

---

### 5. Get Single Post

```bash
curl -X GET 'http://localhost:3002/api/community/posts/POST_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: Single post object

---

### 6. Update Post

```bash
curl -X PATCH 'http://localhost:3002/api/community/posts/POST_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated title",
    "body": "Updated content"
  }'
```

**Expected**: Updated post object

---

### 7. Create Comment

```bash
curl -X POST 'http://localhost:3002/api/community/posts/POST_UUID/comments' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "body": "This is a test comment"
  }'
```

**Expected**: 201 status with comment object

**Save the comment ID** for subsequent tests.

---

### 8. List Comments

```bash
curl -X GET 'http://localhost:3002/api/community/posts/POST_UUID/comments' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: List of comments including the one just created

---

### 9. React to Post

```bash
curl -X POST 'http://localhost:3002/api/community/posts/POST_UUID/react' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "reaction": "thumbs_up"
  }'
```

**Expected**: `{ "action": "added", "reaction": "thumbs_up" }`

---

### 10. Toggle Reaction (Remove)

Run the same reaction request again:

```bash
curl -X POST 'http://localhost:3002/api/community/posts/POST_UUID/react' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "reaction": "thumbs_up"
  }'
```

**Expected**: `{ "action": "removed", "reaction": "thumbs_up" }`

---

### 11. React to Comment

```bash
curl -X POST 'http://localhost:3002/api/community/comments/COMMENT_UUID/react' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "reaction": "star"
  }'
```

**Expected**: `{ "action": "added", "reaction": "star" }`

---

### 12. Test Mentions

Create a post with @mention (requires two user accounts):

```bash
curl -X POST 'http://localhost:3002/api/community/posts' \
  -H 'Authorization: Bearer USER1_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "channel_id": "GENERAL_CHANNEL_UUID",
    "title": "Mentioning someone",
    "body": "Hey @alex-7h3n, check this out!"
  }'
```

Then as the mentioned user, check mentions:

```bash
curl -X GET 'http://localhost:3002/api/community/mentions?unread_only=true' \
  -H 'Authorization: Bearer USER2_TOKEN'
```

**Expected**: List with one mention

---

### 13. Mark Mention as Read

```bash
curl -X PATCH 'http://localhost:3002/api/community/mentions/read' \
  -H 'Authorization: Bearer USER2_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "mention_ids": ["MENTION_UUID"]
  }'
```

**Expected**: `{ "data": { "updated": 1 } }`

---

### 14. Search Users

```bash
curl -X GET 'http://localhost:3002/api/community/users/search?q=alex&limit=5' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: List of users with username matching "alex"

---

### 15. Update Profile

```bash
curl -X PATCH 'http://localhost:3002/api/community/profile' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "display_name_override": "Alex the Great"
  }'
```

**Expected**: Updated profile with new display name

---

### 16. Acknowledge Guidelines

```bash
curl -X POST 'http://localhost:3002/api/community/profile/acknowledge-guidelines' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: Profile with `guidelines_accepted_at` timestamp set

---

### 17. Delete Comment

```bash
curl -X DELETE 'http://localhost:3002/api/community/comments/COMMENT_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: `{ "success": true }`

---

### 18. Delete Post

```bash
curl -X DELETE 'http://localhost:3002/api/community/posts/POST_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: `{ "success": true }`

---

## Error Testing

### Test Authentication Failure

```bash
curl -X GET 'http://localhost:3002/api/community/posts'
```

**Expected**: 401 error with `UNAUTHORIZED` code

---

### Test Validation Errors

```bash
curl -X POST 'http://localhost:3002/api/community/posts' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "channel_id": "CHANNEL_UUID"
  }'
```

**Expected**: 400 error with `VALIDATION_ERROR` code and details: `["Title is required"]`

---

### Test Permission Error

Try to delete another user's post:

```bash
curl -X DELETE 'http://localhost:3002/api/community/posts/OTHER_USER_POST_UUID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: 403 error with `FORBIDDEN` code

---

### Test Not Found Error

```bash
curl -X GET 'http://localhost:3002/api/community/posts/00000000-0000-0000-0000-000000000000' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: 404 error with `NOT_FOUND` code

---

## Pagination Testing

### Test Limit Parameter

```bash
curl -X GET 'http://localhost:3002/api/community/posts?limit=5' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: Maximum 5 posts returned

---

### Test Offset Parameter

```bash
curl -X GET 'http://localhost:3002/api/community/posts?limit=5&offset=5' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: Next 5 posts (skipping first 5)

---

### Test Max Limit Enforcement

```bash
curl -X GET 'http://localhost:3002/api/community/posts?limit=200' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: Maximum 100 posts (limit capped at 100)

---

## RPC Function Testing

### Test Username Generation

```sql
SELECT * FROM generate_username('USER_UUID');
```

**Expected**: Generated username like `alex-7h3n`

---

### Test Mention Parsing

```sql
SELECT * FROM parse_mentions('Hey @alex-7h3n and @chris-9k2l, check this out!');
```

**Expected**: `["alex-7h3n", "chris-9k2l"]`

---

### Test Display Identity

```sql
SELECT * FROM get_user_display_identity('USER_UUID');
```

**Expected**: Formatted string like `"alex-7h3n • Fireside Bakery"` or `"Alex the Baker (alex-7h3n) • Fireside Bakery"`

---

## Performance Testing

### Test Large Post List Query

```bash
time curl -X GET 'http://localhost:3002/api/community/posts?limit=100' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: < 100ms response time

---

### Test Comment Count

Create 50 comments on a post and verify pagination:

```bash
curl -X GET 'http://localhost:3002/api/community/posts/POST_UUID/comments?limit=20&offset=0' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: Returns 20 comments with correct total count

---

## Security Testing

### Test SQL Injection Protection

```bash
curl -X GET "http://localhost:3002/api/community/users/search?q='; DROP TABLE posts; --" \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected**: No error, returns empty results

---

### Test XSS Protection

```bash
curl -X POST 'http://localhost:3002/api/community/posts' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "channel_id": "CHANNEL_UUID",
    "title": "<script>alert(\"XSS\")</script>",
    "body": "Test"
  }'
```

**Expected**: Post created with script tags as plain text (not executed)

---

## Automated Testing Script

Save this as `test-community-api.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3002"
TOKEN="YOUR_TOKEN_HERE"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4

  echo -n "Testing $name... "

  if [ -z "$data" ]; then
    response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN")
  else
    response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  status_code="${response: -3}"

  if [ $status_code -ge 200 ] && [ $status_code -lt 300 ]; then
    echo -e "${GREEN}PASS${NC} ($status_code)"
  else
    echo -e "${RED}FAIL${NC} ($status_code)"
  fi
}

# Run tests
echo "Running Community API Tests"
echo "============================"

test_endpoint "Get Channels" "GET" "/api/community/channels"
test_endpoint "Get Profile" "GET" "/api/community/profile"
test_endpoint "List Posts" "GET" "/api/community/posts"
test_endpoint "Search Users" "GET" "/api/community/users/search?q=test"
test_endpoint "List Mentions" "GET" "/api/community/mentions"

echo "============================"
echo "Tests complete!"
```

Run with: `bash test-community-api.sh`

---

**Last Updated**: 2025-10-06
**Version**: 1.0.0
