# Community Feature - MVP Acceptance Criteria

**Document Version:** 1.0
**Last Updated:** 2025-10-06
**Phase:** Phase 1 MVP (Excludes Phase 2 Automation)
**Status:** Draft for Review

## Overview

This document defines testable acceptance criteria for the Community Feature MVP. Each feature includes user stories, acceptance criteria, edge cases, and validation methods.

**MVP Scope:** Core community posting, commenting, reactions, and mentions. EXCLUDES monthly summaries, @everyone broadcasts, saved posts, and digest sharing (Phase 2).

---

## Table of Contents

1. [Username System](#1-username-system)
2. [Community Navigation](#2-community-navigation)
3. [Channel Management](#3-channel-management)
4. [Post Creation](#4-post-creation)
5. [Post Display](#5-post-display)
6. [Comments](#6-comments)
7. [Reactions](#7-reactions)
8. [Mentions](#8-mentions)
9. [Community Guidelines](#9-community-guidelines)
10. [Account Switching](#10-account-switching)
11. [Real-time Updates](#11-real-time-updates)
12. [Permissions & Security](#12-permissions--security)
13. [Performance](#13-performance)

---

## 1. Username System

### User Story
As a user, I need a unique, stable username for community interactions that identifies me without revealing sensitive information.

### Acceptance Criteria

#### AC 1.1: Handle Generation
**Given** a new user creates their first post in the community
**When** the system generates a username handle
**Then** the handle follows the format: `{firstname}-{hash}` where:
- `firstname` is lowercase, alphanumeric, max 12 chars
- `hash` is 4-character base32 random string
- Full handle matches regex: `^[a-z0-9-]+$`
- Example: `alex-h7k2`

**Validation:**
- Generate 100 handles, verify all match regex
- Verify no two users have same handle (unique constraint)
- Verify hash is non-sequential (not predictable)

#### AC 1.2: Handle Uniqueness
**Given** a handle collision occurs during generation
**When** the system detects duplicate handle
**Then** it retries with new random hash up to 5 times
**And** if all retries fail, generates UUID-based fallback handle
**And** logs collision event to monitoring

**Edge Cases:**
- User named "A" (very short name)
- User with no first name in profile
- 1000 users named "Alex" (hash must differentiate)

**Validation:**
- Simulate collision, verify retry logic
- Test fallback with forced failures
- Check database for unique constraint enforcement

#### AC 1.3: Display Name Generation
**Given** a user with handle `alex-h7k2` and first name "Alex"
**When** their content is displayed in community
**Then** display name shows: `Alex` (first name only)
**And** handle is shown separately as `@alex-h7k2` when needed
**And** display name updates if user changes first name in profile

**Validation:**
- Change user first name, verify display name updates
- Verify handle never changes once created
- Check display in post header, comment author, mention list

#### AC 1.4: Handle Immutability
**Given** a user has an existing handle
**When** they attempt to change their username
**Then** the system prevents modification (no UI or API available)
**And** handle remains stable forever unless admin override

**Validation:**
- No edit handle API exists
- Profile settings do not show handle edit field
- Admin override function exists but requires superuser

#### AC 1.5: Multi-Account Display Context
**Given** a user belongs to Account A and Account B
**When** they post in Account A's community
**Then** their display shows `Alex` (name only, no account reference)
**And** no information about Account B is visible
**And** switching to Account B shows same username but different posts

**Validation:**
- User posts in Account A, verify no Account B leak
- Verify handle is same across both accounts
- Verify posts are isolated per account

---

## 2. Community Navigation

### User Story
As a user, I want to easily access the community from the main navigation and switch between channels.

### Acceptance Criteria

#### AC 2.1: Community Link in Navigation
**Given** I am logged into my account
**When** I view the main navigation
**Then** I see "Community" link/icon
**And** clicking it navigates to `/community?channel=general`
**And** link is highlighted when I'm on community pages

**Validation:**
- Link appears in nav for all account roles
- Link not visible when logged out
- Active state styling works correctly

#### AC 2.2: Default Channel Load
**Given** I navigate to `/community` with no channel parameter
**When** the page loads
**Then** it automatically selects the "General" channel
**And** URL updates to `/community?channel=general`
**And** General channel is highlighted in sidebar

**Validation:**
- Direct navigation to `/community`
- Bookmark to `/community` loads correctly
- No JavaScript error if channel param missing

#### AC 2.3: Channel Switching
**Given** I am viewing the General channel
**When** I click on the "Strategy" channel
**Then** URL updates to `/community?channel=strategy`
**And** post feed loads Strategy posts
**And** Strategy channel is highlighted
**And** previous channel is unhighlighted

**Validation:**
- Switch between all 3 default channels
- Browser back button returns to previous channel
- Deep link to specific channel works

#### AC 2.4: Non-Existent Channel Handling
**Given** I navigate to `/community?channel=invalid-channel`
**When** the page loads
**Then** it shows error message "Channel not found"
**And** provides link to return to General channel
**Or** redirects to General with toast notification

**Validation:**
- Test with random invalid slug
- Test with deleted channel slug
- Verify no JavaScript crash

---

## 3. Channel Management

### User Story
As an account owner, I want default channels created automatically, and as a user, I want to see only channels for my current account.

### Acceptance Criteria

#### AC 3.1: Default Channel Creation
**Given** a new account is created
**When** the account is initialized
**Then** three default channels are auto-created:
1. General (slug: `general`, sort_order: 0)
2. Strategy (slug: `strategy`, sort_order: 1)
3. Google Business (slug: `google-business`, sort_order: 2)

**Validation:**
- Create new account via signup flow
- Check database for 3 channels with correct slugs
- Verify sort_order determines display order

#### AC 3.2: Channel Display Order
**Given** an account has 3 default channels
**When** I view the channel list
**Then** channels appear in order: General, Strategy, Google Business
**And** order matches `sort_order` field ascending
**And** order is same for all users in account

**Validation:**
- Query channels, verify ORDER BY sort_order ASC
- Visual check in UI
- Consistent across user sessions

#### AC 3.3: Account-Scoped Channels
**Given** I belong to Account A and Account B
**When** I view Account A's community
**Then** I see only Account A's channels
**And** switching to Account B shows only Account B's channels
**And** no channel data bleeds across accounts

**Validation:**
- Create posts in both accounts' channels
- Switch accounts, verify isolation
- Database query filters by account_id

#### AC 3.4: Channel Description Display
**Given** a channel has a description
**When** I view the channel list
**Then** description appears below channel name
**And** description truncates at 100 chars with ellipsis
**And** clicking channel shows full description at top of feed

**Validation:**
- Set long description, verify truncation
- Verify full text on channel page
- Empty description shows nothing (no placeholder)

---

## 4. Post Creation

### User Story
As a user, I want to create posts with a title, body, and optional link to share information with my account community.

### Acceptance Criteria

#### AC 4.1: Post Composer Access
**Given** I have acknowledged community guidelines
**When** I view a channel
**Then** I see a "New Post" button at top of feed
**And** clicking it opens a modal with post form
**And** form includes: title input, body textarea, optional URL input

**Validation:**
- Button visible on all channels
- Modal opens with focus on title field
- Modal closes on ESC or cancel button

#### AC 4.2: Post Title Validation
**Given** I am creating a post
**When** I enter a title
**Then** title must be 1-200 characters
**And** empty title shows error "Title is required"
**And** title over 200 chars shows error "Title must be under 200 characters"
**And** submit button is disabled until valid

**Validation:**
- Submit with empty title (should fail)
- Submit with 201 char title (should fail)
- Submit with 1 char title (should succeed)
- Character counter shows remaining chars

#### AC 4.3: Post Body Validation
**Given** I am creating a post
**When** I enter a body
**Then** body is optional (can be empty)
**And** body max length is 5000 characters
**And** body over 5000 chars shows error
**And** body supports line breaks (preserves formatting)

**Validation:**
- Submit post with no body (should succeed)
- Submit with 5001 chars (should fail)
- Enter multiline text, verify display preserves lines
- Character counter shows remaining chars

#### AC 4.4: External URL Validation
**Given** I am adding an external link to a post
**When** I enter a URL
**Then** URL must match regex `^https?://.*`
**And** invalid URL shows error "Please enter a valid URL"
**And** URL is optional (can be empty)
**And** URL max length is 2048 characters

**Edge Cases:**
- HTTP URL (should accept, optionally upgrade to HTTPS)
- `ftp://` protocol (should reject)
- No protocol (should reject or auto-prepend https://)
- Very long URL (should truncate or reject)

**Validation:**
- Test various URL formats
- Verify error messages
- Check database stores correct value

#### AC 4.5: Post Creation Success
**Given** I have entered valid post data
**When** I click "Create Post"
**Then** modal closes
**And** toast notification shows "Post created successfully"
**And** new post appears at top of channel feed
**And** post shows my display name as author
**And** timestamp shows "just now"

**Validation:**
- Create post, verify in database
- Verify RLS allows reading own post
- Check optimistic UI update vs realtime update

#### AC 4.6: Post Creation Failure Handling
**Given** I am creating a post
**When** the API request fails (network error, server error, RLS block)
**Then** modal remains open
**And** error message displays above form
**And** form data is preserved (not lost)
**And** I can retry submission

**Validation:**
- Simulate network failure
- Simulate RLS policy block (wrong account)
- Verify error message is user-friendly

#### AC 4.7: Guidelines Acknowledgment Gate
**Given** I have NOT acknowledged community guidelines
**When** I view the community
**Then** "New Post" button is disabled
**And** hovering shows tooltip "Please accept guidelines first"
**And** guidelines modal is shown with prompt to accept

**Validation:**
- New user first visit
- Verify post button disabled state
- After accepting, button becomes enabled

---

## 5. Post Display

### User Story
As a user, I want to see posts in a feed with author info, content, timestamps, and interactions.

### Acceptance Criteria

#### AC 5.1: Post Feed Display
**Given** I am viewing a channel with 25 posts
**When** the feed loads
**Then** I see posts sorted newest first (created_at DESC)
**And** each post shows: author name, handle, timestamp, title, body, reactions, comment count
**And** posts load 20 at a time with infinite scroll

**Validation:**
- Create 25 posts with different timestamps
- Verify sort order
- Scroll to bottom, verify next 20 load
- Check loading indicator appears

#### AC 5.2: Post Header Display
**Given** a post authored by "Alex" with handle "alex-h7k2"
**When** I view the post
**Then** header shows:
- Display name "Alex" (bold)
- Handle "@alex-h7k2" (lighter text)
- Timestamp "2 minutes ago" (relative)
**And** hovering timestamp shows full date/time

**Validation:**
- Check various timestamp formats (1 min, 1 hour, 1 day, 1 week)
- Verify tooltip with full timestamp
- Verify author name is clickable (Phase 2: profile view)

#### AC 5.3: Post Content Display
**Given** a post with title and body
**When** I view the post
**Then** title is displayed in larger font (heading)
**And** body text preserves line breaks
**And** URLs in body are auto-linked and open in new tab
**And** @mentions are highlighted (if present)

**Validation:**
- Post with multiline body
- Post with URL in body
- Post with @mention
- Verify link has target="_blank" rel="noopener"

#### AC 5.4: External Link Display
**Given** a post has an external URL
**When** I view the post
**Then** URL is displayed below body as clickable link
**And** link shows domain only (e.g., "example.com")
**And** clicking opens in new tab
**And** link has icon indicating external

**Validation:**
- Post with external URL
- Verify link truncation for long domains
- Verify new tab behavior

#### AC 5.5: Post Actions Display
**Given** I am viewing a post I authored
**When** I hover over the post
**Then** I see action buttons: Edit, Delete
**And** clicking Edit opens edit modal with current content
**And** clicking Delete shows confirmation dialog

**Validation:**
- Verify edit/delete only for own posts
- Other users' posts show no edit/delete
- Admin sees delete on all posts (Phase 2)

#### AC 5.6: Empty Feed State
**Given** a channel has no posts
**When** I view the channel
**Then** I see empty state message "No posts yet. Be the first to share!"
**And** "New Post" button is prominently displayed
**And** no loading spinner appears

**Validation:**
- New channel with 0 posts
- After deleting all posts
- Verify encouraging empty state design

#### AC 5.7: Deleted Post Display
**Given** a post has been soft-deleted (deleted_at is set)
**When** I view the feed
**Then** deleted post shows placeholder "[Post deleted]"
**And** comment count is still visible
**And** existing comments remain visible
**And** no new comments or reactions allowed

**Validation:**
- Delete a post with comments
- Verify comments persist
- Verify reaction buttons disabled
- Verify title/body hidden

---

## 6. Comments

### User Story
As a user, I want to add comments to posts to participate in discussions.

### Acceptance Criteria

#### AC 6.1: Comment Display
**Given** a post has 5 comments
**When** I view the post
**Then** comments appear below post in chronological order (oldest first)
**And** each comment shows: author name, handle, timestamp, body
**And** comment count badge shows "5 comments"

**Validation:**
- Create comments with different timestamps
- Verify sort order (created_at ASC)
- Verify count accuracy

#### AC 6.2: Comment Composer
**Given** I am viewing a post
**When** I click "Add comment"
**Then** inline textarea expands
**And** textarea shows placeholder "Write a comment..."
**And** Submit button appears
**And** Cancel button appears

**Validation:**
- Click textarea, verify expansion
- Click cancel, verify collapse
- Verify focus management

#### AC 6.3: Comment Body Validation
**Given** I am writing a comment
**When** I enter text
**Then** comment must be 1-2000 characters
**And** empty comment shows error "Comment cannot be empty"
**And** comment over 2000 chars shows error
**And** submit disabled until valid

**Edge Cases:**
- Just whitespace (should reject)
- Single character (should accept)
- Multiline text (should preserve)

**Validation:**
- Submit empty comment (should fail)
- Submit 2001 chars (should fail)
- Verify character counter

#### AC 6.4: Comment Creation Success
**Given** I have entered valid comment text
**When** I click "Submit"
**Then** comment appears at bottom of comment list
**And** toast shows "Comment added"
**And** comment count increments
**And** textarea collapses and clears

**Validation:**
- Create comment, verify in database
- Verify optimistic update
- Check RLS allows reading own comment

#### AC 6.5: Comment Edit/Delete
**Given** I authored a comment
**When** I hover over my comment
**Then** I see Edit and Delete icons
**And** clicking Edit makes text editable inline
**And** clicking Delete shows confirmation
**And** other users' comments show no actions

**Validation:**
- Edit comment, verify updated_at changes
- Delete comment, verify soft delete
- Other user cannot edit/delete my comment

#### AC 6.6: Comments on Deleted Post
**Given** a post is deleted
**When** I view the post
**Then** existing comments remain visible
**And** I cannot add new comments
**And** comment composer is disabled with message "Post deleted"

**Validation:**
- Delete post with comments
- Verify comments still render
- Verify comment form disabled

---

## 7. Reactions

### User Story
As a user, I want to quickly react to posts with emoji to show appreciation without writing a comment.

### Acceptance Criteria

#### AC 7.1: Reaction Options Display
**Given** I am viewing a post
**When** I look at reaction options
**Then** I see 5 reaction types:
- 👍 (thumbs_up)
- ⭐ (star)
- 🎉 (celebrate)
- 👏 (clap)
- 😂 (laugh)
**And** each shows count of users who reacted
**And** reactions I've added are highlighted

**Validation:**
- Verify all 5 reactions render
- React to post, verify highlight
- Unreact, verify highlight removed

#### AC 7.2: Adding Reaction
**Given** I have not reacted to a post
**When** I click a reaction icon
**Then** reaction count increments immediately (optimistic)
**And** icon is highlighted for me
**And** my reaction is saved to database
**And** other users see updated count via realtime

**Validation:**
- Click reaction, check database
- Verify realtime update to other session
- Verify optimistic UI update

#### AC 7.3: Removing Reaction
**Given** I have previously reacted with 👍
**When** I click the 👍 icon again
**Then** my reaction is removed
**And** count decrements
**And** icon is no longer highlighted
**And** database record is deleted

**Validation:**
- Toggle reaction on/off multiple times
- Verify database insert/delete
- Verify count accuracy

#### AC 7.4: Multiple Reactions Per Post
**Given** I have reacted with 👍
**When** I click ⭐ on the same post
**Then** both reactions are highlighted
**And** I can have up to 5 different reactions on one post
**And** each reaction increments respective count

**Validation:**
- Add all 5 reactions to one post
- Verify all highlighted
- Verify database has 5 rows

#### AC 7.5: Reaction Hover Tooltip
**Given** a post has 3 thumbs_up reactions
**When** I hover over the 👍 icon
**Then** tooltip shows "Alex, Maria, and 1 other"
**And** if >3 users, shows "Alex, Maria, and 5 others"
**And** if just me, shows "You"

**Validation:**
- React as 1 user, verify tooltip
- React as 5 users, verify truncation
- Verify name order (could be alphabetical or recent)

#### AC 7.6: Reaction Rate Limiting
**Given** I am rapidly clicking reactions
**When** I exceed 30 reactions in 1 minute
**Then** I see error "Slow down! Too many reactions"
**And** subsequent reactions are blocked for 1 minute
**And** event is logged for abuse monitoring

**Validation:**
- Script to click 31 reactions rapidly
- Verify error appears
- Verify rate limit resets after 60 seconds

---

## 8. Mentions

### User Story
As a user, I want to mention other account members in posts/comments to draw their attention.

### Acceptance Criteria

#### AC 8.1: Mention Autocomplete Trigger
**Given** I am writing a post or comment
**When** I type `@` character
**Then** autocomplete dropdown appears
**And** dropdown shows account members matching my query
**And** dropdown filters as I continue typing

**Validation:**
- Type `@` in post body
- Type `@` in comment body
- Verify dropdown appears in both

#### AC 8.2: Mention Autocomplete Results
**Given** I have typed `@al`
**When** autocomplete searches
**Then** results show users with handles starting with "al"
**And** results are limited to current account members only
**And** each result shows: display name, handle, (optional: avatar)
**And** results sorted alphabetically by display name

**Validation:**
- Type `@al`, verify only "alex-*" handles
- Verify no results from other accounts
- Test with user who has no matching members

#### AC 8.3: Mention Selection
**Given** autocomplete shows 3 results
**When** I click on "Alex (@alex-h7k2)"
**Then** `@alex-h7k2` is inserted into text at cursor
**And** dropdown closes
**And** mention is highlighted in editor
**And** I can continue typing after mention

**Validation:**
- Select mention, verify text insertion
- Cursor position after mention
- Highlight styling in editor

#### AC 8.4: Mention Parsing on Submit
**Given** my post body contains "@alex-h7k2 great idea!"
**When** I submit the post
**Then** backend parses mentions and creates mention record
**And** mention record includes: post_id, mentioned_user_id, author_id
**And** mentioned user is validated as account member
**And** invalid mentions are ignored (no error, just not recorded)

**Validation:**
- Post with valid mention, check mentions table
- Post with invalid handle, verify no mention record
- Post with mention from other account, verify ignored

#### AC 8.5: Mention Display in Content
**Given** a post body contains "@alex-h7k2"
**When** I view the post
**Then** mention is highlighted (e.g., blue text, bold)
**And** clicking mention shows user profile (Phase 2) or is non-clickable (Phase 1)
**And** @handle format is preserved

**Validation:**
- Verify styling on mentions
- Verify non-mention @text is not highlighted
- Verify multiple mentions in one post

#### AC 8.6: Mention Validation
**Given** I mention a user who is not in current account
**When** I submit the post
**Then** mention is NOT created in mentions table
**And** text is preserved but not highlighted
**And** no notification is sent
**And** no error shown to author

**Validation:**
- Mention user from Account B while in Account A
- Verify mention text exists but no mention record
- Verify no notification created

#### AC 8.7: Mention Notifications (Phase 1: Logged Only)
**Given** another user mentions me
**When** the post is created
**Then** mention record is created with `read_at = null`
**And** (Phase 1) no in-app notification shown yet
**And** (Phase 1) no email sent yet
**And** mention is queryable for Phase 2 notification system

**Note:** Full notification UI is Phase 2. Phase 1 just records mentions.

**Validation:**
- Mention another user, check mentions table
- Verify read_at is null initially
- Phase 2 will implement notification badge

---

## 9. Community Guidelines

### User Story
As a new community member, I need to acknowledge community guidelines before I can post.

### Acceptance Criteria

#### AC 9.1: Guidelines Modal on First Visit
**Given** I am a first-time community visitor
**When** I navigate to `/community`
**Then** guidelines modal appears automatically
**And** modal is not dismissible without accepting
**And** modal shows full guidelines text
**And** modal has checkbox "I agree to these guidelines"
**And** "Continue" button is disabled until checkbox checked

**Validation:**
- New user first visit
- Cannot close modal with ESC or click-outside
- Checkbox must be checked to enable button

#### AC 9.2: Guidelines Acceptance
**Given** I have read and checked the agreement box
**When** I click "Continue"
**Then** modal closes
**And** `community_guidelines_ack` timestamp is saved to user profile
**And** "New Post" button becomes enabled
**And** I can now create posts/comments/reactions

**Validation:**
- Check database for timestamp
- Verify post button enabled
- Subsequent visits don't show modal again

#### AC 9.3: Guidelines Link in Header
**Given** I have already acknowledged guidelines
**When** I view the community
**Then** I see "Community Guidelines" link in page header
**And** clicking it reopens modal (view-only, no checkbox)
**And** modal can be dismissed with ESC or close button

**Validation:**
- Link appears in header
- Modal reopens in view mode
- No re-acceptance required

#### AC 9.4: Guidelines Content Source
**Given** guidelines content is defined
**When** the system loads guidelines
**Then** content is loaded from static markdown file (Phase 1)
**And** content includes sections: Purpose, Behavior, Consequences
**And** content is same for all accounts (not customizable in Phase 1)

**Note:** Phase 2 may allow per-account customization via CMS.

**Validation:**
- Verify markdown file exists at expected path
- Verify content renders with proper formatting
- Test with sample guidelines text

#### AC 9.5: Guidelines for Existing Users
**Given** I am an existing user when guidelines feature launches
**When** I first visit community after feature launch
**Then** I see guidelines modal (as if first-time visitor)
**And** I must acknowledge before posting
**And** my previous posts (if any) remain visible

**Validation:**
- Simulate feature rollout to existing users
- Verify modal triggers for users without timestamp
- Verify posts aren't hidden during rollout

---

## 10. Account Switching

### User Story
As a user with multiple accounts, I want to switch between accounts and see each account's community without data bleed.

### Acceptance Criteria

#### AC 10.1: Account Switch Triggers Community Refresh
**Given** I am viewing Account A's community
**When** I switch to Account B via account switcher
**Then** community page reloads
**And** channel list updates to Account B's channels
**And** post feed updates to Account B's posts
**And** URL updates to reflect account context (if applicable)

**Validation:**
- Switch from Account A to Account B
- Verify database queries filter by new account_id
- Verify no stale data from previous account

#### AC 10.2: No Cross-Account Data Leakage
**Given** I have posted in Account A and Account B
**When** I view Account A's community
**Then** I see ONLY Account A's posts, comments, reactions
**And** Account B's posts are completely hidden
**And** mentions from Account B do not appear
**And** channel list shows only Account A's channels

**Validation:**
- Create posts in both accounts
- Switch between accounts multiple times
- Verify RLS policies enforce isolation
- Check browser dev tools for any wrong account data

#### AC 10.3: Realtime Subscription Updates on Switch
**Given** I have realtime subscription to Account A's channels
**When** I switch to Account B
**Then** realtime subscription to Account A is terminated
**And** new realtime subscription to Account B is established
**And** I receive realtime updates only for Account B
**And** no memory leaks from old subscriptions

**Validation:**
- Monitor WebSocket connections
- Verify old subscription closed
- Post in Account A while viewing Account B (should not show)
- Post in Account B, verify realtime update appears

#### AC 10.4: Unsaved Draft Handling
**Given** I am composing a post in Account A
**When** I switch to Account B without saving
**Then** I see confirmation dialog "Discard unsaved post?"
**And** clicking "Discard" switches accounts and clears draft
**And** clicking "Cancel" keeps me in Account A with draft intact

**Validation:**
- Type post, switch accounts
- Verify confirmation appears
- Test both discard and cancel flows

#### AC 10.5: Guidelines Ack Per User (Not Per Account)
**Given** I have acknowledged guidelines in Account A
**When** I switch to Account B
**Then** I do NOT see guidelines modal again
**And** `community_guidelines_ack` is user-level (not account-level)
**And** I can post immediately in Account B

**Validation:**
- Accept guidelines in Account A
- Switch to Account B
- Verify no modal shown
- Verify can post in both accounts

#### AC 10.6: Account Switcher Integration
**Given** I am on `/community` page
**When** I click the account switcher dropdown
**Then** I see all my accounts listed
**And** current account is highlighted
**And** switching account does not break community page
**And** switching account closes any open modals

**Validation:**
- Use existing account switcher component
- Verify integration with community page
- Check modal cleanup on switch

---

## 11. Real-time Updates

### User Story
As a user, I want to see new posts, comments, and reactions appear automatically without refreshing the page.

### Acceptance Criteria

#### AC 11.1: Realtime Post Creation
**Given** I am viewing a channel
**And** another user creates a post in the same channel
**When** their post is submitted
**Then** I see the new post appear at top of feed within 2 seconds
**And** no page refresh is required
**And** post appears with smooth animation

**Validation:**
- Two browser sessions logged in as different users
- User A creates post
- Verify User B sees it appear automatically
- Measure latency (should be <2 seconds)

#### AC 11.2: Realtime Comment Addition
**Given** I am viewing a post with 5 comments
**And** another user adds a comment
**When** their comment is submitted
**Then** I see the new comment appear at bottom within 2 seconds
**And** comment count increments automatically
**And** no page refresh required

**Validation:**
- Two sessions viewing same post
- User A adds comment
- User B sees it appear
- Verify count update

#### AC 11.3: Realtime Reaction Update
**Given** I am viewing a post
**And** another user reacts with 👍
**When** their reaction is submitted
**Then** I see reaction count increment immediately
**And** hover tooltip updates with new name
**And** no page refresh required

**Validation:**
- Two sessions on same post
- User A reacts
- User B sees count change
- Verify tooltip updates

#### AC 11.4: Realtime Subscription Filtering
**Given** I am subscribed to realtime updates
**When** updates occur
**Then** I receive ONLY updates for my current account
**And** I receive ONLY updates for the channel I'm viewing
**And** updates from other accounts/channels are filtered out

**Validation:**
- Create posts in different channels
- Verify channel filter works
- Create posts in different accounts
- Verify account filter works

#### AC 11.5: Offline/Reconnection Handling
**Given** I lose internet connection
**When** connectivity is restored
**Then** realtime subscription reconnects automatically
**And** I see a notification "Reconnected"
**And** feed refreshes to show any missed updates
**And** no duplicate posts appear

**Validation:**
- Disable network in dev tools
- Wait 10 seconds
- Re-enable network
- Verify reconnection and catch-up

#### AC 11.6: Realtime Performance
**Given** a channel has high activity (10 posts per minute)
**When** I am subscribed to realtime updates
**Then** updates appear smoothly without UI jank
**And** page remains responsive
**And** memory usage does not grow indefinitely
**And** CPU usage remains acceptable

**Validation:**
- Simulate high activity with script
- Monitor browser performance metrics
- Check for memory leaks after 5 minutes

#### AC 11.7: Realtime Feature Flag
**Given** `community_realtime` feature flag is disabled
**When** I view the community
**Then** realtime subscriptions are not established
**And** I see "Auto-refresh disabled" notice
**And** I can manually refresh feed with button
**And** all other features work normally

**Validation:**
- Toggle feature flag off
- Verify no WebSocket connection
- Verify manual refresh works
- Toggle back on, verify realtime resumes

---

## 12. Permissions & Security

### User Story
As a user, I should only be able to access and modify content within my authorized accounts, and the system should prevent unauthorized access.

### Acceptance Criteria

#### AC 12.1: Account Membership Verification
**Given** I am a member of Account A only
**When** I attempt to access Account B's community
**Then** I am blocked by RLS policy
**And** API returns 403 Forbidden
**And** UI shows error "You don't have access to this community"

**Validation:**
- User A in Account A
- User B in Account B (no overlap)
- User A tries to access Account B data via API
- Verify 403 response

#### AC 12.2: Post Ownership Verification
**Given** I created a post
**When** I attempt to edit or delete it
**Then** action succeeds
**And** given another user's post
**When** I attempt to edit or delete it
**Then** action is blocked by RLS
**And** API returns 403 or no edit/delete UI shown

**Validation:**
- User A creates post
- User B tries to edit via API
- Verify RLS blocks write

#### AC 12.3: Comment Ownership Verification
**Given** I created a comment
**When** I attempt to edit or delete it
**Then** action succeeds
**And** given another user's comment
**When** I attempt to edit or delete it
**Then** action is blocked

**Validation:**
- Same as post ownership test
- Verify RLS on post_comments table

#### AC 12.4: Cross-Account Mention Prevention
**Given** I am in Account A
**When** I mention a user from Account B
**Then** mention is not created in database
**And** no notification is sent
**And** mention appears as plain text (not highlighted)

**Validation:**
- Attempt to mention user from different account
- Check mentions table (should be empty)
- Verify backend validation

#### AC 12.5: Reaction Scope Verification
**Given** I reacted to a post in Account A
**When** I switch to Account B
**Then** my reaction is NOT visible in Account B
**And** I cannot react to the same post from Account B
**And** post may not even be visible in Account B

**Validation:**
- React in Account A
- Switch to Account B
- Verify reaction isolated to Account A

#### AC 12.6: Admin Override Permissions (Phase 2)
**Given** I am a PromptReviews admin
**When** I view any account's community
**Then** I can view all posts
**And** I can delete any content
**And** I can pin posts (Phase 2)
**And** my admin role is checked via `is_admin` flag in accounts table

**Note:** Admin features may be Phase 2, but RLS should support role check.

**Validation:**
- Set user `is_admin = true`
- Verify can access other accounts' communities
- Verify can delete others' posts

#### AC 12.7: SQL Injection Prevention
**Given** I attempt to inject SQL via post title/body
**When** I submit malicious input
**Then** input is properly escaped/sanitized
**And** no SQL injection occurs
**And** content is displayed as plain text

**Validation:**
- Test with `'; DROP TABLE posts; --`
- Verify parameterized queries
- Verify output escaping

#### AC 12.8: XSS Prevention
**Given** I attempt to inject JavaScript via post body
**When** I submit `<script>alert('xss')</script>`
**Then** script tags are escaped
**And** content displays as plain text
**And** script does not execute

**Validation:**
- Submit various XSS payloads
- Verify DOMPurify sanitization
- Verify no script execution

#### AC 12.9: Rate Limiting
**Given** I am creating posts rapidly
**When** I exceed 5 posts per minute
**Then** I see error "Slow down! You're posting too fast"
**And** subsequent posts are blocked for 1 minute
**And** event is logged for abuse detection

**Validation:**
- Script to create 6 posts in 10 seconds
- Verify rate limit error
- Verify reset after 60 seconds

---

## 13. Performance

### User Story
As a user, I expect the community to load quickly and remain responsive even with large amounts of content.

### Acceptance Criteria

#### AC 13.1: Initial Page Load Performance
**Given** I navigate to `/community`
**When** the page loads
**Then** time to interactive is <2 seconds on fast 3G
**And** initial 20 posts load without pagination UI
**And** Lighthouse performance score >80

**Validation:**
- Use Chrome DevTools throttling
- Measure FCP, LCP, TTI
- Run Lighthouse audit

#### AC 13.2: Infinite Scroll Performance
**Given** I am viewing a channel with 500 posts
**When** I scroll to bottom
**Then** next page loads within 500ms
**And** scroll position is maintained
**And** no layout shift occurs
**And** loading indicator appears smoothly

**Validation:**
- Seed database with 500 posts
- Scroll to trigger pagination
- Measure API response time
- Check Cumulative Layout Shift

#### AC 13.3: Realtime Update Performance
**Given** 10 new posts arrive via realtime
**When** they are inserted into feed
**Then** UI remains responsive (no jank)
**And** frame rate stays >30fps
**And** smooth scroll is not interrupted

**Validation:**
- Simulate burst of 10 posts
- Monitor fps in Chrome DevTools
- Verify no forced reflow

#### AC 13.4: Image/Avatar Loading
**Given** posts contain user avatars (if implemented)
**When** feed loads
**Then** avatars are lazy-loaded
**And** placeholder shown while loading
**And** failed avatars show fallback icon
**And** images are cached for repeat views

**Note:** Avatars may be Phase 2, but pattern applies.

**Validation:**
- Throttle network
- Verify lazy loading triggers
- Check browser cache headers

#### AC 13.5: Database Query Performance
**Given** a channel has 10,000 posts
**When** I load the feed
**Then** query executes in <100ms
**And** index on (account_id, channel_id, created_at DESC) is used
**And** EXPLAIN ANALYZE shows efficient plan

**Validation:**
- Seed 10k posts
- Run EXPLAIN ANALYZE on feed query
- Verify index usage
- Check no sequential scans

#### AC 13.6: Memory Management
**Given** I have been browsing community for 30 minutes
**When** I check browser memory usage
**Then** memory growth is <50MB
**And** no memory leaks detected
**And** realtime subscriptions are properly cleaned up

**Validation:**
- Use Chrome Memory Profiler
- Take heap snapshots
- Check for detached DOM nodes

#### AC 13.7: Bundle Size
**Given** community feature is loaded
**When** I check JavaScript bundle size
**Then** community chunk is <100KB gzipped
**And** code splitting isolates community code
**And** community loads on demand (not in main bundle)

**Validation:**
- Run production build
- Analyze bundle with webpack-bundle-analyzer
- Verify code splitting

---

## Cross-Cutting Concerns

### Error Handling

#### AC 14.1: API Error Display
**Given** an API request fails
**When** error is returned
**Then** user sees friendly error message (not technical details)
**And** error is logged to Sentry with context
**And** user can retry the action

**Validation:**
- Simulate 500 error
- Verify error message shown
- Check Sentry for logged error

#### AC 14.2: Network Offline State
**Given** I am offline
**When** I attempt any action
**Then** I see "You're offline" banner
**And** actions are queued (if applicable)
**And** actions retry when back online

**Validation:**
- Go offline in dev tools
- Attempt post creation
- Go back online, verify retry

---

### Accessibility

#### AC 15.1: Keyboard Navigation
**Given** I am using keyboard only
**When** I navigate the community
**Then** all interactive elements are reachable via Tab
**And** Enter/Space activate buttons
**And** Escape closes modals
**And** focus indicator is visible

**Validation:**
- Navigate entire community with keyboard
- Verify tab order logical
- Test screen reader announcements

#### AC 15.2: ARIA Labels
**Given** I am using a screen reader
**When** I navigate the community
**Then** all buttons have aria-labels
**And** post updates are announced via aria-live
**And** modal has aria-modal and focus trap

**Validation:**
- Run axe DevTools audit
- Test with VoiceOver or NVDA
- Verify WCAG 2.1 AA compliance

---

### Analytics

#### AC 16.1: Event Tracking
**Given** I perform actions in community
**When** actions complete
**Then** events are logged to analytics:
- `community_viewed` (channel, account_id)
- `post_created` (channel, account_id)
- `comment_created` (post_id, account_id)
- `reaction_added` (reaction_type, account_id)
- `mention_created` (mentioned_user_id, account_id)

**Validation:**
- Perform each action
- Check analytics dashboard
- Verify event payloads

---

## Definition of Done (MVP)

A feature is considered DONE when:

1. All acceptance criteria pass
2. Manual testing completed by QA
3. E2E tests written and passing
4. RLS policies tested with multi-account scenarios
5. Performance benchmarks met
6. Accessibility audit passes (axe)
7. Security review completed (no P0/P1 issues)
8. Analytics events firing correctly
9. Error handling tested (network failures, API errors)
10. Documentation updated (API docs, user guide)
11. Feature flag configured and tested
12. Stakeholder demo approved

---

## Out of Scope (Phase 2)

The following are explicitly OUT of scope for MVP:

- Monthly/weekly summary auto-posting
- Digest sharing buttons and share modals
- @everyone broadcast mentions
- Saved/pinned posts surface
- In-app notification badges
- Email notifications for mentions
- User profile pages
- Direct messages
- File/image uploads
- Rich text editor
- Post threading
- Channel customization UI
- Admin moderation queue
- Search functionality
- Post analytics (view counts)

---

## Success Metrics (Post-Launch)

After MVP launch, measure:

- **Engagement Rate:** % of active accounts that visit community weekly (target: 30%)
- **Participation Rate:** % of community visitors who post/comment/react (target: 15%)
- **Retention:** % of users who return to community within 7 days (target: 40%)
- **Security:** Zero cross-account data exposure incidents (target: 0)
- **Performance:** P95 page load time <2s (target: <2s)
- **Errors:** Error rate <1% of requests (target: <1%)

Track via analytics dashboard and review weekly for first month post-launch.

---

**Document Status:** Draft - Ready for Technical Review
**Next Steps:** Review with engineering team, refine ambiguous criteria, assign to implementation sprints
