# Database Migrations

This folder contains SQL migration files for MenoEase. Run these in your Supabase SQL Editor.

## Required Migrations (Run in Order)

### 1. Core Subscription System
**File**: `subscription_system.sql`
**What it does**:
- Adds subscription fields to user_profiles
- Creates subscription_tiers table with tier data
- Creates subscription_history table for tracking changes
- Creates reminders and reminder_logs tables
- Sets up RLS policies

**Run this if**: You don't have subscription tiers set up yet.

---

### 2. Reminders Table (Standalone)
**File**: `create_reminders_table.sql`
**What it does**:
- Creates reminders table
- Creates reminder_logs table
- Sets up RLS policies for reminders

**Run this if**:
- You're getting 404 errors when trying to create reminders
- The reminders page shows "Failed to load reminders"
- You want just the reminders feature without the full subscription system

---

### 3. Admin Role Support
**File**: `add_admin_role.sql`
**What it does**:
- Adds `role` field to user_profiles (user/admin)
- Updates RLS policies to allow admins to manage all users
- Creates index for performance

**Run this if**: You want to access the admin panel at `/admin`

---

## How to Run Migrations

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your MenoEase project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste**
   - Open the migration file (e.g., `create_reminders_table.sql`)
   - Copy all the SQL code
   - Paste into the Supabase SQL Editor

4. **Run**
   - Click "Run" button
   - Check for success message

---

## Making Yourself Admin

After running `add_admin_role.sql`:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email address.

---

## Quick Start (Recommended Order)

If you're setting up from scratch:

1. ✅ Run `subscription_system.sql` (includes everything)
2. ✅ Run `add_admin_role.sql` (for admin panel access)
3. ✅ Make yourself admin (SQL above)
4. ✅ Test the app!

If you already have subscriptions set up but reminders aren't working:

1. ✅ Run `create_reminders_table.sql`
2. ✅ Test reminders!

---

## Troubleshooting

### "relation does not exist" errors
- You haven't run the migration yet
- Run the appropriate migration file

### "permission denied" errors
- RLS policies aren't set up correctly
- Re-run the migration file (it has `DROP POLICY IF EXISTS` so it's safe)

### 404 errors when creating/editing
- Table doesn't exist
- Run the migration for that table

### Can't access admin panel
- Run `add_admin_role.sql`
- Update your user's role to 'admin'
