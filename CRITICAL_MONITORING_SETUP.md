# Critical Function Monitoring Setup Guide

## Overview
This system monitors your most important business functionality - the "Generate with AI" and "Copy & Submit" buttons - and sends immediate alerts when they break.

## 🚨 What Gets Monitored

### Critical Functions
- **AI Generate Review** - Main review generation on prompt pages
- **AI Generate Photo Testimonial** - Photo testimonial generation
- **Copy & Submit** - Clipboard copy and submission tracking
- **Widget AI Generate** - AI generation in embedded widgets
- **Widget Submit** - Submission functionality in widgets

### Alert Triggers
- **Immediate**: Any error in critical functions
- **Pattern-based**: Error rate > 10% over 5 minutes
- **Health checks**: API endpoints down or database issues

## 📧 Alert Setup

### 1. Email Alerts

Add to your `.env.local`:
```bash
# Alert email address (where you want to receive notifications)
ALERT_EMAIL=your-email@domain.com
```

The system will send detailed error alerts including:
- Function that failed
- Error message and stack trace
- User context and page URL
- Timestamp and additional debugging info

### 2. Slack Alerts (Optional)

1. Create a Slack webhook URL:
   - Go to https://api.slack.com/apps
   - Create new app > Incoming Webhooks
   - Add webhook to workspace
   - Copy the webhook URL

2. Add to your `.env.local`:
```bash
# Slack webhook for critical alerts
SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Sentry Integration

Your existing Sentry setup will automatically capture critical errors with special tags:
- `critical_function: true`
- `business_critical: true` 
- `alert_level: high`

## 🗄️ Database Setup

Run the migration to create monitoring tables:

```bash
# Apply the critical monitoring migration
supabase migration up
```

This creates:
- `critical_function_errors` - Error tracking
- `critical_function_successes` - Success rate calculation
- `critical_function_health` - Health metrics view

## 📊 Monitoring Dashboard

Access your monitoring dashboard at:
```
https://your-domain.com/admin/critical-monitoring
```

The dashboard shows:
- **Real-time health status** of all critical functions
- **Error rates** and performance metrics
- **Recent errors** with full context
- **System health checks** for API endpoints

## 🔧 Configuration Options

### Alert Thresholds

Modify in `src/app/api/monitoring/critical-error/route.ts`:

```typescript
const ALERT_CONFIG = {
  // Functions that trigger immediate alerts
  IMMEDIATE_ALERT_FUNCTIONS: [
    'ai_generate_review',
    'ai_generate_photo_testimonial', 
    'copy_and_submit',
    // Add more if needed
  ],
  
  // Error rate threshold (10% = 0.1)
  ERROR_RATE_THRESHOLD: 0.1,
  
  // Time window for rate calculation (minutes)
  TIME_WINDOW_MINUTES: 5,
};
```

### Custom Alert Channels

To add more alert channels (SMS, Discord, etc.), modify the `sendCriticalError` function in the monitoring API.

## 🧪 Testing Your Setup

### 1. Test Email Alerts
```bash
# Send a test alert
curl -X POST https://your-domain.com/api/monitoring/critical-error \
  -H "Content-Type: application/json" \
  -d '{
    "functionName": "test_alert",
    "errorMessage": "Test alert - please ignore",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "additionalContext": {"test": true}
  }'
```

### 2. Check Health Endpoints
```bash
# Test AI generation health
curl https://your-domain.com/api/health/ai-generation

# Test review tracking health  
curl https://your-domain.com/api/health/review-tracking

# Check monitoring config
curl https://your-domain.com/api/monitoring/critical-error
```

### 3. Monitor Dashboard
Visit `/admin/critical-monitoring` to see:
- Green status = Everything working
- Yellow = Some issues detected
- Red = Critical problems requiring immediate attention

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Email service working
- [ ] Slack webhook tested (if using)
- [ ] Monitoring dashboard accessible
- [ ] Test alerts sent and received
- [ ] Health checks passing

## 📈 What You'll Get

### Immediate Notifications
- **Email alerts** within seconds of critical function failures
- **Slack notifications** to your team channel
- **Sentry error tracking** with full context

### Monitoring Dashboard
- **Real-time health status** of all critical functions
- **Error rate trends** over time
- **Performance metrics** (response times, success rates)
- **Recent error history** with debugging details

### Business Intelligence
- **Which functions fail most often**
- **Peak error times** (helps identify patterns)
- **User impact analysis** (anonymous user vs logged-in)
- **Platform-specific issues** (Google vs Yelp reviews)

## 🛠️ Maintenance

### Database Cleanup
Add to your cron jobs to clean old monitoring data:

```sql
-- Clean up old monitoring data (keep 30 days)
DELETE FROM critical_function_errors 
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM critical_function_successes 
WHERE timestamp < NOW() - INTERVAL '30 days';
```

### Health Check Automation
Set up external monitoring (like Pingdom or UptimeRobot) to check:
- `https://your-domain.com/api/health/ai-generation`
- `https://your-domain.com/api/health/review-tracking`

## 🆘 Troubleshooting

### No Alerts Received
1. Check email configuration in environment variables
2. Verify Slack webhook URL is correct
3. Check server logs for alert sending failures
4. Test with manual alert API call

### False Positives
1. Adjust `ERROR_RATE_THRESHOLD` if needed
2. Review `IMMEDIATE_ALERT_FUNCTIONS` list
3. Check if errors are actually user-facing

### Dashboard Not Loading
1. Verify database migration was applied
2. Check browser console for errors
3. Ensure admin access permissions

---

**Remember: This system protects your most critical business functionality. When you get an alert, investigate immediately!** 🚨 