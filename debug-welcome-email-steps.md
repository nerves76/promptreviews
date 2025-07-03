# Welcome Email Debugging Steps

Since your `.env.local` is working, let's focus on debugging the specific welcome email issue.

## 🚀 Quick Debugging Steps

### 1. **Check Browser Console During Signup**

When you sign up locally, open your browser's Developer Tools (F12) and watch the Console tab. Look for these specific messages:

**✅ Success Messages:**
```
📧 Welcome email sent to: [your-email]
```

**❌ Error Messages:**
```
❌ Error sending welcome email: [error details]
```

### 2. **Test the Email Templates**

Since your environment is working, run this command to check email templates:
```bash
npm run dev  # Start the app
```

Then in a new terminal:
```bash
node test-welcome-email.js
```

If it still shows missing env vars, your environment might not be loading correctly for Node.js scripts.

### 3. **Manual Test via Browser**

Instead of the Node.js script, test directly in your running Next.js app:

1. Start your app: `npm run dev`
2. Open browser to `http://localhost:3001`
3. Sign up with a new email address
4. Watch the browser console for welcome email logs

### 4. **Check Email Template in Database**

If you have database access, verify the welcome template exists:

```sql
SELECT name, subject, is_active 
FROM email_templates 
WHERE name = 'welcome' AND is_active = true;
```

### 5. **Access the Admin Area**

The admin area for email templates is at:
- Component: `src/app/components/EmailTemplatesSection.tsx`

To access it, you need:
1. Your user ID to be in the `admins` table
2. Navigate to wherever this component is rendered in your app

## 🔍 Common Issues & Solutions

### **Issue 1: Welcome Template Missing**
**Symptoms:** Email function returns "Template 'welcome' not found"
**Solution:** Run the database migration:
```bash
npx supabase db push
```

### **Issue 2: Resend API Key Invalid**
**Symptoms:** Resend errors in console
**Solution:** 
- Check your Resend dashboard for the correct API key
- Ensure it starts with `re_`
- Verify the domain `updates.promptreviews.app` is verified in Resend

### **Issue 3: Email Never Triggers**
**Symptoms:** No welcome email logs at all
**Solution:** The welcome email only triggers when:
- `isNewUser = true` in the callback route
- User has an email address
- User successfully confirms their email

### **Issue 4: Email Confirmation Required**
**Important:** Welcome emails are sent in the `/auth/callback` route, which means:
1. User must click the email confirmation link
2. Only then does the welcome email get sent
3. If users aren't confirming emails, they won't get welcome emails

## 🧪 Testing Flow

### **Complete Signup Test:**
1. Use a fresh email address (not previously used)
2. Fill out signup form
3. Check email for confirmation link
4. Click confirmation link
5. **This is when the welcome email should be sent**
6. Check browser console for welcome email logs

### **Environment Verification:**
If the Node.js script isn't working, verify your `.env.local` contains:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your-resend-key
```

## 🎯 Next Actions

1. **Immediate Test:** Sign up with a new email and watch browser console
2. **Check Database:** Verify email templates exist
3. **Verify Resend:** Check your Resend dashboard
4. **Access Admin:** Add yourself to `admins` table to manage templates

## 📧 Email Flow Reminder

```
Signup Form → Email Confirmation → Callback Route → Welcome Email
```

The welcome email is NOT sent immediately on signup - it's sent when the user confirms their email address via the callback route.

Let me know what you see in the browser console during signup!