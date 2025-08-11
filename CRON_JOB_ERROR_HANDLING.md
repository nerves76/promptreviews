# 🚨 Communication Reminder Cron Job - Error Handling

## Overview
Your communication reminder cron job now has comprehensive error handling and monitoring to ensure you're always informed if something goes wrong.

## 🔔 Error Notifications

### 1. **Email Notifications**
When the cron job encounters errors, you'll receive detailed email notifications at the configured admin email address.

**Configure Admin Email:**
Add to your environment variables:
```bash
ADMIN_ERROR_EMAIL=your-email@example.com
```
(Defaults to `team@promptreviews.app` if not set)

### 2. **Sentry Error Tracking**
All errors are automatically captured in Sentry with:
- Full stack traces
- Context about which reminder failed
- Contact and business information
- Processing statistics

### 3. **Console Logging**
Detailed logs are written to Vercel's logging system:
- ✅ Success messages for sent reminders
- ⏭️ Skip messages for contacts without email
- ❌ Error messages with details
- 📊 Summary statistics

## 📧 Types of Notifications

### **Critical Failure**
When the entire cron job fails:
- **Subject:** "🚨 Communication Reminder Cron Job Failed"
- **Contains:** Error details, stack trace, environment info
- **Sent to:** Admin email
- **Sentry:** Critical error with full context

### **Partial Failures**
When some reminders fail but others succeed:
- **Subject:** "🚨 Communication Reminder Cron Job Failed"
- **Contains:** List of failed reminders, success count, failure count
- **Sent to:** Admin email
- **Sentry:** Warning with failed reminder details

### **Database Connection Errors**
When unable to fetch reminders:
- **Subject:** "🚨 Communication Reminder Cron Job Failed"
- **Contains:** Database error details
- **Sent to:** Admin email
- **Sentry:** Error with query details

## 📊 Monitoring Dashboard

### **Vercel Functions Log**
View real-time logs at:
```
https://vercel.com/[your-team]/promptreviews/functions
```

### **Sentry Dashboard**
Monitor errors at:
```
https://sentry.io/organizations/[your-org]/issues/
```

Filter by:
- Tag: `cronJob: communication_reminders`
- Level: Error, Warning, Info

### **Email History**
Check Resend dashboard for sent notifications:
```
https://resend.com/emails
```

## 🔍 What's Tracked

### **Success Metrics**
- Total reminders processed
- Successful sends count
- Processing time

### **Error Details**
- Reminder ID that failed
- Contact email
- Business name
- Error message
- Stack trace
- Timestamp

### **Context Information**
- Environment (production/staging)
- Cron job start time
- Total reminders found
- Batch size

## 🛠️ Troubleshooting

### **Common Issues**

1. **"CRON_SECRET_TOKEN not configured"**
   - Add `CRON_SECRET_TOKEN` to environment variables
   - Generate a secure token for Vercel cron authentication

2. **"Failed to fetch reminders"**
   - Check database connection
   - Verify service role key is set
   - Check RLS policies

3. **"Failed to send email"**
   - Verify Resend API key
   - Check email template exists
   - Verify contact has valid email

4. **"No admin notification received"**
   - Set `ADMIN_ERROR_EMAIL` environment variable
   - Check Resend API key is valid
   - Check spam folder

## 🚀 Testing

### **Manual Test**
Run the cron job manually:
```bash
curl -X GET https://your-app.vercel.app/api/cron/send-communication-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

### **Local Testing**
```bash
# Set environment variables
export CRON_SECRET_TOKEN="test-token"
export ADMIN_ERROR_EMAIL="your-email@example.com"

# Run locally
npm run dev

# Test endpoint
curl -X GET http://localhost:3000/api/cron/send-communication-reminders \
  -H "Authorization: Bearer test-token"
```

## 📝 Configuration Checklist

- [ ] `CRON_SECRET_TOKEN` - Set in Vercel environment variables
- [ ] `ADMIN_ERROR_EMAIL` - Set to receive error notifications
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Database connection
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Admin database access
- [ ] `RESEND_API_KEY` - Email sending service
- [ ] Sentry DSN - Error tracking (if not disabled)

## 🎯 Summary

Your cron job now has enterprise-grade error handling:
- **Immediate Notifications**: Email alerts for any failures
- **Detailed Tracking**: Sentry captures all error context
- **Partial Failure Handling**: Continues processing even if some fail
- **Admin Visibility**: Complete audit trail of all operations
- **Monitoring Integration**: Works with your existing monitoring tools

You'll never miss a cron job failure again!