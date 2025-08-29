
# Database Migration Scripts

This directory contains the SQL migration scripts for the database structure. The scripts are organized by functionality and should be executed in the order specified in the `00-main.sql` file.

## File Structure

- `00-main.sql` - Main coordinator script that imports all other scripts
- `01-extensions.sql` - PostgreSQL extensions setup
- `02-schema.sql` - Database schema creation
- `03-tables.sql` - Tables creation
- `04-views.sql` - Views creation
- `05-functions.sql` - Functions creation
- `06-triggers.sql` - Triggers creation
- `07-indices.sql` - Indices creation
- `08-initial-data.sql` - Initial data insertion
- `09-permissions.sql` - Permissions configuration

## How to Run

You can execute the migrations by running the main coordinator script:

```bash
psql -U your_user -d your_database -a -f scripts/migrations/00-main.sql
```

Or, when using the Supabase SQL Editor, you can copy and paste the contents of `00-main.sql` and execute it.

## Notes

- These scripts should be idempotent (safe to run multiple times)
- When making changes to the database structure, add them to the appropriate file
- After making changes, update the "Last updated" comment at the top of the relevant file
