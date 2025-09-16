# Admin Notification System

## Overview

The admin notification system automatically sends email notifications to configured admin users whenever someone new joins the app.

## Features

- ✅ **Automatic notifications**: Sends emails when new users complete signup
- ✅ **Template-based**: Uses customizable email templates
- ✅ **Fallback system**: Falls back to inline HTML if template is missing
- ✅ **Multiple admins**: Supports multiple admin email addresses
- ✅ **Error handling**: Graceful error handling that doesn't break signup flow
- ✅ **Admin dashboard link**: Includes direct link to admin dashboard

## Configuration

### Environment Variables

Add admin email addresses to your environment configuration:

```bash
# .env.local
ADMIN_EMAILS=admin1@example.com,admin2@example.com,chris@diviner.agency
```

**Multiple emails**: Separate multiple admin emails with commas
**Case insensitive**: Email addresses are normalized to lowercase
**Trimmed**: Whitespace is automatically removed

### Email Template

The system uses the `admin_new_user_notification` email template with these variables:

- `{{firstName}}` - New user's first name
- `{{lastName}}` - New user's last name  
- `{{userEmail}}` - New user's email address
- `{{joinDate}}` - Date and time when user joined
- `{{dashboardUrl}}` - Base URL for dashboard links

## How It Works

### Signup Flow Integration

1. **User completes signup** via `/auth/sign-up`
2. **Email confirmation** triggers auth callback
3. **Account creation** happens automatically via database triggers
4. **Welcome email** is sent to the new user
5. **Admin notification** is sent to all configured admin emails
6. **User is redirected** to create-business page

### Email Sending Process

1. **Check configuration**: Verifies admin emails are configured
2. **Template lookup**: Attempts to use the database template
3. **Fallback method**: Uses inline HTML if template is missing
4. **Multiple recipients**: Sends to each admin email individually
5. **Error handling**: Logs errors but doesn't break signup flow

## Email Content

### Subject Line
```
New user joined: [First Name] [Last Name]
```

### Email Body
- **Header**: "🎉 New User Signup"
- **User details**: Name, email, join date
- **Admin dashboard button**: Direct link to `/admin`
- **Professional footer**: Automated notification notice

## Customization

### Template Management

1. **Access admin dashboard**: Go to `/admin/email-templates`
2. **Find template**: Look for "admin_new_user_notification"
3. **Edit content**: Modify subject, HTML, or text content
4. **Test changes**: Create a test user to verify

### Template Variables

Available variables for customization:
```html
<p>Name: {{firstName}} {{lastName}}</p>
<p>Email: {{userEmail}}</p>
<p>Joined: {{joinDate}}</p>
<a href="{{dashboardUrl}}/admin">Admin Dashboard</a>
```

## Troubleshooting

### No Notifications Received

**Check configuration**:
```bash
# Verify admin emails are set
echo $ADMIN_EMAILS
```

**Check logs**:
- Look for "Admin notification sent" in auth callback logs
- Check for "No admin emails configured" messages

### Template Issues

**Missing template**:
- System automatically falls back to inline HTML
- Check admin dashboard for template existence

**Template errors**:
- Verify template variables are correct
- Check template is marked as active

### Email Delivery

**SMTP configuration**:
- Ensure `RESEND_API_KEY` is set
- Verify Resend account has proper sending permissions

**Spam filters**:
- Check admin email spam folders
- Ensure `noreply@updates.promptreviews.app` is whitelisted

## Testing

### Test New User Signup

1. **Create test account**: Use unique email address
2. **Complete signup flow**: Fill out form and confirm email
3. **Check admin emails**: Verify notification was received
4. **Review logs**: Check server logs for delivery confirmation

### Test Template Changes

1. **Modify template**: Update content in admin dashboard
2. **Create test user**: Trigger notification
3. **Verify changes**: Confirm customizations appear in email

## Security Considerations

- **Admin email validation**: Emails are validated and normalized
- **Environment security**: Keep `ADMIN_EMAILS` in secure environment files
- **Rate limiting**: No additional rate limiting needed (uses Resend limits)
- **Error isolation**: Email failures don't affect user signup process

## Future Enhancements

Potential improvements:
- **Webhook integration**: Add webhook notifications for external systems
- **Slack notifications**: Send notifications to Slack channels
- **User analytics**: Include user signup metrics in notifications
- **Template categories**: Group admin notification templates
- **Notification preferences**: Allow admins to configure notification types 