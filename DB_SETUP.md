# Database Setup Instructions

To complete Phase 1 setup, you need to create the Supabase tables by running the SQL scripts.

## Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL from each file below in order:
   - `scripts/001_create_profiles.sql`
   - `scripts/002_create_documents.sql`
   - `scripts/003_create_analyses.sql`
   - `scripts/004_create_clauses.sql`
5. Run each query

## Option 2: Run via API Endpoint

Navigate to: `/api/db-setup` (will be implemented to help with first-time setup)

## Tables Created

- **profiles** - User account info and analysis usage tracking
- **documents** - Uploaded legal documents
- **analyses** - Analysis results for each document
- **clauses** - Individual clauses extracted from each analysis

All tables have Row Level Security (RLS) policies to ensure users can only see their own data.
