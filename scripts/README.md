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

### fix_businesses_id_constraint_local.sql

**Purpose:** Removes incorrect foreign key constraint that links business `id` to `auth.users(id)`.

**When to use:** If you encounter errors during business creation like:
```
insert or update on table "businesses" violates foreign key constraint "businesses_id_fkey"
```

**Usage:**
```bash
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/fix_businesses_id_constraint_local.sql
```

**What it does:**
- Removes the `businesses_id_fkey` foreign key constraint 
- Business IDs become independent unique identifiers (as they should be)
- Maintains other proper constraints like `fk_businesses_account_id`
- **IMPORTANT:** Only run on local database, never on production

**Background:** An incorrect migration created a foreign key constraint linking `businesses.id` to `auth.users(id)`, which is conceptually wrong. Business IDs should be unique identifiers for businesses, not tied to user IDs. The proper relationship is through `account_id`. 