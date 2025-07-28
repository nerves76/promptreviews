# Scripts Directory

This directory contains utility scripts for maintaining and fixing the PromptReviews application.

## Database Maintenance Scripts

### fix_businesses_policies_local.sql

**Purpose:** Fixes RLS (Row Level Security) policies on the businesses table that incorrectly reference a `reviewer_id` column.

**When to use:** If you encounter errors during business creation like:
```
null value in column "reviewer_id" of relation "businesses" violates not-null constraint
```

**Usage:**
```bash
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/fix_businesses_policies_local.sql
```

**What it does:**
- Removes old RLS policies that reference `reviewer_id` (business owners are not reviewers)
- Creates proper RLS policies based on `account_id` 
- Ensures users can only access businesses in their own accounts
- **IMPORTANT:** Only run on local database, never on production

**Background:** Some older migrations created RLS policies that expected business owners to have a `reviewer_id`, which is conceptually incorrect. This script corrects the policies to use the proper `account_id` relationship. 