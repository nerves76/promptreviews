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

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.local.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3001](http://localhost:3001)

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
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

# Cron Job Configuration
CRON_SECRET_TOKEN=your_cron_secret_token_here

# Sentry Configuration (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_RELEASE=promptreviews@0.1.0
SENTRY_ORG=your_sentry_org_here
SENTRY_PROJECT=your_sentry_project_here

# Google Analytics Configuration
NEXT_PUBLIC_GA_TRACKING_ID=G-22JHGCL1T7
```

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

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

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

---

**Note:** This project uses a toggle script for environment variables. Run `./toggle-supabase-keys.sh` to switch between development and production keys. 

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