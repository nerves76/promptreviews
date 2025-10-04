# Google Biz Optimizer Email Automation System

## Overview

This document describes the complete email automation system implemented for the Google Biz Optimizer lead generation tool. The system automatically nurtures leads through a series of targeted emails designed to convert them into Prompt Reviews customers.

## Email Sequence

The automation includes 5 email types that are triggered based on user behavior and time intervals:

### 1. Welcome Email (`optimizer_welcome`)
- **Trigger**: Immediately after lead capture
- **Purpose**: Confirm report generation and provide download link
- **Template**: Professional design with clear CTA to download PDF report
- **Key Features**:
  - Personalized with business name
  - Clear value proposition
  - Pro tips for implementation

### 2. Follow-up Email (`optimizer_followup`)
- **Trigger**: 24 hours after signup if PDF not downloaded
- **Purpose**: Remind users to download their optimization report
- **Template**: Urgency-focused messaging highlighting report contents
- **Key Features**:
  - Lists what's inside the report
  - Creates urgency without being pushy
  - Clear download CTA

### 3. Nurture Tips Email (`optimizer_nurture_tips`)
- **Trigger**: 3 days after signup
- **Purpose**: Provide valuable optimization tips regardless of PDF download
- **Template**: Educational content with 5 quick wins
- **Key Features**:
  - Actionable 15-minute optimization tasks
  - Statistics and proof points
  - Soft promotion of PromptReviews

### 4. Case Study Email (`optimizer_nurture_case_study`)
- **Trigger**: 7 days after signup
- **Purpose**: Show real results from optimization efforts
- **Template**: Story-driven content featuring a customer success story
- **Key Features**:
  - Compelling before/after metrics
  - Credible customer testimonial
  - Visual formatting with statistics

### 5. Trial Offer Email (`optimizer_trial_offer`)
- **Trigger**: 14 days after signup (only if not converted to trial/customer)
- **Purpose**: Convert leads with limited-time free trial offer
- **Template**: Special offer presentation with value proposition
- **Key Features**:
  - Free month offer with promo code
  - Feature breakdown with benefits
  - Limited time urgency (48 hours)
  - Success story social proof

## Technical Implementation

### Database Schema

#### Email Templates Table
- All email templates stored in existing `email_templates` table
- Templates use `{{variable}}` syntax for personalization
- Both HTML and text versions included

#### Optimizer Leads Table (Extended)
```sql
-- New fields added to existing optimizer_leads table:
email_unsubscribed BOOLEAN DEFAULT FALSE
email_unsubscribed_at TIMESTAMPTZ NULL
```

#### Email Tracking Table
```sql
-- New table: optimizer_email_sends
id UUID PRIMARY KEY
lead_id UUID REFERENCES optimizer_leads(id)
email_type VARCHAR(50) -- welcome, followup, nurture_tips, etc.
sent_at TIMESTAMPTZ
success BOOLEAN
error_message TEXT
```

### Core Services

#### optimizerEmailService.ts
Main service file containing:
- `sendWelcomeEmail()` - Immediate welcome email
- `sendFollowupEmail()` - 24h follow-up for non-downloaders
- `sendNurtureTipsEmail()` - 3-day educational email
- `sendCaseStudyEmail()` - 7-day social proof email
- `sendTrialOfferEmail()` - 14-day conversion email
- `processBatchEmails()` - Bulk processing for cron jobs
- `updateLeadConversionStatus()` - Track conversions

#### Email Features
- **Duplicate Prevention**: Tracks sent emails to prevent duplicates
- **Unsubscribe Handling**: Respects unsubscribe status across all emails
- **Personalization**: Dynamic content based on lead data
- **Error Tracking**: Logs failed sends with error messages
- **Rate Limiting**: Built-in delays to prevent overwhelming email services

### API Endpoints

#### `/api/optimizer/send-welcome-email` (POST)
- Triggers welcome email for new leads
- Called automatically after lead capture
- Payload: `{ leadId: string }`

#### `/api/optimizer/update-conversion` (POST)
- Updates lead conversion tracking
- Called when PDF downloaded, trial started, or customer converted
- Payload: `{ leadId, pdf_downloaded?, trial_started?, etc. }`

#### `/api/cron/send-optimizer-emails` (POST)
- Scheduled email processing endpoint
- Handles all time-based email triggers
- Protected by CRON_SECRET_TOKEN
- Processes up to 100 leads per run with rate limiting

