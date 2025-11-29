# Plan: Review Upload Feature

## Overview
Add a CSV upload feature to the Reviews page, similar to the existing Contact Upload feature. Users can download a template CSV, fill in their reviews, and upload them in bulk.

## Current State
- **Contact Upload**: Fully implemented at `/dashboard/contacts` with template download, validation, and API at `/api/upload-contacts`
- **Review Download**: Placeholder only (`alert("Export to CSV coming soon!")`) - needs implementation
- **Review Upload**: Does not exist

## Goals
1. Implement review CSV download/export with all relevant fields
2. Implement review CSV upload with template download
3. Match the UX patterns from contact upload (modal, preview, validation)

---

## Part 1: Review Export (Download CSV)

### API Endpoint
**File:** `/src/app/(app)/api/reviews/export/route.ts` (new)

**Method:** `GET`

**CSV Fields to Export:**
```
Platform
Star Rating
Review Content
Reviewer First Name
Reviewer Last Name
Reviewer Role
Reviewer Email
Reviewer Phone
Status
Verified
Created At
Location Name
Imported From Google
```

### Implementation Steps
1. Create `/api/reviews/export/route.ts`
2. Use `getRequestAccountId()` for account isolation
3. Query `review_submissions` for account
4. Format as CSV with proper escaping
5. Return with `Content-Disposition: attachment`

### UI Changes
- Replace placeholder `handleExport` in `/dashboard/reviews/page.tsx`
- Use `tokenManager.getAccessToken()` pattern for blob download

---

## Part 2: Review Upload

### Template CSV Structure
```csv
platform,star_rating,review_content,reviewer_first_name,reviewer_last_name,reviewer_role,reviewer_email,reviewer_phone,review_date,location_name
Google Business Profile,5,"Excellent service! Highly recommend.",John,Smith,Customer,john@example.com,555-123-4567,2024-01-15,Portland OR 97201
Yelp,4,"Great experience overall.",Jane,Doe,Client,,555-987-6543,2024-01-10,
```

### Required Fields
- `platform` (required)
- `review_content` (required)
- At least one of: `reviewer_first_name` OR `reviewer_email` OR `reviewer_phone`

### Optional Fields
- `star_rating` (1-5, nullable for non-Google platforms)
- `reviewer_last_name`
- `reviewer_role`
- `reviewer_email`
- `reviewer_phone`
- `review_date` (defaults to today)
- `location_name` (for multi-location tracking)

### API Endpoint
**File:** `/src/app/(app)/api/reviews/upload/route.ts` (new)

**Method:** `POST`

**Request:** FormData with CSV file

**Response:**
```json
{
  "message": "Successfully uploaded reviews",
  "reviewsCreated": 15,
  "errors": []
}
```

### Validation Rules
1. `platform` is required and non-empty
2. `review_content` is required and non-empty
3. Must have reviewer identification (first_name, email, or phone)
4. `star_rating` must be 1-5 if provided
5. `review_date` must be valid date if provided

### Data Processing
For each valid row:
1. Create `review_submissions` record with:
   - `account_id` from request context
   - `status: 'submitted'`
   - `verified: true` (manual upload = trusted)
   - `verified_at: now()`
   - `location_name` if provided
   - All other fields mapped from CSV

2. Optionally link to existing contact:
   - If `reviewer_email` matches existing contact, set `contact_id`
   - If `reviewer_phone` matches existing contact, set `contact_id`

### UI Components

**Location:** `/dashboard/reviews/page.tsx`

**New Components:**
1. "Import Reviews" button (next to export button)
2. Import modal with two sections:

#### Section 1: Import from Google Business Profile
```
Import from Google

Pull reviews directly from your Google Business Profile.
[Import from Google] (if GBP connected)
-- or --
[Connect Google Business Profile] (if not connected, links to /dashboard/google-business)
[Learn how to export from Google] (link to tutorial/help doc)
```

**Logic:**
- Check if account has GBP connected (`google_business_profiles` table)
- If connected: Show "Import from Google" button (reuse existing import flow)
- If not connected: Show "Connect Google Business Profile" link + tutorial link

#### Section 2: Upload from CSV
```
Upload from CSV

Upload reviews from a spreadsheet. This will:
• Create review records in your database
• Automatically create contacts for reviewers with email or phone
• Link reviews to existing contacts when email/phone matches

[Choose CSV file]    [Download template]
```

- File input (accept=".csv")
- "Download Template" button
- Preview table (first 5 rows)
- Validation error display
- Upload/Cancel buttons

### Contact Auto-Creation Logic
For each review row:
1. If `reviewer_email` provided:
   - Check if contact exists with that email
   - If exists: link review to contact via `contact_id`
   - If not: create new contact, link review
2. Else if `reviewer_phone` provided:
   - Same logic with phone lookup
3. Else (no email or phone):
   - Create review without contact link
   - Store `first_name`/`last_name` directly on review

### Template Download
Generate CSV with:
- Header row with all field names
- 2-3 example rows showing different platforms
- Sample data demonstrating optional fields
- Example with email (will create contact)
- Example without email/phone (review only)

---

## Part 3: Update Review Download to Match Upload

Ensure the export CSV can be re-imported (round-trip compatibility):
- Same column names as upload template
- Same field formatting
- Exclude internal fields (id, account_id, google_review_id, etc.)

---

## File Changes Summary

### New Files
1. `/src/app/(app)/api/reviews/export/route.ts` - Export API
2. `/src/app/(app)/api/reviews/upload/route.ts` - Upload API

### Modified Files
1. `/src/app/(app)/dashboard/reviews/page.tsx` - Add upload modal, fix export handler

---

## Security Considerations
- Use `getRequestAccountId()` for all operations
- Never trust client-provided `account_id`
- Validate all fields server-side
- Escape CSV output properly
- Rate limit uploads (reuse existing rate limiter)

---

## Testing Checklist
- [ ] Download template CSV
- [ ] Upload template with sample data
- [ ] Upload with missing required fields (should error)
- [ ] Upload with invalid star_rating (should error)
- [ ] Upload with various platforms
- [ ] Verify reviews appear in reviews list
- [ ] Verify account isolation (reviews only visible to correct account)
- [ ] Export reviews and re-import (round-trip)
- [ ] Test with multi-location data

---

## Implementation Order
1. Review Export API (foundation for template)
2. Export button handler in UI
3. Review Upload API
4. Upload modal UI with template download
5. Testing and refinement
