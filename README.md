# PromptReviews Widget System

A modern, customizable review widget system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🤖 AI-powered review request generation
- 📱 Responsive widget system for embedding on websites
- 🎨 Customizable design and branding
- 📊 Analytics and performance tracking
- 🔐 Secure authentication with Supabase
- 💳 Stripe payment integration
- 📧 Email automation with Resend
- 🐛 **Error tracking with Sentry**
- 📈 **Google Analytics 4 integration**
- ⏰ **Automatic trial reminder system**
- ✅ **Persistent onboarding tasks system**
- 🚀 **Improved development experience**
- 🏢 **Google Business Profile location management**
- 📝 **Configurable logging system**

## Google Business Profile Location Selection

The application includes a powerful location selection system for agencies and businesses managing multiple Google Business Profile locations.

### Features
- **Plan-Based Limits**: Different subscription tiers have different location limits
  - Builder Plan: 5 locations
  - Maven Plan: 10 locations
  - Admin Override: Database configurable limits via `max_gbp_locations` column
- **Auto-Selection**: Single location businesses skip the selection modal
- **Search & Filter**: Search locations by name or address
- **Persistent Selection**: Selected locations are saved to the database
- **Agency Support**: Perfect for agencies managing multiple client GBP accounts

### How It Works
1. **First Time Setup**: When accessing GBP features, users select which locations to track
2. **Plan Enforcement**: System enforces plan-based limits with clear messaging
3. **Auto-Skip**: Users with single locations bypass selection entirely
4. **Database Storage**: Selections persist across sessions in `selected_gbp_locations` table

### Database Configuration
Administrators can override default limits per account:
```sql
-- Set custom limit for specific account
UPDATE accounts 
SET max_gbp_locations = 20 
WHERE id = 'account_id_here';
```

## Configurable Logging System

The application includes a sophisticated logging utility that allows real-time control of console output verbosity, perfect for debugging without cluttering the console.

### Features
- **Multiple Log Levels**: `silent`, `error`, `warn`, `info`, `debug`
- **Browser Console Control**: Change log levels without restarting the app
- **Persistent Settings**: Log level persists in localStorage
- **Context-Specific Loggers**: Special loggers for auth, business, account, and navigation contexts
- **Visual Indicators**: Each log type has its own emoji for easy scanning

### Usage

#### Setting Log Level in Browser Console
```javascript
// Reduce console noise to only errors
setLogLevel('error')

// Enable verbose debugging
setLogLevel('debug')

// Completely silence all logs
setLogLevel('silent')

// Check current log level
getLogLevel()
```

#### Setting via Environment Variable
```bash
# In .env.local
NEXT_PUBLIC_LOG_LEVEL=info
```

#### Using in Code
```typescript
import logger from '@/utils/logger';

// Standard logging
logger.error('Critical error occurred', error);
logger.warn('This might be a problem');
logger.info('User completed action');
logger.debug('Detailed debug info', data);

// Context-specific logging
logger.auth('User authenticated', userId);
logger.business('Business profile updated', businessId);
logger.account('Account settings changed', accountId);
logger.nav('Navigation to dashboard');
```

### Log Levels Explained
- **silent**: No output at all
- **error**: Only critical errors (❌)
- **warn**: Errors and warnings (⚠️)
- **info**: Errors, warnings, and informational messages (ℹ️) - Default
- **debug**: Everything including detailed debug logs (🔍)