### Automation Triggers

#### Lead Capture Integration
Updated `/api/embed/session/create` to:
- Detect new lead creation
- Automatically trigger welcome email (async)
- Non-blocking - session creation continues even if email fails

#### PDF Download Tracking
Updated `/api/embed/optimizer/download-report` to:
- Mark PDF as downloaded in database
- Trigger conversion tracking API call
- Prevents follow-up emails for downloaders

#### Cron Job Scheduling
Added to `vercel.json`:
```json
{
  "path": "/api/cron/send-optimizer-emails",
  "schedule": "0 */2 * * *"  // Every 2 hours
}
```

### Unsubscribe System

#### Unsubscribe Page
- URL: `/unsubscribe/optimizer/[leadId]`
- Updates database with unsubscribe status
- Shows confirmation page
- Automatically excludes from future emails

#### Email Filtering
- All email functions check unsubscribe status
- Batch processing excludes unsubscribed leads
- Respects unsubscribe across entire sequence

## Email Content Strategy

### Design Principles
- **Professional branding** matching PromptReviews identity
- **Mobile-responsive** HTML templates
- **Clear value propositions** in every email
- **Soft CTAs** that don't feel pushy
- **Educational focus** with actionable tips
- **Social proof** through statistics and testimonials

### Personalization Variables
- `{{businessName}}` - Lead's business name or "there" fallback
- `{{email}}` - Lead's email address
- `{{reportUrl}}` - Personalized report download link
- `{{unsubscribeUrl}}` - Lead-specific unsubscribe link
- `{{signupUrl}}` - UTM-tagged signup links for tracking
- `{{trialUrl}}` - Special promo code signup link

### Performance Tracking
- Email sends tracked in `optimizer_email_sends` table
- Conversion events tracked in `optimizer_leads` table
- UTM parameters on all links for attribution
- Error logging for failed sends

## Monitoring and Maintenance

### Success Metrics
- Email delivery rates by type
- Open rates (if tracking pixels added later)
- Click-through rates on CTAs
- Conversion rates from lead to trial/customer
- Unsubscribe rates

### Error Handling
- Failed sends logged with error messages
- Email service automatically retries (handled by Resend)
- Non-blocking implementation prevents cascade failures
- Console logging for debugging

### Rate Limiting
- 100ms delay between individual emails
- 1-second delay between email type batches
- Maximum 100 emails per cron run
- Respects Resend API limits

## Security Considerations

### Access Control
- All database operations use service role
- Cron endpoints protected by secret token
- RLS policies prevent unauthorized access
- No sensitive data in email content

### Privacy Compliance
- Unsubscribe links in every email
- Clear opt-out mechanism
- No tracking pixels (respecting privacy)
- Minimal data collection

## Future Enhancements

### Potential Improvements
1. **A/B Testing**: Split test email subject lines and content
2. **Advanced Personalization**: Use lead segment and industry data
3. **Dynamic Content**: Personalize tips based on business type
4. **Email Analytics**: Add open/click tracking with user consent
5. **Behavioral Triggers**: More sophisticated timing based on user actions
6. **Integration**: Connect trial signups to email automation
7. **Template Management**: Admin interface for editing email templates

### Integration Points
- Connect to PromptReviews account system for trial tracking
- Link Google Business Profile API for personalized insights
- Integrate with Stripe webhooks for customer conversion tracking
- Add to customer journey mapping and analytics

## Deployment Checklist

### Prerequisites
- [x] Email templates added to database
- [x] Email tracking table created
- [x] Unsubscribe fields added to optimizer_leads
- [x] Cron job scheduled in vercel.json
- [x] Environment variables configured:
  - `RESEND_API_KEY`
  - `CRON_SECRET_TOKEN`
  - `NEXT_PUBLIC_APP_URL`

### Testing
- [ ] Test welcome email trigger on new lead capture
- [ ] Test PDF download conversion tracking
- [ ] Test scheduled email cron job manually
- [ ] Test unsubscribe functionality
- [ ] Verify all email templates render correctly
- [ ] Test rate limiting and error handling

This email automation system provides a complete lead nurturing solution that should significantly improve conversion rates from the Google Biz Optimizer tool while maintaining a professional, helpful tone that aligns with the PromptReviews brand.