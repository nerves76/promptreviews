# Communication Tracking System

A comprehensive system for tracking email and SMS communications with contacts, including follow-up reminders and status management.

## 📁 File Structure

```
src/app/components/communication/
├── CommunicationTrackingModal.tsx    # Main modal for composing messages
├── CommunicationButtons.tsx          # Email/SMS buttons for prompt pages
├── CommunicationHistory.tsx          # Display communication history
└── README.md                         # This file

src/utils/
├── communication.ts                  # Service utilities

src/app/api/communication/
├── records/route.ts                  # API for communication records

src/app/api/prompt-pages/[id]/
├── status/route.ts                   # API for status updates

supabase/migrations/
├── 20250810000001_create_communication_tracking_simple.sql
```

## 🚀 Quick Start

### 1. Apply Database Migration

The migration has been applied to create the necessary tables:
- `communication_records` - Tracks all email/SMS communications
- `follow_up_reminders` - Manages follow-up scheduling
- `communication_templates` - Stores message templates

### 2. Add Communication Buttons to Prompt Pages

```tsx
import CommunicationButtons from '@/app/components/communication/CommunicationButtons';

// In your prompt page component
<CommunicationButtons
  contact={contact}
  promptPage={promptPage}
  onCommunicationSent={() => {
    // Refresh data or show success message
    console.log('Communication sent!');
  }}
  onStatusUpdated={(newStatus) => {
    // Update local state
    setPromptPage(prev => ({ ...prev, status: newStatus }));
  }}
/>
```

### 3. Add Communication History to Contact Profiles

```tsx
import CommunicationHistory from '@/app/components/communication/CommunicationHistory';

// In your contact profile page
<CommunicationHistory
  contactId={contact.id}
  className="mt-6"
/>
```

## 🎯 Key Features

### Smart Display Logic
- Email button only shows if contact has an email address
- SMS button only shows if contact has a phone number
- No buttons show if contact has neither

### Status Management
- Prompts user to update prompt page status when sending communications
- Supports: `draft` → `in_queue` → `in_progress` → `complete`

### Default Message Generation
- Automatically generates contextual messages based on:
  - Business name
  - Customer name  
  - Review URL
  - Communication type (email vs SMS)

### Follow-up Reminders
- Set reminders from 1 week to 6 months
- Tracks reminder status: `pending`, `sent`, `completed`, `cancelled`
- Displays in communication history

### Template System
- Support for variable substitution:
  - `{{business_name}}` - Business name
  - `{{customer_name}}` - Customer full name
  - `{{review_url}}` - Prompt page URL

## 📡 API Endpoints

### Communication Records
```typescript
// Create communication record
POST /api/communication/records
{
  "contactId": "uuid",
  "promptPageId": "uuid",
  "communicationType": "email" | "sms",
  "subject": "string", // optional, for emails
  "message": "string",
  "followUpReminder": "1_week" | "2_weeks" | ... // optional
}

// Get communication history
GET /api/communication/records?contactId=uuid
```

### Prompt Page Status
```typescript
// Update prompt page status
PATCH /api/prompt-pages/{id}/status
{
  "status": "draft" | "in_queue" | "in_progress" | "complete"
}
```

## 🔧 Component Props

### CommunicationButtons
```typescript
interface CommunicationButtonsProps {
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  promptPage: {
    id: string;
    slug: string;
    status: string;
    client_name?: string;
    location?: string;
  };
  onCommunicationSent?: () => void;
  onStatusUpdated?: (newStatus: string) => void;
  className?: string;
}
```

### CommunicationHistory
```typescript
interface CommunicationHistoryProps {
  contactId: string;
  className?: string;
}
```

## 🎨 User Experience

### Modal Flow
1. User clicks Email/SMS button
2. Modal opens with:
   - Status update radio buttons
   - Pre-filled subject (emails) and message
   - Follow-up reminder dropdown
3. User can edit message and select options
4. Two action buttons:
   - "Open Email/SMS App" - Opens native app with pre-filled content
   - "Record as Sent" - Saves communication record and updates status

### History Display
- Shows all communications for a contact
- Expandable messages and reminders
- Color-coded status indicators
- Chronological order (newest first)

## 🛡️ Security

- Row Level Security (RLS) policies enforce data isolation
- Users can only access their own account's communication records
- All API endpoints require authentication
- Foreign key constraints ensure data integrity

## 🚀 Future Enhancements

- Automated follow-up email sending
- Message template management UI
- Bulk communication tools
- Analytics and reporting
- Integration with email/SMS services

## 🐛 Troubleshooting

### "Internal Server Error"
- Check that database migration has been applied
- Verify import paths in API routes
- Ensure Supabase connection is working

### "No email/phone found"
- Contact must have email for email button
- Contact must have phone for SMS button
- Check contact data in database

### "Authentication required"
- User must be logged in to use API endpoints
- Check session state in browser dev tools

## 📊 Database Schema

### communication_records
```sql
id uuid PRIMARY KEY
account_id uuid REFERENCES accounts(id)
contact_id uuid REFERENCES contacts(id)
prompt_page_id uuid REFERENCES prompt_pages(id)
communication_type text CHECK (email|sms)
status text CHECK (draft|sent|failed)
subject text
message_content text NOT NULL
sent_at timestamp
created_at timestamp
updated_at timestamp
```

### follow_up_reminders
```sql
id uuid PRIMARY KEY
communication_record_id uuid REFERENCES communication_records(id)
account_id uuid REFERENCES accounts(id)
contact_id uuid REFERENCES contacts(id)
reminder_type text CHECK (1_week|2_weeks|3_weeks|1_month|2_months|3_months|4_months|5_months|6_months)
reminder_date timestamp NOT NULL
status text CHECK (pending|sent|completed|cancelled)
custom_message text
created_at timestamp
updated_at timestamp
```