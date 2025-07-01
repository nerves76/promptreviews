# Welcome Email Debug Report

## Issue Summary
You've set up a welcome email system, but emails are not being sent when users sign up. Based on the code analysis, here are the potential issues and solutions.

## 🔍 Identified Issues

### 1. **Environment Variables Missing**
**Problem**: The `RESEND_API_KEY` environment variable may not be set properly.

**Evidence**:
- Multiple Resend instances initialized with `process.env.RESEND_API_KEY`
- No `.env.local` file found in workspace
- Environment variable checks failing

**Solution**:
```bash
# Create .env.local file with:
RESEND_API_KEY=your_actual_resend_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2. **Email Templates Not in Database**
**Problem**: The 'welcome' email template may be missing or inactive in the database.

**Evidence**:
- Template system looks for `name = 'welcome'` and `is_active = true`
- If template not found, `sendTemplatedEmail` returns `{success: false, error: "Template 'welcome' not found"}`

**Solution**: Run this SQL in your Supabase database:
```sql
-- Check if template exists
SELECT * FROM email_templates WHERE name = 'welcome';

-- If not found, insert it:
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) 
VALUES (
  'welcome',
  'Welcome to PromptReviews! 🎉',
  '<p>Hi {{firstName}},</p><p>Welcome to PromptReviews!</p>',
  'Hi {{firstName}}, Welcome to PromptReviews!',
  true
);

-- If found but inactive, activate it:
UPDATE email_templates SET is_active = true WHERE name = 'welcome';
```

### 3. **isNewUser Logic Issues**
**Problem**: The `isNewUser` detection in auth callback may be failing.

**Evidence**:
- Welcome emails only sent when `isNewUser === true`
- Logic checks `account_users` table for existing links
- If user already has account links, `isNewUser` stays `false`

**Solution**: Check your signup flow and ensure users are properly detected as new.

### 4. **Error Handling Masking Issues**
**Problem**: Email sending errors are caught and logged but don't fail the signup process.

**Evidence**:
- Errors wrapped in try/catch with comment "Don't fail the signup if email fails"
- Users might not know emails failed to send

## 🛠️ Step-by-Step Fix

### Step 1: Check Environment Variables
```bash
# Run the debug script I created
node debug-welcome-email.js
```

### Step 2: Verify Email Templates
Check your Supabase database:
1. Go to Table Editor → email_templates
2. Look for a row with `name = 'welcome'`
3. Ensure `is_active = true`

### Step 3: Test Email API Directly
```bash
# With your Next.js server running (npm run dev)
node test-welcome-email.js
```

### Step 4: Test Signup Flow
1. Open browser console (F12)
2. Sign up with a new email
3. Watch for these logs in console:
   - `🔍 Welcome email check:`
   - `📧 Attempting to send welcome email to:`
   - `✅ Welcome email sent successfully` OR `❌ Welcome email failed:`

### Step 5: Check Resend Dashboard
1. Log into your Resend dashboard
2. Check the "Logs" section for any delivery attempts
3. Look for failed sends or API errors

## 🚨 Quick Fixes

### Fix #1: Missing RESEND_API_KEY
```bash
# Add to .env.local
echo "RESEND_API_KEY=your_key_here" >> .env.local
```

### Fix #2: Missing Email Template
```sql
-- Run in Supabase SQL Editor
INSERT INTO email_templates (name, subject, html_content, is_active) 
VALUES ('welcome', 'Welcome! 🎉', '<p>Hi {{firstName}}, Welcome!</p>', true)
ON CONFLICT (name) DO UPDATE SET is_active = true;
```

### Fix #3: Test Email Sending
```bash
# Test the API endpoint
curl -X POST http://localhost:3001/api/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## 🔧 Enhanced Debugging

I've added enhanced logging to your auth callback. When you sign up now, you'll see detailed logs like:

```
🔍 Welcome email check: { isNewUser: true, email: true }
📧 Attempting to send welcome email to: user@example.com with name: User
✅ Welcome email sent successfully to: user@example.com
```

Or if there's an error:
```
❌ Welcome email failed: Template 'welcome' not found
```

## 📋 Verification Checklist

- [ ] `.env.local` file exists with `RESEND_API_KEY`
- [ ] Email template exists in database with `name = 'welcome'`
- [ ] Email template `is_active = true`
- [ ] Resend API key is valid
- [ ] `isNewUser` logic working correctly
- [ ] No errors in browser console during signup
- [ ] Resend dashboard shows email delivery attempts

## 🆘 Most Likely Issues

Based on the code analysis, these are the most probable causes:

1. **90% chance**: `RESEND_API_KEY` environment variable is missing or invalid
2. **75% chance**: Welcome email template is missing from database
3. **50% chance**: Welcome email template exists but is inactive (`is_active = false`)
4. **25% chance**: `isNewUser` logic is not working correctly

## 📞 Next Steps

1. Run `node debug-welcome-email.js` to identify the specific issue
2. Fix the identified issue(s)
3. Test with `node test-welcome-email.js`
4. Try the signup flow and check browser console logs
5. Verify in Resend dashboard that emails are being sent

The enhanced logging I added will make it much easier to see exactly where the process is failing.