# Community Migrations Log

Store SQL migrations, dry-run results, and rollback scripts for community features.

## Template

For each migration, create a subfolder named `YYYY-MM-DD_description` containing:
- `migration.sql` – SQL applied to Supabase.
- `rollback.sql` – commands to reverse if needed.
- `dry-run.md` – summary of staging rehearsal, including verification queries and screenshots/links.

Record any data backfill scripts or manual steps alongside the migration folder.