### Default Behavior
- **Production**: Defaults to `error` level
- **Development**: Defaults to `info` level
- **Override**: Can be changed anytime via browser console

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.local.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3002](http://localhost:3002)

### 🚀 Quick Development Login

For rapid development without authentication setup:
```javascript
// In browser console:
localStorage.setItem("dev_auth_bypass", "true");
window.location.reload();
```
[Full documentation](#development-authentication-bypass-system)

## Recent Development Improvements (January 2025)

### Development Server Stability
- **Port Conflict Resolution**: Automatic detection and resolution of port 3002 conflicts
- **Sentry Integration**: Properly disabled for local development to reduce noise
- **Error Handling**: Enhanced error handling for development server startup
- **Process Management**: Improved process cleanup and restart capabilities

### Sign-Up Flow Enhancements
- **Auto-Signin for Local Development**: Users are automatically signed in after account creation on localhost
- **Email Confirmation Bypass**: Local development bypasses email confirmation for faster testing
- **Improved UX**: FiveStarSpinner positioned closer to navigation instead of vertically centered
- **Session Management**: Better session establishment and persistence

### API Fixes
- **Track-Event API**: Fixed cookie options and service client configuration for anonymous events
- **Prompt-Pages API**: Fixed async params handling for Next.js 15 compatibility
- **Service Client**: Proper configuration with cookie options for server-side operations
- **Error Logging**: Enhanced logging for debugging API issues

### Database & Schema
- **Migration Enforcement**: Automatic migration checking and application on startup
- **Test Data Management**: Comprehensive cleanup scripts for development environment

### Navigation & User Experience (January 2025)
- **Navigation Restructure**: Updated main navigation order for better user flow
  - Moved "Reviews" (renamed from "Your reviews") to appear after "Your business"
  - New order: Dashboard → Prompt pages → Your business → Reviews → Widgets
- **Google Business Profile (GBP) Integration**: Added conditional "GBP" navigation
  - Only visible for Builder and Maven plan users
  - Direct access to Google Business Management features
  - Links to comprehensive photo management and social posting tools
- **Plan-Based Feature Access**: Implemented plan-aware navigation visibility
  - Uses AuthContext to check current user plan
  - Conditional rendering based on subscription tier
- **Schema Consistency**: All 73 migrations applied and up to date

## Latest Improvements (January 2025)

### Step 2 Emoji Gating Implementation (January 2025)
- **Google-Compliant Review Process**: Implemented two-step choice system for negative sentiment reviews
- **Enhanced User Experience**: Users selecting negative emotions (neutral, unsatisfied, frustrated) now get a choice modal
- **Dual-Path System**: 
  - **Private Feedback**: Direct feedback to business owners without public posting
  - **Public Review**: Traditional review process for users who choose to publish publicly
- **Compliance Features**: Adheres to Google's review submission guidelines by offering private feedback option
- **Seamless Integration**: Choice modal integrates naturally with existing emoji sentiment flow
- **Business Branding**: Modal includes business name and consistent branding

### UI/UX Improvements & Technical Fixes (January 2025)
- **Enhanced Tooltips**: Added detailed, actionable tooltips for business profile forms with specific examples
- **Business Location Management**: Fixed location creation limits and slug generation conflicts
- **Modal Standardization**: Updated all modal close buttons to use red X with Prompty branding
- **Platform Form Improvements**: Fixed layout alignment issues when "Other" platform is selected
- **Success Notifications**: Added proper success messages for location prompt page saves/publishes
- **Database Schema Fixes**: Resolved PostgREST schema cache issues and missing column problems
- **Stripe Webhook Fix**: Resolved webhook issue that was overwriting location limits during subscription updates
- **Admin System Enhancement**: Fixed admin user creation and verification system

*Last Updated: January 6, 2025 - Added Step 2 emoji gating implementation and comprehensive UI/UX improvements*

### Plan Page & Billing Enhancements
- **Pricing Display Fix**: Resolved pricing display issue showing "month/month" instead of correct pricing
- **Stripe Branding**: Updated Stripe branding with clean, professional text approach
- **Team Member Permissions**: Implemented role-based billing access controls
  - Account owners can modify plans and billing
  - Team members can view plans but cannot make changes
  - Clear messaging for permission restrictions
- **Payment Management**: Added "Update Payment Information" button with Stripe portal integration

### Account Management System
- **Account Cancellation**: Comprehensive account cancellation system with:
  - 90-day soft deletion period with automatic cleanup
  - Proper plan reset for returning users during retention period
  - Admin interface for account management and cleanup
  - Database migration for account soft deletion support
- **Admin Account Management**: Enhanced admin tools for account lifecycle management

### User Experience Improvements
- **UI Consistency**: Standardized close buttons across all modals (red X in white circles)
- **Brand Color Compliance**: Updated all buttons to use slate blue brand color (#2E4A7D)
- **Sign-up Flow**: Cleaned up confirmation messaging for better user experience
- **Loading States**: Improved loading indicators and user feedback

### Security & Data Management
- **Soft Deletion**: Implemented secure account soft deletion with 90-day retention
- **Permission Controls**: Multi-layered permission checks for billing operations
- **Database Integrity**: Enhanced data consistency and cleanup procedures

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Logging Configuration
# Options: silent, error, warn, info, debug
# Default: info (development), error (production)
NEXT_PUBLIC_LOG_LEVEL=info

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Google OAuth Configuration (for Google Business Profile integration)
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback

# Cron Job Configuration
CRON_SECRET_TOKEN=your_cron_secret_token_here

# Sentry Configuration (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_RELEASE=promptreviews@0.1.0
SENTRY_ORG=your_sentry_org_here
SENTRY_PROJECT=your_sentry_project_here

# Google Analytics Configuration
NEXT_PUBLIC_GA_TRACKING_ID=G-22JHGCL1T7

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Development Configuration
DISABLE_SENTRY=true  # Optional: Disable Sentry for local development
```

## Local Development

### Database Setup

**Important**: This application uses the **production Supabase database** for all environments (local and production). We do not use a local database instance.

### Email Confirmation Bypass

For local development convenience, we've implemented an email confirmation bypass:

- **Local Development** (`localhost:3002`): Users can sign in immediately after account creation
- **Production** (`app.promptreviews.app`): Normal email confirmation flow

The bypass is automatically detected based on the hostname and provides a user-friendly message explaining the behavior.

### Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Local: http://localhost:3002
   - Network: http://192.168.x.x:3002

### Testing User Accounts

For local development testing:
1. Create a new account using the sign-up form
2. Sign in immediately (no email confirmation required)
3. Test all features with the created account

### Development Authentication Bypass System

For rapid development and debugging, we've implemented a comprehensive authentication bypass system that allows you to skip the normal authentication flow while maintaining full access to all features.

#### Enabling the Bypass

To enable the development authentication bypass:

1. **Open your browser's developer console**
2. **Run the enable script:**
   ```javascript
   localStorage.setItem("dev_auth_bypass", "true");
   window.location.reload();
   ```

3. **Or use the convenience script:**
   ```bash
   node enable-dev-login.js
   ```

#### What the Bypass Does

When enabled, the system:
- **Bypasses all authentication checks** in development mode
- **Uses a pre-existing test account** (`test@example.com` / ID: `12345678-1234-5678-9abc-123456789012`)
- **Provides full dashboard access** without requiring sign-in
- **Enables business creation and management** using the test account
- **Allows prompt page access** without business profile validation errors

#### Architecture Overview

The bypass system works by intercepting authentication calls at multiple levels:

##### Frontend Authentication Bypass
- **AuthContext** (`src/contexts/AuthContext.tsx`): Mock user session creation
- **DashboardLayout** (`src/app/dashboard/layout.tsx`): Skip sign-in redirects
- **AuthGuard** (`src/utils/authGuard.ts`): Mock authentication state
- **Account Selection** (`src/utils/accountSelectionHooks.ts`): Mock account data

##### Database Access Bypass
Due to Row Level Security (RLS) policies requiring `auth.uid()`, the frontend client cannot access certain tables in development mode. The bypass system routes these operations through API endpoints that use the service role client:

- **Business Operations**: `/api/businesses` (GET/POST) - Bypasses RLS for business CRUD
- **Onboarding Tasks**: `/api/onboarding-tasks` (GET/POST) - Bypasses RLS for task management

##### Files Modified for Bypass Support

**Core Authentication:**
- `src/contexts/AuthContext.tsx` - Mock user session
- `src/app/dashboard/layout.tsx` - Skip auth redirects
- `src/utils/authGuard.ts` - Mock auth state
- `src/utils/accountSelectionHooks.ts` - Mock account selection
- `src/utils/supabaseClient.ts` - `getUserOrMock()` helper
- `src/utils/accountUtils.ts` - Mock account lookups

**API Endpoints (Service Role):**
- `src/app/api/businesses/route.ts` - Business CRUD with RLS bypass
- `src/app/api/onboarding-tasks/route.ts` - Task management with RLS bypass

**Frontend Components:**
- `src/app/prompt-pages/page.tsx` - API-based business fetching
- `src/app/dashboard/business-profile/page.tsx` - API-based business fetching
- `src/app/dashboard/create-business/CreateBusinessClient.tsx` - Use mock user
- `src/utils/onboardingTasks.ts` - API-based task operations

#### Development Account Details

The bypass uses an existing account in the database:
- **User ID**: `12345678-1234-5678-9abc-123456789012`
- **Email**: `test@example.com`
- **Account ID**: `12345678-1234-5678-9abc-123456789012` (same as user ID)
- **Name**: Dev User
- **Business**: Can create/manage businesses under this account

#### Disabling the Bypass

To return to normal authentication:
```javascript
localStorage.removeItem("dev_auth_bypass");
window.location.reload();
```

#### Security Notes

- **Development Only**: The bypass only works when `NODE_ENV === 'development'`
- **Local Storage Gated**: Requires explicit localStorage flag to activate
- **No Production Impact**: All bypass code is development-mode conditional
- **Service Role Separation**: API bypasses use separate service role client, not user client

This system allows for rapid development and testing without the overhead of managing authentication flows, while maintaining the security and integrity of the production authentication system.

### Development Server Troubleshooting

If you encounter issues starting the development server:

1. **Port 3002 Already in Use**:
   ```bash
   # Kill existing processes on port 3002
   lsof -ti:3002 | xargs kill -9
   
   # Or restart the server
   npm run dev
   ```

2. **Sentry Integration Errors**:
   ```bash
   # Disable Sentry for local development
   DISABLE_SENTRY=true npm run dev
   ```

3. **Database Migration Issues**:
   ```bash
   # Check migration status
   npm run check-migrations
   
   # Apply missing migrations
   supabase db push
   ```

4. **Test Data Cleanup**:
   ```bash
   # Clear test data from database
   node clear-database.js
   ```

### Development Best Practices

- **Use `DISABLE_SENTRY=true`** for local development to reduce noise
- **Check migrations** before starting development server
- **Clear test data** regularly to maintain clean development environment
- **Monitor console logs** for API errors and debugging information
- **Test sign-up flow** in incognito mode to ensure proper session handling

For detailed local development information, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).

## Automatic Trial Reminder System

This project includes an automated trial reminder system that sends emails to users whose trial expires in 3 days.

### Features
- ✅ **Automatic daily scheduling** via Vercel cron jobs
- ✅ **Duplicate prevention** - max 1 reminder per day per user
- ✅ **Comprehensive logging** of all reminder attempts
- ✅ **Manual override** capability for testing
- ✅ **Admin dashboard** for monitoring and management
- ✅ **Error tracking** and reporting

### Setup

1. **Database Setup**: Run the SQL script in `create_trial_reminder_logs.sql` in your Supabase SQL editor
2. **Environment Variables**: Add `CRON_SECRET_TOKEN` to your environment variables
3. **Vercel Deployment**: The cron job is automatically configured in `vercel.json`

### How It Works

- **Schedule**: Runs daily at 9 AM UTC via Vercel cron
- **Target Users**: Users on 'grower' plan with trial ending in 3 days
- **Email Template**: Uses the 'trial_reminder' email template
- **Logging**: All attempts are logged in `trial_reminder_logs` table
- **Duplicate Prevention**: Checks for existing reminders sent today

### Admin Management

- **Manual Sending**: Use the "Send Trial Reminders" button in Email Templates section
- **Logs Viewing**: Visit `/admin/trial-reminders` to view all reminder activity
- **Statistics**: See total, successful, failed, and today's reminder counts
- **Error Tracking**: View detailed error messages for failed reminders

### API Endpoints

- `GET /api/cron/send-trial-reminders` - Automated cron endpoint (requires `CRON_SECRET_TOKEN`)
- `POST /api/send-trial-reminders` - Manual sending endpoint (requires admin access)

### Monitoring

The system provides comprehensive monitoring:
- Real-time statistics in admin dashboard
- Detailed logs with success/failure tracking
- Error message capture for debugging
- Daily activity summaries

## Sentry Integration

This project includes comprehensive error tracking with Sentry:

### Features
- ✅ Client-side error tracking
- ✅ Server-side error tracking  
- ✅ Performance monitoring
- ✅ Session replay (10% of sessions, 100% of errors)
- ✅ Release tracking
- ✅ Environment-based filtering
- ✅ Development mode suppression
- ✅ Common error filtering

### Setup
1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for your Next.js application
3. Copy the DSN from your project settings
4. Add the DSN to your `.env.local` file
5. Test the integration at `/test-sentry`

### Testing
Visit `/test-sentry` to test all Sentry features:
- Error capture
- Message logging
- Breadcrumb tracking
- User context
- API error reporting

## Google Analytics 4 Integration

This project includes comprehensive user behavior tracking with Google Analytics 4:

### Features
- ✅ User authentication events (sign up, sign in, sign out)
- ✅ Widget interactions (creation, viewing, review submissions)
- ✅ Business actions (profile creation, updates)
- ✅ Admin actions (announcements, quotes management)
- ✅ Navigation tracking (page views, button clicks)
- ✅ Error tracking integration with Sentry
- ✅ Custom event parameters and user context

### Tracked Events

#### User Events
- `sign_up` - User registration with method tracking
- `sign_in` - User login with authentication method
- `sign_out` - User logout events

#### Widget Events
- `widget_created` - Widget creation with type and business context
- `widget_viewed` - Widget view events with type tracking
- `widget_review_submitted` - Review submissions with rating and photo data
- `widget_photo_uploaded` - Photo upload events

#### Business Events
- `business_created` - Business profile creation with type
- `business_updated` - Business profile updates
- `contacts_uploaded` - Contact list uploads
- `review_request_sent` - Review request campaigns

#### Admin Events
- `announcement_created` - Site announcement creation
- `quote_created` - Customer quote creation
- `quote_updated` - Quote modification events
- `quote_deleted` - Quote deletion events

#### Navigation Events
- `page_view` - Page view tracking
- `button_click` - Button interaction tracking
- `link_click` - Link click tracking

#### Error Events
- `error_occurred` - Error tracking with context

### Usage

```typescript
import { 
  trackEvent, 
  trackSignUp, 
  trackWidgetCreated, 
  trackReviewSubmitted,
  trackAdminAction 
} from '../utils/analytics';

// Track custom events
trackEvent('custom_event', { 
  parameter1: 'value1',
  parameter2: 'value2' 
});

// Track user sign up
trackSignUp('email');

// Track widget creation
trackWidgetCreated('multi', 'business_id');

// Track review submission
trackReviewSubmitted('multi', 5, true); // 5-star rating with photo

// Track admin actions
trackAdminAction('announcement_created', {
  has_button: true,
  message_length: 150
});
```

### Setup
1. Create a Google Analytics 4 property at [analytics.google.com](https://analytics.google.com)
2. Copy your Measurement ID (format: G-XXXXXXXXXX)
3. Add the ID to your `.env.local` file as `NEXT_PUBLIC_GA_TRACKING_ID`
4. The tracking script is automatically loaded on all pages

### Privacy & Compliance
- Respects user privacy preferences
- No personally identifiable information (PII) is sent to GA4
- Compliant with GDPR and CCPA requirements
- User consent can be integrated if needed

## Widget System

The platform includes three types of embeddable widgets:

### Multi Widget
- Displays multiple reviews in a carousel
- Fully customizable design
- Responsive layout

### Single Widget
- Shows one review at a time
- Clean, focused design
- Easy integration

### Photo Widget
- Includes customer photos
- Enhanced visual appeal
- Social proof focused

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:widget` - Build all widgets
- `npm run watch:widget` - Watch and rebuild widgets

### Architecture
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Payments**: Stripe
- **Email**: Resend
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics 4

## Database Schema

See `databaseschema.md` for detailed database structure.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software.

## Recent Fixes (Latest Update)

### Added Google Analytics 4 Integration
- **Feature**: Comprehensive user behavior tracking
- **Implementation**: 
  - Added GA4 tracking script to root layout
  - Created analytics utility functions for event tracking
  - Integrated tracking across all major user interactions
  - Added admin action tracking for content management
  - Implemented error tracking integration with Sentry
- **Events Tracked**: User auth, widget interactions, business actions, admin actions, navigation, errors
- **Privacy**: No PII sent to GA4, GDPR/CCPA compliant

### Fixed Widget Rendering Issues
- **Issue**: Widget was not rendering due to dependency loading failures
- **Root Cause**: Swiper CDN loading issues and complex dependency management
- **Solution**: 
  - Created `widget-embed-working.js` with smart fallback system
  - Widget tries Swiper first, falls back to grid layout if it fails
  - All styles are inline - no external CSS dependencies
  - Always renders something useful, never fails completely

### Fixed Infinite Loop in Test Page
- **Issue**: Test page was showing infinite "Test page loaded" messages in debug console
- **Root Cause**: Conflict between automatic widget initialization and manual test data rendering
- **Solution**: 
  - Changed test page container ID from `promptreviews-widget` to `test-widget-container`
  - This prevents the widget script's automatic initialization from conflicting with manual test rendering
  - Test page now uses dedicated container that bypasses automatic API calls

### Fixed "Element type is invalid" Error
- **Issue**: Application was crashing with "Element type is invalid" error due to conflicting type definitions
- **Root Cause**: Multiple `WidgetData` and `DesignState` interfaces were defined in different files, causing import conflicts
- **Solution**: 
  - Fixed `MultiWidget.tsx` to import types from local `./index` file instead of `../../shared/types`
  - Fixed `SingleWidget.tsx` to use consistent type definitions
  - Simplified widget components to avoid complex type transformations
  - Restored `ConsoleLogger.tsx` component that was accidentally cleared

### Font System Optimization
- **Issue**: Layout was loading 30+ fonts but only using 6 in widget styling
- **Solution**: 
  - Restored all Google Fonts needed for prompt page styling (30+ fonts)
  - Maintained widget styling fonts (6 fonts: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins)
  - Kept system fonts separate (no import needed)

### Test Page Access
- **Issue**: Test pages were being accessed with incorrect URLs (`/public/widgets/...`)
- **Solution**: 
  - Correct URL format: `/widgets/multi/test-multiple.html` (without `/public` prefix)
  - Static files in `/public` directory are served from root URL

## Working Test Pages

### 1. Working Widget Test (Recommended)
**URL**: `http://localhost:3001/widgets/multi/working-test.html`
- **Features**: Full Swiper carousel with navigation arrows and pagination
- **Fallback**: Automatically falls back to grid layout if Swiper fails
- **Responsive**: 3 cards on desktop → 2 on tablet → 1 on mobile
- **Script**: Uses `widget-embed-working.js` (most reliable)

### 2. Ultra Simple Test
**URL**: `http://localhost:3001/widgets/multi/ultra-simple-test.html`
- **Features**: Simple grid layout, no external dependencies
- **Use Case**: Basic testing when you need guaranteed rendering
- **Script**: Self-contained, no external scripts

### 3. Original Test (Legacy)
**URL**: `http://localhost:3001/widgets/multi/test-embed.html`
- **Features**: Original widget script with Swiper
- **Status**: May have dependency issues, use working-test.html instead
- **Script**: Uses `widget-embed.js` (original version)

## Widget Scripts

### widget-embed-working.js (Recommended)
- **Smart fallback system**: Tries Swiper, falls back to grid
- **All inline styles**: No external CSS dependencies
- **Better error handling**: Detailed logging and timeout protection
- **Always renders**: Never fails completely

### widget-embed.js (Legacy)
- **Original implementation**: Complex dependency loading
- **External CSS**: Requires `multi-widget.css`
- **May fail**: Can get stuck in loading state

## Project Structure

```
src/
├── app/
│   └── dashboard/
│       └── widget/
│           ├── components/
│           │   ├── shared/
│           │   │   ├── StarRating.tsx      # Reusable star rating component
│           │   │   ├── styles.ts           # Shared styles and CSS injection
│           │   │   └── utils.ts            # Shared utility functions
│           │   ├── widgets/
│           │   │   ├── multi/              # Multi-review carousel widget
│           │   │   ├── photo/              # Photo-focused review widget
│           │   │   └── single/             # Single review widget
│           │   ├── ReviewForm.tsx          # Review creation/editing form
│           │   ├── ReviewList.tsx          # List of reviews with filtering
│           │   ├── ReviewModal.tsx         # Modal for review management
│           │   ├── StyleModal.tsx          # Widget styling configuration
│           │   ├── PhotoUpload.tsx         # Photo upload component
│           │   └── WidgetList.tsx          # Main widget management interface
│           └── page.tsx                    # Dashboard page
├── lib/
│   └── renderStars.tsx                     # Legacy star rating utility
└── widget-embed/                           # Client-side widget implementation
    └── index.tsx                           # Widget initialization and setup

public/
└── widgets/
    └── multi/
        ├── widget-embed-working.js         # Working widget script (recommended)
        ├── widget-embed.js                 # Original widget script (legacy)
        ├── working-test.html               # Working test page
        ├── ultra-simple-test.html          # Simple test page
        ├── test-embed.html                 # Original test page
        └── multi-widget.css                # CSS for legacy widget
```

## Core Components

### Widget Types

1. **MultiWidget** (`/widgets/multi/`)
   - Carousel-style display of multiple reviews
   - Supports navigation, pagination, and keyboard controls
   - Customizable design settings

2. **PhotoWidget** (`/widgets/photo/`)
   - Focused on photo reviews
   - Grid layout with photo thumbnails
   - Supports photo upload and management

3. **SingleWidget** (`/widgets/single/`)
   - Displays a single featured review
   - Compact design with star rating and text
   - Ideal for testimonials

### Shared Components

1. **StarRating** (`/shared/StarRating.tsx`)
   - Reusable 5-star rating component
   - Supports full and half stars
   - Customizable size and styling
   - Used across all widget types

2. **ReviewForm** (`/ReviewForm.tsx`)
   - Form for creating and editing reviews
   - Supports text, rating, and photo upload
   - Real-time validation

3. **StyleModal** (`/StyleModal.tsx`)
   - Widget customization interface
   - Color picker and design settings
   - Live preview

## Development Guidelines

### Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   PORT=3001 npm run dev
   ```

### Key Features

1. **Widget Customization**
   - Each widget type has its own design settings
   - Colors, fonts, and layout options
   - Live preview in the dashboard

2. **Review Management**
   - Create, edit, and delete reviews
   - Photo upload support
   - Star rating system

3. **Responsive Design**
   - Mobile-friendly layouts
   - Adaptive widget sizes
   - Touch-friendly controls

### Best Practices

1. **Component Organization**
   - Keep components focused and single-purpose
   - Use shared components for common functionality
   - Maintain consistent file structure

2. **Styling**
   - Use Tailwind CSS for all styling
   - Follow the project's color scheme
   - Maintain responsive design

3. **Type Safety**
   - Use TypeScript interfaces for all props
   - Maintain strict type checking
   - Document complex types

### Common Patterns

1. **Widget Implementation**
   ```typescript
   interface WidgetProps {
     reviews: Review[];
     design: DesignState;
     onDesignChange?: (design: DesignState) => void;
   }
   ```

2. **Design State**
   ```typescript
   interface DesignState {
     colors: {
       primary: string;
       secondary: string;
       text: string;
     };
     typography: {
       fontFamily: string;
       fontSize: string;
     };
     layout: {
       padding: string;
       borderRadius: string;
     };
   }
   ```

3. **Review Data**
   ```typescript
   interface Review {
     id: string;
     author: string;
     content: string;
     star_rating: number;
     photo_url?: string;
     created_at: string;
   }
   ```

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Notes for Future Development

1. **Widget-Embed Folder**
   - Contains client-side widget implementation
   - Not intended for dashboard functionality
   - Keep widget-specific code in dashboard components

2. **Star Rating System**
   - Use the shared `StarRating` component
   - Maintain consistent styling across widgets
   - Support half-star ratings

3. **Performance Considerations**
   - Optimize image loading
   - Implement lazy loading for widgets
   - Cache design settings

4. **Security**
   - Validate all user inputs
   - Sanitize review content
   - Secure photo uploads

## Troubleshooting

1. **Port Already in Use**
   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```

2. **Build Cache Issues**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Type Errors**
   - Check interface definitions
   - Verify prop types
   - Update TypeScript configurations

## Contributing

1. Follow the existing code structure
2. Maintain type safety
3. Use Tailwind for styling
4. Document new features
5. Update this README as needed

## [2024-06-08] Dashboard Widget Preview: Swiper Global Loading Fix

- The dashboard widget preview now waits for the Swiper script to be available globally (`window.Swiper`) before rendering the vanilla JS multi-widget.
- This ensures that design changes (such as color) made in the editor are reflected live in the widget preview.
- Previously, if Swiper was not available on the global scope, the widget would not update visually after design changes.
- This fix resolves the issue and improves reliability of the live preview.

Last updated: March 19, 2024 

## Recent Updates

### Widget Mobile & Tablet Navigation Fixes (Latest)

**Date:** January 2025

**Issues Fixed:**
- Mobile and tablet navigation buttons were not aligning correctly
- Desktop navigation buttons were being pushed out of view on smaller screens
- Navigation structure was duplicated causing layout conflicts
- Breakpoint logic wasn't properly aligned with CSS media queries

**Changes Made:**

1. **JavaScript Structure (`public/widgets/multi/widget-embed.js`):**
   - Restructured navigation element creation to prevent duplication
   - Separated desktop and mobile navigation with clear class names
   - Fixed Swiper configuration to properly target navigation elements
   - Removed debug code and cleaned up implementation
   - Added proper pagination targeting for different screen sizes

2. **CSS Layout (`public/widgets/multi/widget-embed.css`):**
   - Added proper container padding to accommodate desktop navigation buttons
   - Fixed mobile navigation row layout and positioning
   - Improved responsive behavior across all breakpoints
   - Updated media queries to properly hide/show navigation elements
   - Fixed button positioning to prevent overflow issues

3. **Responsive Behavior:**
   - **Mobile (≤900px):** Navigation buttons appear below carousel in a centered row
   - **Tablet (901px-1200px):** Desktop navigation with adjusted positioning
   - **Desktop (>1200px):** Full desktop navigation with side buttons

**Testing:**
- Created test file `public/widgets/multi/test.html` for easy testing
- Test covers mobile (375px), tablet (768px), desktop (1200px), and large desktop (1920px)
- Navigation buttons now properly align and remain visible on all screen sizes

## Features

### Core Functionality
- **Review Collection:** AI-powered review request generation
- **Widget System:** Customizable embeddable review widgets
- **Business Management:** Complete business profile and review management
- **Analytics:** Review performance tracking and insights

### Widget Types
- **Multi Widget:** Carousel-style review display with Swiper.js
- **Single Widget:** Individual review showcase
- **Photo Widget:** Review display with customer photos

### Technical Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Supabase (Database, Auth, Storage)
- **AI:** OpenAI GPT-4 for review generation
- **Payments:** Stripe integration
- **Email:** Resend for transactional emails

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd promptreviews

# Install dependencies
npm install

# Set up environment variables in your deployment platform
# See Environment Variables section below for required variables

# Run development server
npm run dev
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Resend
RESEND_API_KEY=your_resend_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### Widget Development
The widget system is built with vanilla JavaScript for maximum compatibility:

```bash
# Widget files location
public/widgets/multi/
├── widget-embed.js    # Main widget JavaScript
├── widget-embed.css   # Widget styles
├── test.html         # Test file for development
└── multi.html        # Example implementation
```

**Testing Widget Changes:**
1. Open `public/widgets/multi/test.html` in your browser
2. Use the responsive test buttons to check different screen sizes
3. Verify navigation buttons align correctly on mobile and tablet
4. Check that desktop navigation doesn't overflow

### Database Schema
See `databaseschema.md` for complete database structure.

### Key Files
- `src/app/dashboard/widget/page.tsx` - Widget management interface
- `public/widgets/multi/widget-embed.js` - Main widget JavaScript
- `public/widgets/multi/widget-embed.css` - Widget styles
- `src/app/api/widgets/[id]/route.ts` - Widget API endpoints

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Environment Variables
Ensure all environment variables are set in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly, especially widget responsiveness
5. Submit a pull request

## Support

For support or questions, please contact the development team.

**Note:** This project uses environment variables for configuration. Ensure all required environment variables are set in your deployment platform.

## Recent Performance Improvements (Latest Update)

### Widget Responsiveness Fixes
- **Fixed freezing issue** when adjusting widget width in the dashboard
- **Optimized resize handlers** with better debouncing (300ms) and requestAnimationFrame
- **Reduced excessive re-rendering** by implementing proper initialization checks
- **Added performance optimizations** including hardware acceleration and layout containment
- **Improved cleanup functions** to prevent memory leaks and event listener conflicts

### Submit Review Button Fixes
- **Fixed button being cut off** in dashboard preview by increasing container heights
- **Added proper padding and margins** to ensure button visibility
- **Improved overflow handling** to prevent content clipping
- **Enhanced responsive behavior** for different screen sizes

### Key Changes Made
1. **Enhanced resize handling** in `public/widgets/multi/widget-embed.js`:
   - Increased debounce timeout to 300ms
   - Added requestAnimationFrame for smoother updates
   - Reduced console logging in production
   - Better error handling and validation

2. **Optimized widget rendering** in `src/app/dashboard/widget/page.tsx`:
   - Added debounced design change effects (500ms)
   - Implemented proper cleanup and timeout management
   - Added hardware acceleration and layout containment
   - Prevented race conditions during initialization
   - Moved console.log to useEffect to prevent render-time state updates

3. **Created test pages**:
   - `public/widgets/multi/test-responsive.html` for isolated widget testing
   - `public/widgets/multi/test-submit-button.html` for submit button visibility testing

4. **Fixed submit review button visibility** in `public/widgets/multi/multi-widget.css`:
   - Increased container heights and padding
   - Added proper overflow handling
   - Enhanced button container spacing
   - Improved responsive behavior

### Testing Widget Responsiveness
You can test the widget responsiveness independently by visiting:
```
http://localhost:3001/widgets/multi/test-responsive.html
```

This page provides a slider to adjust widget width and test the responsive behavior without the complexity of the full dashboard. 

## Account Sign-Up Flow

- When a user signs up, they will receive a confirmation email.
- The user must click the confirmation link in their email to activate their account before signing in.
- This process improves security, prevents spam, and ensures account recovery. 

## 📚 Documentation

### Help System

The application includes a comprehensive help system that integrates with the documentation site to provide context-aware assistance.

#### Features

- **Help Bubble**: Floating help button in bottom-right corner with keyboard shortcut (?) 
- **Context-Aware Recommendations**: Suggests relevant articles based on current page
- **Behavioral Tracking**: Learns from user actions to improve recommendations
- **Search Integration**: Connects to docs site for real-time article search
- **Smart Fallbacks**: Graceful degradation when docs site is unavailable

#### Components

- `FeedbackBubble.tsx` - Main help button and modal trigger
- `HelpModal.tsx` - Tabbed help interface (Tutorials & Issues)
- `TutorialsTab.tsx` - Context-aware tutorial recommendations
- `contextMapper.ts` - Maps app routes to help content
- `articleAssociation.ts` - Article association and behavioral tracking

#### API Integration

- **Main App**: `/api/help-docs/tutorials` - Fetches articles from docs site
- **Docs Site**: `/api/search` - Provides article search functionality
- **Environment**: Set `DOCS_API_URL` to configure docs site connection

### Additional Internal Docs

- [`docs/KEYWORD_MONITORING.md`](docs/KEYWORD_MONITORING.md) – schema, APIs, and dashboard behavior for keyword tracking.

### Prompt Pages Documentation

The documentation site includes comprehensive guides for all prompt page types and features:

#### Structure

1. **Main Overview** (`/prompt-pages`)
   - Introduction to prompt pages
   - Quick navigation to types and features
   - Getting started guide

2. **Types** (`/prompt-pages/types`)
   - **Service Prompt Pages**: Perfect for restaurants, salons, professional services
   - **Product Prompt Pages**: Ideal for e-commerce and product-based businesses
   - **Photo Prompt Pages**: Collect reviews with customer photos
   - **Video Prompt Pages**: Maximum engagement with video testimonials
   - **Universal Prompt Pages**: One-page solution for any business

3. **Features** (`/prompt-pages/features`)
   - **Emoji Feedback Flow**: Interactive emotion-based review collection
   - **Prompty AI**: AI-powered review generation and optimization
   - **QR Code Generation**: Easy mobile access from anywhere
   - **Customization Options**: Brand your pages with colors and logos
   - **Analytics & Insights**: Track performance and engagement
   - **Multi-Platform Sharing**: Distribute across all channels
   - **Mobile Optimization**: Perfect experience on all devices
   - **Security & Privacy**: Enterprise-grade protection
   - **Platform Integration**: Connect with major review sites

#### Design System

The documentation uses a modern design system with:
- **Gradient Backgrounds**: Beautiful indigo-to-purple-to-fuchsia gradients
- **Glassmorphism**: Semi-transparent backgrounds with backdrop blur
- **Responsive Design**: Mobile-first approach
- **SEO Optimization**: Proper metadata and structured data
- **Typography**: Consistent font size hierarchy with Tailwind CSS

For complete typography scale, font weights, and design guidelines, see [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md#6-typography)

## [2024-06-08] Dashboard Widget Preview: Swiper Global Loading Fix

- The dashboard widget preview now waits for the Swiper script to be available globally (`window.Swiper`) before rendering the vanilla JS multi-widget.
- This ensures that design changes (such as color) made in the editor are reflected live in the widget preview.
- Previously, if Swiper was not available on the global scope, the widget would not update visually after design changes.
- This fix resolves the issue and improves reliability of the live preview.

Last updated: March 19, 2024 

## Recent Updates

### Widget Mobile & Tablet Navigation Fixes (Latest)

**Date:** January 2025

**Issues Fixed:**
- Mobile and tablet navigation buttons were not aligning correctly
- Desktop navigation buttons were being pushed out of view on smaller screens
- Navigation structure was duplicated causing layout conflicts
- Breakpoint logic wasn't properly aligned with CSS media queries

**Changes Made:**

1. **JavaScript Structure (`public/widgets/multi/widget-embed.js`):**
   - Restructured navigation element creation to prevent duplication
   - Separated desktop and mobile navigation with clear class names
   - Fixed Swiper configuration to properly target navigation elements
   - Removed debug code and cleaned up implementation
   - Added proper pagination targeting for different screen sizes

2. **CSS Layout (`public/widgets/multi/widget-embed.css`):**
   - Added proper container padding to accommodate desktop navigation buttons
   - Fixed mobile navigation row layout and positioning
   - Improved responsive behavior across all breakpoints
   - Updated media queries to properly hide/show navigation elements
   - Fixed button positioning to prevent overflow issues

3. **Responsive Behavior:**
   - **Mobile (≤900px):** Navigation buttons appear below carousel in a centered row
   - **Tablet (901px-1200px):** Desktop navigation with adjusted positioning
   - **Desktop (>1200px):** Full desktop navigation with side buttons

**Testing:**
- Created test file `public/widgets/multi/test.html` for easy testing
- Test covers mobile (375px), tablet (768px), desktop (1200px), and large desktop (1920px)
- Navigation buttons now properly align and remain visible on all screen sizes

## Features

### Core Functionality
- **Review Collection:** AI-powered review request generation
- **Widget System:** Customizable embeddable review widgets
- **Business Management:** Complete business profile and review management
- **Analytics:** Review performance tracking and insights

### Widget Types
- **Multi Widget:** Carousel-style review display with Swiper.js
- **Single Widget:** Individual review showcase
- **Photo Widget:** Review display with customer photos

### Technical Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Supabase (Database, Auth, Storage)
- **AI:** OpenAI GPT-4 for review generation
- **Payments:** Stripe integration
- **Email:** Resend for transactional emails

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd promptreviews

# Install dependencies
npm install

# Set up environment variables in your deployment platform
# See Environment Variables section below for required variables

# Run development server
npm run dev
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Resend
RESEND_API_KEY=your_resend_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### Widget Development
The widget system is built with vanilla JavaScript for maximum compatibility:

```bash
# Widget files location
public/widgets/multi/
├── widget-embed.js    # Main widget JavaScript
├── widget-embed.css   # Widget styles
├── test.html         # Test file for development
└── multi.html        # Example implementation
```

**Testing Widget Changes:**
1. Open `public/widgets/multi/test.html` in your browser
2. Use the responsive test buttons to check different screen sizes
3. Verify navigation buttons align correctly on mobile and tablet
4. Check that desktop navigation doesn't overflow

### Database Schema
See `databaseschema.md` for complete database structure.

### Key Files
- `src/app/dashboard/widget/page.tsx` - Widget management interface
- `public/widgets/multi/widget-embed.js` - Main widget JavaScript
- `public/widgets/multi/widget-embed.css` - Widget styles
- `src/app/api/widgets/[id]/route.ts` - Widget API endpoints

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Environment Variables
Ensure all environment variables are set in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly, especially widget responsiveness
5. Submit a pull request

## Support

For support or questions, please contact the development team.

**Note:** This project uses environment variables for configuration. Ensure all required environment variables are set in your deployment platform.

## Recent Performance Improvements (Latest Update)

### Widget Responsiveness Fixes
- **Fixed freezing issue** when adjusting widget width in the dashboard
- **Optimized resize handlers** with better debouncing (300ms) and requestAnimationFrame
- **Reduced excessive re-rendering** by implementing proper initialization checks
- **Added performance optimizations** including hardware acceleration and layout containment
- **Improved cleanup functions** to prevent memory leaks and event listener conflicts

### Submit Review Button Fixes
- **Fixed button being cut off** in dashboard preview by increasing container heights
- **Added proper padding and margins** to ensure button visibility
- **Improved overflow handling** to prevent content clipping
- **Enhanced responsive behavior** for different screen sizes

### Key Changes Made
1. **Enhanced resize handling** in `public/widgets/multi/widget-embed.js`:
   - Increased debounce timeout to 300ms
   - Added requestAnimationFrame for smoother updates
   - Reduced console logging in production
   - Better error handling and validation

2. **Optimized widget rendering** in `src/app/dashboard/widget/page.tsx`:
   - Added debounced design change effects (500ms)
   - Implemented proper cleanup and timeout management
   - Added hardware acceleration and layout containment
   - Prevented race conditions during initialization
   - Moved console.log to useEffect to prevent render-time state updates

3. **Created test pages**:
   - `public/widgets/multi/test-responsive.html` for isolated widget testing
   - `public/widgets/multi/test-submit-button.html` for submit button visibility testing

4. **Fixed submit review button visibility** in `public/widgets/multi/multi-widget.css`:
   - Increased container heights and padding
   - Added proper overflow handling
   - Enhanced button container spacing
   - Improved responsive behavior

### Testing Widget Responsiveness
You can test the widget responsiveness independently by visiting:
```
http://localhost:3001/widgets/multi/test-responsive.html
```

This page provides a slider to adjust widget width and test the responsive behavior without the complexity of the full dashboard. 

## Account Sign-Up Flow

- When a user signs up, they will receive a confirmation email.
- The user must click the confirmation link in their email to activate their account before signing in.
- This process improves security, prevents spam, and ensures account recovery. 

## 📚 Documentation

### Help System

The application includes a comprehensive help system that integrates with the documentation site to provide context-aware assistance.

#### Features

- **Help Bubble**: Floating help button in bottom-right corner with keyboard shortcut (?) 
- **Context-Aware Recommendations**: Suggests relevant articles based on current page
- **Behavioral Tracking**: Learns from user actions to improve recommendations
- **Search Integration**: Connects to docs site for real-time article search
- **Smart Fallbacks**: Graceful degradation when docs site is unavailable

#### Components

- `FeedbackBubble.tsx` - Main help button and modal trigger
- `HelpModal.tsx` - Tabbed help interface (Tutorials & Issues)
- `TutorialsTab.tsx` - Context-aware tutorial recommendations
- `contextMapper.ts` - Maps app routes to help content
- `articleAssociation.ts` - Article association and behavioral tracking

#### API Integration

- **Main App**: `/api/help-docs/tutorials` - Fetches articles from docs site
- **Docs Site**: `/api/search` - Provides article search functionality
- **Environment**: Set `DOCS_API_URL` to configure docs site connection

### Prompt Pages Documentation

The documentation site includes comprehensive guides for all prompt page types and features:

#### Structure

1. **Main Overview** (`/prompt-pages`)
   - Introduction to prompt pages
   - Quick navigation to types and features
   - Getting started guide

2. **Types** (`/prompt-pages/types`)
   - **Service Prompt Pages**: Perfect for restaurants, salons, professional services
   - **Product Prompt Pages**: Ideal for e-commerce and product-based businesses
   - **Photo Prompt Pages**: Collect reviews with customer photos
   - **Video Prompt Pages**: Maximum engagement with video testimonials
   - **Universal Prompt Pages**: One-page solution for any business

3. **Features** (`/prompt-pages/features`)
   - **Emoji Feedback Flow**: Interactive emotion-based review collection
   - **Prompty AI**: AI-powered review generation and optimization
   - **QR Code Generation**: Easy mobile access from anywhere
   - **Customization Options**: Brand your pages with colors and logos
   - **Analytics & Insights**: Track performance and engagement
   - **Multi-Platform Sharing**: Distribute across all channels
   - **Mobile Optimization**: Perfect experience on all devices
   - **Security & Privacy**: Enterprise-grade protection
   - **Platform Integration**: Connect with major review sites

#### Design System

The documentation uses a modern design system with:
- **Gradient Backgrounds**: Beautiful indigo-to-purple-to-fuchsia gradients
- **Glassmorphism**: Semi-transparent backgrounds with backdrop blur
- **Responsive Design**: Mobile-first approach
- **SEO Optimization**: Proper metadata and structured data
- **Typography**: Consistent font size hierarchy with Tailwind CSS

For complete typography scale, font weights, and design guidelines, see [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md#6-typography) 
