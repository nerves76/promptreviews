# Fix: Admin Analytics Page Redirects to Dashboard

## 🔍 **Problem**
When you click on the "Analytics" page in the admin area, it redirects you to the dashboard instead of showing the analytics page.

## 🕵️ **Root Cause**
The analytics page (`/admin/analytics`) has an admin status check that runs when the page loads. If this check fails, it redirects to the dashboard. The check is failing because:

1. **No admin users exist** in the `admins` table, OR
2. **RLS (Row Level Security) policies** prevent the browser client from reading the `admins` table

Looking at the code in `src/app/admin/analytics/page.tsx`:
```javascript
const adminStatus = await isAdmin(user.id, supabase);
if (!adminStatus) {
  console.log('Analytics page: User is not admin, redirecting to dashboard');
  router.push('/dashboard');
  return;
}
```

## 🚀 **Quick Fix Solutions**

### Option 1: SQL Script (Recommended)
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `fix-admin-analytics-redirect.sql`
4. **Replace `'your-email@example.com'` with your actual email address**
5. Run the script
6. Try accessing `/admin/analytics` again

### Option 2: Node.js Script
1. Run: `node fix-admin-access.js`
2. This will automatically detect and fix the issue

### Option 3: Manual SQL Commands
If you prefer to run commands manually:

```sql
-- Check if you have any admin users
SELECT COUNT(*) FROM admins;

-- If count is 0, add yourself as admin (replace with your email)
INSERT INTO admins (account_id)
SELECT id FROM auth.users 
WHERE email = 'your-email@example.com'
LIMIT 1;

-- Fix RLS policies
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to check admin status" ON admins
  FOR SELECT TO authenticated USING (true);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
```

## 🧪 **How to Test**
After running the fix:

1. **Log in** to your application with the email you made admin
2. Go to `/admin/analytics` 
3. You should see the analytics page instead of being redirected
4. The page should load admin statistics and charts

## 🔍 **Debugging Steps**
If it's still not working:

### Check Admin Status
```sql
-- See who is currently an admin
SELECT a.*, u.email 
FROM admins a 
JOIN auth.users u ON u.id = a.account_id;
```

### Check Your User ID
```sql
-- Find your user ID by email
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

### Verify Admin Record
```sql
-- Check if you have an admin record
SELECT * FROM admins WHERE account_id = 'your-user-id-here';
```

### Temporary Fix (if all else fails)
```sql
-- Disable RLS completely (not recommended for production)
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
```

## 📋 **Files Created/Modified**

- `fix-admin-access.js` - Node.js script to automatically fix the issue
- `fix-admin-analytics-redirect.sql` - SQL script for manual fixing
- `check-admin-debug.js` - Debug script to investigate the issue

## 🛡️ **Security Notes**

- The fix creates an RLS policy that allows authenticated users to read the `admins` table
- This is necessary for the admin check to work from the browser
- Only users with records in the `admins` table will pass the admin check
- The policy only allows reading admin status, not modifying admin records

## 🎯 **Expected Outcome**

After applying the fix:
- ✅ `/admin/analytics` will load the analytics page
- ✅ You'll see admin statistics and charts
- ✅ Non-admin users will still be redirected to dashboard
- ✅ Admin area will work correctly for authenticated admin users

---

*If you continue to have issues, check the browser console for specific error messages and verify you're logged in as the correct user.*