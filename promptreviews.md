# PromptReviews Project

This is a vanilla JavaScript project for creating and managing prompt pages that account holders can use to collect reviews. The project uses vanilla JavaScript, HTML, and CSS, with no framework dependencies.

Public url is https://app.promptpages.app

It's main function is to create landing pages "prompt pages" that account holders can use to collect reviews. There are different kinds of prompt pages with different purposes.

This project is currently focused on developing a standalone widget for collecting reviews. The widget is being developed as a vanilla JavaScript component first, before being integrated into the larger Next.js application.

## Recent Updates (Latest)

### Google Business Profile Service Category Mapping Fix (January 2025)
- **Critical API Fix**: Fixed Google Business Profile API failures by implementing intelligent service-to-category mapping for service items
- **Smart Category Mapping**: Created intelligent mapping system that matches service names to appropriate business categories using semantic analysis
- **Required Field Addition**: Added missing `categoryId` field to `freeFormServiceItem` structure as required by Google Business Profile API
- **Category Validation**: Implemented validation to ensure all service items have valid categories matching business's primary/additional categories
- **Semantic Matching**: Maps services like "SEO" → marketing categories, "Web Design" → design categories, "Consulting" → consultant categories
- **Fallback Logic**: Provides intelligent fallbacks when no specific category match is found, using business's primary category
- **API Reliability**: Eliminated "category not in list of categories for location" errors that were blocking business information updates

#### **Technical Implementation**
- **Category Extraction**: Extracts available categories from business's primary and additional categories in the same API request
- **Intelligent Mapping**: `mapServiceToCategory()` function uses keyword matching to map services to appropriate business categories
- **Multiple Fallbacks**: Prioritized fallback system from specific matches → general business categories → primary category
- **Validation Layer**: Filters out service items without valid categories before sending to Google Business Profile API
- **Comprehensive Coverage**: Handles SEO, marketing, design, consulting, branding, AI/automation, and general business services

#### **Files Modified**
- `src/app/api/business-information/update-location/route.ts` - Added category mapping logic and categoryId field to service items
- Ensures all service items include valid category IDs that match the business's Google Business Profile categories

### Google Business Profile Service Description Character Limit Fix (January 2025)
- **Critical API Fix**: Fixed Google Business Profile API failures by implementing strict 300-character limit enforcement for AI-generated service descriptions
- **AI Prompt Optimization**: Updated AI prompts to target character counts (80-150, 150-250, 250-300) instead of word counts for precise length control
- **Smart Truncation**: Enhanced content validation with intelligent sentence-boundary truncation to preserve meaning while staying under limits
- **Fallback Description Updates**: Rewrote all fallback service description templates to ensure they stay well under 300 characters
- **Token Optimization**: Reduced OpenAI max_tokens (50, 80, 100) to align with character targets and prevent over-length responses
- **Character Limit Enforcement**: Added explicit 300-character maximum instructions to all AI prompts with emphasis on concise, impactful content
- **API Reliability**: Eliminated "Provided `description` for service items may not exceed 300 characters" errors that were blocking Google Business Profile updates

#### **Technical Implementation**
- **Updated AI Prompts**: Modified `createServiceDescriptionPrompt()` to use character specifications instead of word counts
- **Enhanced Validation**: Improved `validateGeneratedContent()` with smart truncation at sentence boundaries
- **Optimized Fallbacks**: Shortened fallback description templates from 400+ to under 260 characters
- **Token Reduction**: Lowered OpenAI API token limits to prevent generation of overly long content
- **Graceful Handling**: Smart truncation preserves sentence structure and meaning while respecting character limits

#### **Files Modified**
- `src/utils/ai/google-business/serviceDescriptionGenerator.ts` - Updated prompts, fallbacks, and token limits
- `src/utils/ai/google-business/googleBusinessProfileHelpers.ts` - Enhanced validateGeneratedContent with smart truncation
- Ensures all AI-generated service descriptions comply with Google Business Profile 300-character limit

### Complete AI Integration for Google Business Profile (January 2025)
- **AI Review Response Generator**: Integrated directly into Reviews Management workflow - appears below review reply forms for seamless response generation
- **AI Service Description Generator**: Integrated into Business Info tab within business description section for contextual content creation
- **AI Search Engine Optimization Expert**: Advanced analyzer integrated into Business Info tab leveraging semantic embeddings and AI engine understanding for maximum visibility in ChatGPT, Claude, and other AI search platforms
- **Workflow Integration**: AI tools embedded within existing user workflows rather than separate tabs - enhances natural user flow
- **Complete End-to-End Integration**: From backend API endpoints to contextually-integrated user interface components
- **Brand Context Integration**: All AI tools use business profile data for personalized, brand-appropriate content generation
- **Professional UI/UX**: Modern card-based layouts with copy functionality, loading states, and error handling
- **Real-time Analytics**: AI usage tracking and analytics for business insights

#### **Technical Implementation**
- **Review Response Generator**: Analyzes review sentiment (positive, neutral, negative) and generates appropriate tone responses (friendly, professional, apologetic)
- **Service Description Generator**: Creates multiple description lengths with word counts and use-case recommendations
- **AI Search Engine Optimization Expert**: Semantic analysis for AI search engines with entity recognition, intent matching, conversational query optimization, and semantic keyword generation designed for modern AI-powered search platforms
- **Dashboard Integration**: Seamlessly integrated into existing Google Business Profile workflow with tab navigation
- **Error Handling**: Comprehensive error handling with user-friendly messages and fallback functionality

#### **AI Features Now Available**
1. **Generate Review Responses**: Input customer reviews and get professional, brand-appropriate responses
2. **Create Service Descriptions**: Generate SEO-optimized descriptions for any service in multiple lengths
3. **Analyze Business Descriptions**: Get SEO scores, keyword analysis, and optimization recommendations
4. **Improve Social Posts**: AI enhancement of Google Business Profile post content (previously implemented)
5. **Generate Review Content**: AI-powered review generation for prompt pages (previously implemented)

#### **Files Added**
- `src/app/components/ReviewResponseGenerator.tsx` - AI review response generation UI
- `src/app/components/ServiceDescriptionGenerator.tsx` - AI service description creation UI  
- `src/app/components/BusinessDescriptionAnalyzer.tsx` - AI business description analysis UI
- `src/app/dashboard/google-business/page.tsx` - Enhanced with new AI tabs and navigation

#### **Usage Workflow**
1. Navigate to `/dashboard/google-business`
2. Use "AI Content Tools" tab for service descriptions and business analysis
3. Use "AI Review Tools" tab for generating review responses
4. All tools integrate with existing business profile data for personalized results
5. Copy generated content directly to clipboard for immediate use

**Documentation Updated**: January 17, 2025 - Complete AI integration with full UI implementation

### Global Business Requirements (January 2025)
- **App-Wide Business Enforcement**: Implemented global business requirement enforcement throughout the entire application
- **BusinessGuard Component**: Created a comprehensive business guard component that applies to all authenticated routes
- **Protected Routes**: No authenticated user can access any part of the app without having created a business first
- **Exempt Routes**: Defined specific exempt routes including auth pages, public pages, and the create-business page itself
- **Streamlined Experience**: Removed redundant business checks from dashboard layout - now handled globally
- **Plan Change Compatibility**: Maintains proper handling of plan upgrade/downgrade success flows
- **Better UX**: Users are consistently redirected to business creation when required, improving onboarding flow
- **Centralized Logic**: All business requirement logic now centralized in the BusinessGuard component within Providers

#### **Technical Implementation**
- **Global Provider Integration**: Added BusinessGuard to Providers component for app-wide coverage
- **Route Exemption System**: Intelligent route checking that exempts auth flows and public pages
- **Loading State Management**: Proper loading state handling during business verification
- **Plan Success Bypass**: Special handling to allow plan change success messages to display properly
- **Simplified Dashboard**: Removed complex business checking logic from dashboard layout component

#### **Files Modified**
- `src/components/BusinessGuard.tsx` - New global business guard component
- `src/components/Providers.tsx` - Added BusinessGuard to provider chain
- `src/app/dashboard/layout.tsx` - Removed redundant business checking logic
- Business requirements now apply consistently across all authenticated routes

### Step 2 Emoji Gating Implementation (January 2025)
- **Enhanced Review Process**: Implemented Google-compliant review submission process with two-step choice system for negative sentiments
- **Negative Sentiment Handling**: Users who select "neutral", "unsatisfied", or "frustrated" emojis are presented with a choice modal
- **Two-Path System**: Negative sentiment users can choose between "Send feedback to Business" (private) or "Publish publicly online" (public review)
- **Private Feedback Path**: Direct feedback submission to business owners without public posting
- **Public Review Path**: Traditional review process continues for users who choose to publish publicly
- **Google Guidelines Compliance**: Adheres to Google's review submission guidelines by offering private feedback option
- **Modal State Management**: Added `showChoiceModal` and `selectedNegativeSentiment` state variables for smooth UX
- **Proper Sentiment Mapping**: Fixed sentiment labels to use correct values ("neutral", "unsatisfied", "frustrated")
- **Business Branding**: Choice modal includes business name and branding for consistent user experience
- **Seamless Integration**: Choice modal integrates naturally with existing emoji sentiment selection flow

#### **Technical Implementation**
- **Modal System**: Created new choice modal component with two clear action buttons
- **State Management**: Added state variables for managing negative sentiment flow
- **Sentiment Logic**: Modified `EmojiSentimentModal` to trigger choice modal for negative sentiments
- **Feedback Path**: Enhanced feedback submission to handle both private and public review flows
- **UI/UX**: Consistent modal styling with proper button hierarchy and clear action options

#### **Files Modified**
- `src/components/ReviewSubmissionForm.tsx` - Added choice modal state and logic
- `src/app/r/[slug]/page.tsx` - Updated to handle two-step negative sentiment flow
- Enhanced emoji sentiment handling for Google compliance

### UI/UX Improvements & Bug Fixes (January 2025)
- **Enhanced Tooltips**: Added detailed, actionable tooltips for business profile creation with specific examples
- **Business Description Tooltips**: Added coffee shop example with industry guidance for better user direction
- **Location Uniqueness Examples**: Added specific examples like "Back patio seating", "Local artist gallery", "Walk-up window"
- **AI Instructions Guidance**: Enhanced AI Do's and Don'ts with specific examples for better AI training
- **Textarea Improvements**: Increased textarea rows from 3 to 4 to accommodate longer content
- **Consistent Tooltip Design**: Used RobotTooltip components with Prompty icons for brand consistency
- **Business Location Fixes**: Resolved "Create Location" button disabled state by fixing `canCreateMore` prop usage
- **Platform Form Improvements**: Fixed layout alignment issues when "Other" platform is selected
- **Card Spacing Enhancements**: Increased padding and improved vertical rhythm for better visual hierarchy
- **Modal Close Button Standards**: Updated all modal close buttons to use red X with Prompty branding
- **Success Message Implementation**: Added proper success notifications for location prompt page saves/publishes
- **Module Field Re-enablement**: Restored emoji sentiment, falling stars, and offers modules for location-based pages

#### **Technical Fixes**
- **Stripe Webhook Fix**: Resolved webhook issue that was overwriting `max_locations` field during subscription updates
- **Location Limit Enforcement**: Fixed location creation limits by properly setting `maxLocations` based on plan type
- **Database Schema Resolution**: Applied migrations to fix missing column issues in `prompt_pages` table
- **Slug Generation**: Improved location slug generation to avoid conflicts with unique numeric suffixes
- **Schema Cache Issues**: Resolved PostgREST schema cache problems through database restarts and migrations

#### **Development Infrastructure**
- **Server Management**: Improved development server stability with proper port conflict resolution
- **Migration Management**: Enhanced migration system with automatic application and verification
- **Database Maintenance**: Implemented proper database restart procedures for schema cache refresh
- **Error Handling**: Enhanced error reporting and debugging capabilities throughout the application
- **Performance Optimization**: Improved compilation times and module loading efficiency

#### **Admin System Enhancement**
- **Admin Authentication**: Fixed admin user creation and verification system
- **Admin Database Records**: Properly created admin records for authorized users
- **Environment Configuration**: Verified `ADMIN_EMAILS` configuration for proper admin access
- **Admin Status Checking**: Enhanced admin status verification across the application

**Documentation Updated**: January 6, 2025 - Added Step 2 emoji gating implementation, UI/UX improvements, and comprehensive technical fixes

### Authentication Debugging & Syntax Error Resolution (January 2025)
- **Critical Syntax Errors Fixed**: Resolved React component compilation errors where `const supabase = createClient()` was incorrectly placed in function parameter destructuring
- **Comprehensive Debug Tools**: Created authentication debug page at `/auth/debug-auth` with real-time session monitoring, cookie inspection, and auth state testing
- **Playwright Testing Infrastructure**: Added comprehensive browser automation testing with multiple test suites for authentication flow validation
- **Compilation Error Resolution**: Fixed syntax errors in `FeedbackModal.tsx`, `QuoteDisplay.tsx`, and `SimpleBusinessForm.tsx` preventing proper app compilation
- **Session Persistence Validation**: Confirmed authentication system is working correctly with proper session management and cookie handling
- **Developer Tools**: Enhanced debugging capabilities with session inspection, cookie management, and authentication state monitoring

#### **Issues Resolved**
1. **React Component Syntax Errors**: Fixed `const supabase = createClient()` placement in function parameters
2. **Compilation Failures**: Resolved Next.js build errors preventing app startup
3. **Authentication Flow Validation**: Confirmed proper session handling and middleware functionality
4. **Browser Testing**: Established comprehensive testing framework for authentication validation

#### **Files Modified**
- `src/app/components/FeedbackModal.tsx` - Fixed syntax error with createClient() placement
- `src/app/components/QuoteDisplay.tsx` - Fixed syntax error with createClient() placement  
- `src/app/dashboard/components/SimpleBusinessForm.tsx` - Fixed syntax error with createClient() placement
- `src/app/auth/debug-auth/page.tsx` - Created comprehensive authentication debug tool
- `playwright.config.js` - Added Playwright testing configuration
- `tests/` - Created multiple test suites for authentication validation
- `TEST_RESULTS.md` - Comprehensive documentation of testing results

#### **Current Status**
- **App Compilation**: Successfully compiling and running without syntax errors
- **Authentication System**: Working correctly with proper session management
- **Debug Tools**: Comprehensive debugging infrastructure in place
- **Testing Framework**: Playwright testing established for ongoing validation
- **Server Status**: Running cleanly on port 3002 with all dependencies resolved

#### **Debug Tools Available**
- **Debug Page**: `/auth/debug-auth` - Real-time session monitoring and cookie inspection
- **Playwright Tests**: Browser automation for authentication flow validation
- **Session Management**: Cookie clearing and authentication state reset capabilities
- **Environment Check**: API endpoint validation and configuration verification

### Location-Specific Prompt Pages (January 2025)
- **Business Locations Feature**: Added location-specific prompt pages for Maven tier accounts (up to 10 locations)
- **Integrated UI Approach**: Locations section seamlessly integrated into `/prompt-pages` view between universal and custom pages
- **2-Step Location Wizard**: Comprehensive modal for creating/editing locations with basic info and AI training fields
- **Automatic Prompt Page Creation**: Each location automatically gets its own universal prompt page with location context
- **Location Management**: Full CRUD operations with tier enforcement, edit/delete controls, and cascading deletion
- **Database Architecture**: New `business_locations` table with RLS policies and location count tracking
- **API Implementation**: RESTful API endpoints for location operations with tier validation
- **Location Context**: Location prompt pages inherit settings with priority: page > location > business defaults
- **Maven Tier Exclusive**: Feature only visible and accessible to Maven plan subscribers
- **Location Display**: Grid layout showing location cards with name, address, and quick actions (View, Edit, QR Code)
- **Type Safety**: Full TypeScript support with BusinessLocation interface and utility functions

### Email Templates Admin Page (January 2025)
- **New Admin Interface**: Created comprehensive email template management at `/admin/email-templates`
- **Template Editor**: Full-featured editor with subject line, HTML content, and plain text fields
- **Live Preview**: Preview mode with sample variable substitution to see how emails will look
- **Template Management**: View all templates in table format with status, subject, and edit actions
- **Variable Reference**: Built-in guide showing available template variables (firstName, lastName, email, etc.)
- **Easy Navigation**: Added to admin navigation menu and quick actions on admin overview
- **Template Support**: Edit welcome emails, trial reminders, review notifications, and more
- **Database Integration**: Uses existing `email_templates` table and API endpoints
- **Professional UI**: Consistent admin styling with proper loading states, error handling, and success messages

### Account Settings Layout Fix (January 2025)
- **Fixed Layout Inconsistency**: Account page now uses consistent PageCard layout like other dashboard pages
- **Background Gradient Fix**: Removed custom background that was cutting off the dashboard gradient
- **Improved Organization**: Moved account page to `/dashboard/account` for better structure
- **Consistent UI**: Added icon, proper header styling, and consistent spacing to match other pages
- **Enhanced Authentication**: Added `useAuthGuard()` for consistent auth handling across dashboard
- **Updated Navigation**: All links now point to new `/dashboard/account` location
- **Proper Integration**: Account page now fully inherits dashboard styling and layout

### Authentication Timeout Fix (January 2025)
- **Critical Bug Fix**: Resolved authentication timeout issue causing users to see loading stars indefinitely
- **Improved Session Detection**: Changed from `getUser()` to `getSession()` for better reliability
- **Enhanced Timeout Handling**: Increased timeout from 5s to 8s and added fallback mechanism
- **Fallback Strategy**: Added direct `getUser()` fallback if session approach fails
- **Simplified Dashboard Logic**: Removed complex timeout handling from dashboard layout
- **Better Error Handling**: Enhanced logging and error reporting for authentication issues
- **Session Reliability**: Fixed timing issues where session wasn't fully established after redirect

### Account Password Reset Feature (January 2025)
- **In-Account Password Reset**: Added password reset functionality directly to the account page (`/account`)
- **One-Click Reset**: Users can reset their password with a single button click without entering their email
- **Reused Existing Flow**: Leverages the same password reset email system as the sign-in page
- **Enhanced UX**: Added loading states, success/error messages, and auto-clearing success messages
- **Proper Integration**: Uses existing `supabase.auth.resetPasswordForEmail()` with current user's email
- **Consistent UI**: Matches existing account page styling and button design patterns
- **Email Flow**: Sends password reset email that redirects to `/reset-password` page after email confirmation

### Google Business Profile Social Posting Rate Limit Fix (July 2025)
- **Rate Limit Handling Improvements**: Enhanced Google Business Profile API rate limit handling with better user feedback and retry mechanisms
- **Frontend Redirect Issue Resolution**: Fixed duplicate `useEffect` hooks that were causing unwanted redirects after rate limit errors
- **URL Parameter Handling**: Added proper error parameter handling to prevent redirect loops and improve user experience
- **Try Again Button Enhancement**: Improved "Try Again" button visibility and functionality with proper loading states and icon changes
- **TypeScript Type Safety**: Fixed TypeScript errors in fetch functions with proper type annotations and Promise handling
- **Error Message Clarity**: Enhanced rate limit error messages to be more user-friendly and informative
- **Component State Management**: Improved state management to prevent unnecessary re-renders and redirects
- **URL Parameter Fixes**: Resolved issues with page getting stuck on success URL parameters by improving useEffect logic and preventing duplicate loadPlatforms() calls
- **Rate Limit UX Enhancements**: Improved rate limit error messages with clearer guidance and retry instructions
- **Location Count Display**: Added dynamic location count in success messages to show users how many locations were fetched
- **Conservative Rate Limit Strategy**: Updated API configuration to use only 1 retry attempt with 2-minute delays for strict Google API limits
- **Enhanced Error Logging**: Added detailed logging for rate limit situations with clear explanations about Google's 1 request/minute limit
- **User Guidance Documentation**: Created comprehensive documentation explaining rate limits and best practices for users

#### **Technical Fixes**
1. **Duplicate useEffect Removal**: Removed duplicate `useEffect` hook that was calling `loadPlatforms()` twice
2. **URL Parameter Handling**: Added proper handling for error URL parameters to prevent redirect loops
3. **Rate Limit Detection**: Enhanced rate limit detection to check both `result.isRateLimit` and `response.status === 429`
4. **Try Again Button Logic**: Improved button visibility logic to show for both "rate limit" and "Rate limit" message variations
5. **TypeScript Improvements**: Added proper type annotations for `fetchWithRetry` function and timeout promises
6. **API Configuration Updates**: Reduced retry attempts to 1 and increased delay to 120 seconds for strict Google API compliance
7. **Enhanced Logging**: Added detailed console logging explaining rate limit situations and Google API restrictions
8. **Documentation**: Created `docs/GOOGLE_BUSINESS_PROFILE_RATE_LIMITS.md` with comprehensive rate limit guidance
6. **Icon Import Fix**: Added `FaRedo` icon import and replaced `FaRefresh` with proper icon name
7. **OAuth State Management**: Added `hasHandledOAuth` state to prevent multiple useEffect executions
8. **Success Message Enhancement**: Added dynamic location count display in success messages

#### **User Experience Improvements**
- **Persistent Try Again Button**: Button now stays visible after rate limit errors and shows proper loading states
- **Clear Error Messages**: Rate limit messages are more informative and explain the normal nature of rate limits for new connections
- **No More Redirects**: Fixed the issue where users were redirected to the starting page after rate limit errors
- **Better Loading States**: Improved loading indicators and disabled states during API calls

### Authentication System Debugging & Resolution (July 2025)
- **Critical Authentication Issues Resolved**: Comprehensive debugging session that resolved persistent authentication errors including "Invalid Refresh Token" and "AuthSessionMissingError"
- **Supabase Service Discovery**: Identified that the root cause was Supabase not running locally (`supabase start` resolved the core issue)
- **Middleware Security Fix**: Corrected middleware allowlist to include authentication routes, preventing chicken-and-egg authentication blocking
- **Singleton Pattern Implementation**: Completely rewrote `src/utils/supabaseClient.ts` with proper singleton pattern to prevent multiple GoTrueClient instances
- **Session Management Overhaul**: Removed problematic custom API routes and restored direct Supabase client usage for proper session handling
- **Email Confirmation System**: Enabled and configured email confirmations in `supabase/config.toml` with Inbucket local email testing
- **Enhanced Error Handling**: Added comprehensive logging throughout authentication flows for better debugging
- **Session Reset Utility**: Created `/auth/clear-session` page for clearing corrupted localStorage/sessionStorage data
- **Programmatic Testing**: Built multiple test scripts for reliable authentication verification without manual testing

#### **Issues Resolved**
1. **Supabase Not Running**: Primary root cause - local Supabase instance wasn't active
2. **Middleware Blocking Auth**: Middleware allowlist didn't include authentication endpoints
3. **Multiple Client Instances**: Singleton pattern wasn't properly implemented causing session conflicts
4. **Custom API Session Issues**: Custom sign-in API created incompatible cookie formats
5. **Email Confirmation Disabled**: Email confirmations were disabled preventing proper account verification
6. **Session Storage Corruption**: Old session data was interfering with new authentication attempts

#### **Files Modified**
- `supabase/config.toml` - Enabled email confirmations (`enable_confirmations = true`)
- `src/middleware.ts` - Added authentication routes to allowlist and enhanced logging
- `src/utils/supabaseClient.ts` - Complete rewrite with singleton pattern and session persistence
- `src/app/auth/sign-in/page.tsx` - Direct Supabase client usage instead of custom API
- `src/app/dashboard/layout.tsx` - Enhanced authentication checking with detailed logging
- `src/app/auth/clear-session/page.tsx` - New session reset utility page
- Removed: `src/app/api/auth/signin/route.ts` - Custom API route that caused session issues

#### **Current Status**
- **Authentication Working**: Sign-in/sign-out functionality confirmed via programmatic testing
- **Session Persistence**: Users successfully authenticate and redirect to dashboard
- **Email Verification**: Local email confirmation system working with Inbucket
- **Development Ready**: Authentication system stable for continued development

#### **Known Optimization Opportunities**
- **Multiple GoTrueClient Instances**: Console logs still show multiple instances (@0, @1, @3, @7, @8, @10, @19, @24, @27, @30) suggesting singleton pattern could be further optimized
- **Session Storage Cleanup**: Periodic cleanup of old session data may be beneficial
- **Error Recovery**: Additional fallback mechanisms for authentication failures

#### **Debugging Methodology**
- **Systematic Approach**: Isolated each component (middleware, client singleton, session management)
- **Programmatic Testing**: Created automated test scripts to avoid time-consuming manual testing
- **Root Cause Analysis**: Traced issues from symptoms to underlying service availability
- **Documentation**: Comprehensive logging and documentation of each fix attempt
- **Verification**: Confirmed resolution through multiple testing approaches

### Team Management Feature (January 2025)
- **Plan-Based User Limits**: Added team management with plan-based user limits (Grower: 1 user, Builder: 3 users, Maven: 5 users)
- **Account Invitations System**: Implemented invitation system with email-based team member invitations
- **Team Page UI**: Created comprehensive team management page with members list, invitations, and role management
- **Database Schema**: Added `max_users` to accounts table and `account_invitations` table with RLS policies
- **API Routes**: Created `/api/team/members`, `/api/team/invitations`, and `/api/team/invite` endpoints
- **User Display**: Team members display shows both account owner name (first_name + last_name) and business name
- **Role Management**: Support for 'owner' and 'member' roles with proper permissions
- **Invitation Management**: Send, view, and cancel invitations with expiration handling
- **Plan Enforcement**: Automatic user limit enforcement based on account plan

### Sticky Style Button for Prompt Page Owners (January 2025)
- **Added Sticky Style Button**: Logged-in users who own a prompt page now see a sticky "Style" button in the top-left corner
- **Real-time Style Editing**: Users can edit their prompt page styles directly from the public page and see changes immediately
- **Owner-Only Visibility**: Button only appears for authenticated users who own the prompt page (account_id match)
- **Consistent Design**: Button matches the existing save button styling and positioning
- **Modal Integration**: Reuses existing StyleModalPage component for consistent editing experience
- **Responsive Design**: Button adapts to mobile screens and adjusts position when offer banner is visible

### Sign-Up Flow & Development Server Fixes (January 2025)
- **Fixed FiveStarSpinner Positioning**: Moved spinner from vertically centered to positioned closer to navigation (48 units from top) for better UX
- **Fixed Development Server Issues**: Resolved port 3001 conflicts and Sentry integration errors
- **Fixed Track-Event API**: Added missing cookie options and proper service client configuration
- **Fixed Async Params**: Updated prompt-pages API to properly await params in Next.js 15
- **Improved Local Development**: Enhanced auto-signin feature using force-signin API for reliable local development
- **Database Cleanup**: Added comprehensive test data cleanup for development environment

### Sign-Up Flow Improvements
- **Enhanced Auto-Signin for Local Development**: Users are automatically signed in after account creation using the force-signin API when on localhost
- **Email Confirmation Bypass**: Local development bypasses email confirmation for faster testing using server-side email confirmation
- **Proper Redirect Flow**: Users are redirected to dashboard after successful sign-up with success message
- **Error Handling**: Enhanced error handling for duplicate account creation attempts and sign-in failures
- **Session Management**: Improved session establishment and persistence with proper email confirmation handling

### API Fixes & Improvements
- **Track-Event API**: Fixed cookie options and service client configuration for anonymous events
- **Prompt-Pages API**: Fixed async params handling for Next.js 15 compatibility
- **Service Client**: Proper configuration with cookie options for server-side operations
- **Error Logging**: Enhanced logging for debugging API issues

### UI/UX Improvements
- **FiveStarSpinner Positioning**: Positioned closer to navigation instead of vertically centered
- **Loading States**: Improved loading experience across the application
- **Development Server**: Stable development environment with proper error handling

### Technical Infrastructure
- **Port Management**: Automatic port conflict resolution for development server
- **Sentry Integration**: Properly disabled for local development to reduce noise
- **Database Schema**: All 73 migrations applied and up to date
- **Test Data Management**: Comprehensive cleanup scripts for development environment

### Persistent Onboarding Tasks System
- **Database-Backed Task Tracking**: Implemented `onboarding_tasks` table with RLS policies for secure task completion tracking
- **Automatic Task Completion**: Tasks automatically complete when users visit key pages (business profile, style, create prompt page)
- **Persistent Progress**: Onboarding checklist progress now persists across sessions and page refreshes
- **Utility Functions**: Created `onboardingTasks.ts` utility for database operations with proper error handling
- **Enhanced UX**: GettingStarted component now fetches and displays real-time task completion status
- **Multi-User Support**: Task tracking works with the existing account/user architecture

### JWT Signature Issues & Authentication Fixes
- **Fixed JWT Signature Errors**: Resolved persistent JWT signature errors in `/api/create-account` endpoint by switching from anon key to service key
- **Fixed Auth Session Missing**: Users now get proper sessions after signup in local development with auto-signin feature
- **Fixed Admin API Errors**: Resolved 400 Bad Request errors in admin status checking by correcting column name usage
- **Updated Auth Guard**: Fixed admin status checking in auth guard to use correct database column names
- **Improved Error Handling**: Added comprehensive error handling and logging for authentication flows

### User Onboarding Flow Improvements
- **Fixed Welcome Popup Logic**: Welcome popup now only shows on the create-business page for new users, not on the dashboard
- **Fixed Business Creation Redirect**: Business creation now properly redirects to dashboard after successful creation
- **Fixed Plan Selection Modal**: Pricing modal now automatically shows for new users who have created a business but haven't selected a plan yet
- **Added Starfall Celebration**: New users see a celebratory starfall animation after selecting their plan
- **Enhanced User Experience**: Complete end-to-end flow from signup to full dashboard access

### Complete User Flow
1. **Sign Up**: User creates account with email/password
2. **Auto-Signin**: In local development, user is automatically signed in after account creation
3. **Create Business**: User lands on create-business page with welcome popup
4. **Dashboard Redirect**: After business creation, user is redirected to dashboard
5. **Plan Selection**: Pricing modal automatically appears for new users
6. **Celebration**: Starfall animation plays after plan selection
7. **Full Access**: User can now access all dashboard features

### Onboarding Tasks System Architecture

#### **Database Schema**
```sql
-- onboarding_tasks table
- id (UUID, PK): Primary key
- user_id (UUID, FK): References auth.users(id)
- task_key (TEXT): Unique identifier for each task
- completed (BOOLEAN): Task completion status
- completed_at (TIMESTAMP): When task was completed
- created_at, updated_at: Timestamps
```

#### **Task Keys & Automatic Completion**
- `business_profile_created`: Completes when user visits `/dashboard/business-profile`
- `style_configured`: Completes when user visits `/dashboard/style`
- `prompt_page_created`: Completes when user visits `/dashboard/create-prompt-page`
- `widget_configured`: Completes when user visits `/dashboard/widget`
- `contacts_uploaded`: Completes when user visits `/dashboard/contacts`

#### **Technical Implementation**
- **RLS Policies**: Secure access control ensuring users can only see their own tasks
- **Utility Functions**: `getOnboardingTasks()`, `markTaskComplete()`, `initializeUserTasks()`
- **Error Handling**: Graceful fallback to local state if database operations fail
- **Loading States**: Proper loading indicators during task status fetching
- **Real-time Updates**: Task completion status updates immediately in UI

#### **Component Integration**
- **GettingStarted Component**: Fetches and displays task completion from database
- **Dashboard Pages**: Pass user ID to enable automatic task completion
- **Error Recovery**: Falls back to local state if database is unavailable
- **Performance**: Efficient database queries with proper indexing

### Technical Improvements
- **Service Key Usage**: API endpoints now use Supabase service key for privileged operations
- **Database Consistency**: Fixed column name mismatches between code and database schema
- **Error Logging**: Enhanced logging for debugging authentication and database issues
- **Session Management**: Improved session handling across the application
- **RLS Policies**: Proper Row Level Security policies for multi-user account system

## Signup Flow & Multi-User Architecture

### Complete Signup Process

The signup flow is designed to support both single-user accounts and future multi-user/multi-business functionality. Here's the complete process:

#### 1. **User Registration** (`/auth/sign-up`)
- User enters email, password, first name, and last name
- Frontend validates input and calls Supabase Auth to create user
- On successful registration, user is automatically signed in (local development)
- Frontend calls `/api/create-account` to create account record

#### 2. **Account Creation** (`/api/create-account`)
- **Purpose**: Creates the account record and account_users relationship
- **Service Key Usage**: Uses Supabase service key to bypass RLS for privileged operations
- **Data Structure**: Creates account with proper UUID references to `auth.users(id)`
- **Multi-User Ready**: Sets up account_users record with 'owner' role for future multi-user support

#### 3. **Auth Callback** (`/auth/callback`)
- **Purpose**: Handles OAuth redirects and ensures account exists
- **Account Check**: Verifies account exists, creates if missing
- **Error Handling**: Gracefully handles JWT signature errors and missing accounts
- **Service Key Usage**: Uses service key for all database operations

#### 4. **Business Creation** (`/dashboard/create-business`)
- **Welcome Popup**: Shows welcome message for new users
- **Business Form**: User creates their first business profile
- **Account Linking**: Business is linked to user's account via `account_id`
- **Redirect**: After creation, user is redirected to dashboard

#### 5. **Plan Selection**
- **Automatic Trigger**: Pricing modal appears for new users who haven't selected a plan
- **Plan Assignment**: User selects plan (grower, starter, etc.)
- **Celebration**: Starfall animation plays after plan selection
- **Account Update**: Plan information is saved to accounts table

### Database Architecture for Multi-User/Multi-Business Support

#### **Accounts Table**
```sql
- id (UUID, PK, references auth.users(id)): Primary key, also foreign key to auth.users
- user_id (UUID): The user who created the account (for initial ownership)
- email, first_name, last_name: User information
- plan, trial_start, trial_end: Subscription and trial information
- has_seen_welcome, business_name: User experience flags
- stripe_customer_id, stripe_subscription_id: Payment integration
- created_at, updated_at: Timestamps
```

#### **Account_Users Table** (Multi-User Support)
```sql
- id (UUID, PK): Primary key
- account_id (UUID, FK): References accounts(id)
- user_id (UUID, FK): References auth.users(id)
- role (TEXT): 'owner', 'member', 'admin', etc.
- created_at, updated_at: Timestamps
```

#### **Businesses Table** (Multi-Business Support)
```sql
- id (UUID, PK): Primary key
- account_id (UUID, FK): References accounts(id) - enables multiple businesses per account
- name, description, website: Business information
- created_at, updated_at: Timestamps
```

### Key Technical Implementation Details

#### **JWT Signature Error Resolution**
- **Problem**: Local Supabase development had JWT signature mismatches
- **Solution**: Use service key for all API operations instead of anon key
- **Implementation**: All `/api/*` routes use `createServerClient` with service key
- **Benefits**: Bypasses RLS for privileged operations, ensures consistent authentication

#### **Session Management**
- **Auto-Signin**: In local development, users are automatically signed in after registration
- **Session Persistence**: Proper session handling across page refreshes and redirects
- **Error Recovery**: Graceful handling of session expiration and JWT errors

#### **RLS (Row Level Security) Policies**
- **Accounts**: Users can only access their own account records
- **Account_Users**: Users can only access account_users records for accounts they belong to
- **Businesses**: Users can only access businesses linked to their account
- **Multi-User Ready**: Policies support future role-based access control

#### **Error Handling & Logging**
- **Comprehensive Logging**: All API endpoints include detailed error logging
- **Graceful Degradation**: System continues to function even if some operations fail
- **User Feedback**: Clear error messages and loading states for better UX

### Future Multi-User/Multi-Business Features

The current architecture is designed to support:

#### **Multiple Users Per Account**
- Account owners can invite team members
- Role-based permissions (owner, admin, member)
- Shared access to businesses and prompt pages
- Team collaboration features

#### **Multiple Businesses Per Account**
- Users can create and manage multiple business profiles
- Each business can have its own prompt pages and widgets
- Business-specific settings and branding
- Cross-business analytics and reporting

#### **Account Management**
- Account-level billing and subscription management
- User invitation and removal workflows
- Account settings and preferences
- Audit logs for account activities

### Testing the Signup Flow

#### **Manual Testing**
1. Visit `/auth/sign-up`
2. Create account with valid email/password
3. Verify automatic redirect to create-business page
4. Create business profile
5. Verify redirect to dashboard
6. Confirm plan selection modal appears
7. Select plan and verify starfall animation

#### **Automated Testing**
- Test scripts available for end-to-end signup flow verification
- Database cleanup scripts for testing
- Admin tools for user management and cleanup

### Common Issues & Solutions

#### **Authentication & Session Issues**

##### **"Invalid Refresh Token: Refresh Token Not Found"**
- **Symptom**: User gets refresh token errors and cannot sign in
- **Cause**: Supabase service not running or session storage corruption
- **Solution**: 
  1. Check if Supabase is running: `supabase status`
  2. Start Supabase if needed: `supabase start`
  3. Clear session storage at `/auth/clear-session`
  4. Verify middleware isn't blocking auth routes

##### **"AuthSessionMissingError: Auth session missing!"**
- **Symptom**: Users get auth session missing errors after signin
- **Cause**: Session not properly established or middleware blocking
- **Solution**: 
  1. Verify Supabase client singleton pattern is working
  2. Check middleware allowlist includes auth routes
  3. Ensure direct Supabase client usage (no custom API routes)
  4. Clear browser localStorage and sessionStorage

##### **Multiple GoTrueClient Instances**
- **Symptom**: Console shows `GoTrueClient@0`, `@1`, `@3`, etc. with "session from storage null"
- **Cause**: Singleton pattern not properly implemented
- **Solution**: 
  1. Verify `supabaseClient.ts` implements true singleton pattern
  2. Check for multiple imports or client instantiations
  3. Ensure all components use the same client instance

##### **403 Forbidden on Auth Endpoints**
- **Symptom**: `GET http://127.0.0.1:54321/auth/v1/user 403 (Forbidden)`
- **Cause**: Supabase local instance not running
- **Solution**: Start Supabase with `supabase start`

##### **Middleware Blocking Authentication**
- **Symptom**: Cannot access sign-in API, getting unauthorized errors
- **Cause**: Middleware doesn't include auth routes in allowlist
- **Solution**: Add auth routes to middleware public paths allowlist

#### **Development Server Issues**

##### **Port Already in Use (EADDRINUSE)**
- **Symptom**: `Error: listen EADDRINUSE: address already in use :::3002`
- **Cause**: Development server already running on port 3002
- **Solution**: 
  1. Kill existing process: `lsof -ti:3002 | xargs kill -9`
  2. Or use different port: `npm run dev -- -p 3003`
  3. Check for background processes

##### **Email Confirmations Not Working**
- **Symptom**: Users don't receive confirmation emails or get auth errors
- **Cause**: Email confirmations disabled in Supabase config
- **Solution**: 
  1. Set `enable_confirmations = true` in `supabase/config.toml`
  2. Restart Supabase: `supabase stop && supabase start`
  3. Check Inbucket at http://127.0.0.1:54324

#### **Database & API Issues**

##### **JWT Signature Errors**
- **Symptom**: "JWSError JWSInvalidSignature" in logs
- **Cause**: Mismatch between environment variables and Supabase configuration
- **Solution**: Ensure consistent use of service key in API routes

##### **Auth Session Missing**
- **Symptom**: "AuthSessionMissingError" after signup
- **Cause**: Session not properly established or expired
- **Solution**: Check auth callback and session handling logic

##### **Business Creation Failures**
- **Symptom**: Business creation returns 500 error
- **Cause**: RLS policies or foreign key constraints
- **Solution**: Verify account_id linking and RLS policy configuration

##### **Plan Selection Not Showing**
- **Symptom**: Pricing modal doesn't appear for new users
- **Cause**: Logic checking for plan selection status
- **Solution**: Verify plan selection detection logic in dashboard

#### **Debugging Tools & Commands**

##### **Check Supabase Status**
```bash
supabase status                    # Check if services are running
supabase logs                      # View service logs
supabase db reset                  # Reset database (destructive)
```

##### **Authentication Testing**
- Visit `/auth/clear-session` to clear corrupted sessions
- Check browser console for GoTrueClient instances and session errors
- Use browser dev tools to inspect localStorage and sessionStorage
- Test sign-in/out flow in incognito mode

##### **Port Management**
```bash
lsof -ti:3002 | xargs kill -9      # Kill processes on port 3002
netstat -an | grep 3002            # Check what's using port 3002
```

##### **Email Testing**
- Visit http://127.0.0.1:54324 for Inbucket (local email)
- Check `supabase/config.toml` for email settings
- Verify SMTP configuration if using external email

## Development Strategy

### Phase 1: Widget Development (Current)
- Focus on widget design and functionality
- Develop as a standalone vanilla JavaScript component
- Test and refine user experience
- Ensure cross-browser compatibility
- Optimize performance and loading times

### Phase 2: Integration (Future)
- Integrate widget with Next.js application
- Connect to backend services
- Implement authentication and data persistence
- Add analytics and monitoring

## Widget Development

The widget is currently being developed as a standalone component in the `public/widgets/multi/` directory:

```
public/widgets/multi/
├── widget-embed.js    # Main widget JavaScript (with responsive fallback)
├── widget-embed.min.js # Minified version for production
├── widget-embed-working.js # Working version with responsive fixes
├── multi-widget.css   # Widget styles
├── test-responsive.html # Test page for responsive behavior
└── working-test.html  # Test page with debug console
```

To test the widget:
1. Open `public/widgets/multi/test-responsive.html` in your browser
2. Make changes to the JavaScript and CSS files
3. Refresh to see your changes
4. Test responsive behavior by resizing the browser window

No build step is required during widget development.

## Widget Responsiveness

The multi-widget now has proper responsive behavior with a dual system:

### Primary: Swiper.js Carousel
- **Desktop (1024px+)**: 3 cards visible with navigation
- **Tablet (768px-1023px)**: 2 cards visible with navigation  
- **Mobile (<768px)**: 1 card visible with navigation

### Fallback: CSS Grid Layout
When Swiper.js fails to load (network issues, CDN problems), the widget falls back to a responsive CSS Grid:
- **Desktop (1024px+)**: 3 cards per row
- **Tablet (768px-1023px)**: 2 cards per row
- **Mobile (<768px)**: 1 card per row

### Key Features
- **Multiple CDN fallbacks** for Swiper.js loading reliability
- **Responsive CSS Grid** with `!important` declarations to override inline styles
- **Graceful degradation** when Swiper fails to load
- **Consistent card styling** between Swiper and Grid modes

### Testing Responsiveness
1. Visit `http://localhost:3001/widgets/multi/test-responsive.html`
2. Resize browser window to test different breakpoints
3. Check browser console for loading status
4. Test with network throttling to simulate slow connections

## Admin User Management

### Admin Delete Functionality

A comprehensive admin user deletion system has been implemented to properly clean up all user-related data when users are deleted. This prevents orphaned data that can cause conflicts when users are recreated.

#### Features
- **Complete Data Cleanup**: Removes all user-related data across all database tables
- **Admin-Only Access**: Requires admin privileges to use
- **Safe Deletion Order**: Follows proper foreign key constraint order
- **Detailed Logging**: Provides comprehensive cleanup results
- **User-Friendly Interface**: Web-based admin panel for user management

#### Files Created
- `src/utils/adminDelete.ts` - Core deletion utility functions
- `src/app/api/admin/delete-user/route.ts` - Admin-only API endpoint
- `src/app/admin/page.tsx` - Admin user management interface
- `test-admin-delete.js` - Test script for verification

#### Cleanup Process
The deletion process follows this order to respect foreign key constraints:

1. **Child Tables** (widgets, reviews, analytics, etc.)
   - Analytics events
   - AI usage records
   - Widget reviews
   - Review submissions
   - Contacts
   - Prompt pages
   - Widgets
   - Businesses

2. **Junction Tables** (account_users)

3. **Parent Tables** (accounts, admins)

4. **Auth User** (Supabase Auth)

#### Usage
1. Navigate to `/admin` (admin privileges required)
2. Search for user by email address
3. Review user information
4. Click "Delete User & All Data"
5. Confirm deletion in modal
6. View detailed cleanup results

#### Testing
Run the test script to verify functionality:
```bash
node test-admin-delete.js <test-email>
```

This will create a test user with sample data, delete them using the admin API, and verify complete cleanup.

## Testing & Development Tools

### Test Scripts
- **Signup Flow Testing**: `test-signup-flow.js` - Tests complete user signup, account creation, and business creation flow
- **Admin Delete Testing**: `test-admin-delete.js` - Tests admin user deletion functionality
- **Database Connection**: Various scripts for testing database connectivity and schema

### Development Environment
- **Local Supabase**: Running on port 54321 with local database
- **Next.js Dev Server**: Running on port 3001
- **Environment Variables**: Configured for local development with service keys

### Common Issues & Solutions
- **JWT Signature Errors**: Use service key instead of anon key for API operations
- **Auth Session Missing**: Ensure proper signin flow and session management
- **Admin API 400 Errors**: Check column names match database schema
- **Business Creation Issues**: Verify RLS policies and foreign key constraints

---

# **PromptReviews Project Cheat Sheet**

This project uses environment variables for configuration. Ensure all required environment variables are set in your deployment platform.

Keys include supabase, Stripe, Resend

## **Project Overview**

- **Stack:** Vanilla JavaScript, HTML, CSS, Supabase (DB, Auth, Storage), Tailwind CSS.
- **Purpose:** Business onboarding, authentication, and review management platform with custom prompt pages, AI-generated reviews, and media uploads.

## **Documentation**

- [Sign-Up Process & Multi-User System](SIGNUP_AND_MULTI_USER_DOCUMENTATION.md) - Comprehensive guide to authentication and multi-user account management
- [Database Schema](databaseschema.md) - Complete database structure and relationships
- [Authentication Cleanup](AUTHENTICATION_CLEANUP.md) - Security standardization and API authentication patterns
- [Widget System](WIDGET_SYSTEM_DOCUMENTATION.md) - Widget development and customization guide
- [Widget Dashboard](WIDGET_DASHBOARD_DOCUMENTATION.md) - Dashboard widget management interface
- [Troubleshooting](TROUBLESHOOTING_DOCUMENTATION.md) - Common issues and solutions
- [User Documentation](USER_DOCUMENTATION.md) - End-user guide and features

---

## **Key Technologies & Patterns**

### **1. Supabase**

- **Auth, DB, Storage:** All handled via Supabase.
- **Client Usage:**
  - **Use `@supabase/ssr` everywhere** for both client and server (API) code.
    - `createBrowserClient` for client-side (React components/pages).
    - `createServerClient` for server-side (API routes, middleware).
  - **Do NOT mix with `@supabase/auth-helpers-nextjs`** (legacy, only a few old usages remain).

### **2. Authentication**

- **Sign-in/Sign-up:**
  - Use `createBrowserClient` from `@supabase/ssr`.
  - Handles both email/password and OAuth (Google).
- **Session Handling:**
  - All session checks and user fetching use the same Supabase client.
  - If session is missing, user is redirected to `/auth/sign-in`.

### **3. Project Structure**

- **Pages:**
  - `src/app/` — Next.js App Router pages.
  - `src/app/dashboard/` — Main dashboard and business management.
  - `src/app/r/[slug]/page.tsx` — Public prompt/review pages.
  - `src/app/auth/` — Auth flows.
  - `src/app/api/` — API routes (server actions).
- **Components:**
  - `src/app/components/` — Shared UI components.
- **Utils:**
  - `src/utils/` — Supabase helpers, guards, etc.

### **4. Review & Prompt Pages**

- **Prompt Pages:**
  - Can be for platforms (Google, Yelp, etc.), video, photo+testimonial, or universal.
  - AI-generated review/testimonial support.
  - Media upload (photo/video) via Supabase Storage.

### **5. Business Logic**

- **Business Profiles:**
  - Each user can create/manage a business profile.
  - Business data is stored in the `businesses` table.
- **Review Submissions:**
  - Stored in `review_submissions` table.
  - Includes text, media URLs, reviewer info, etc.

---

## **Common Gotchas & Best Practices**

- **Always use the same Supabase client (`@supabase/ssr`) everywhere.**
- **Check for null/undefined user/session before accessing properties.**
- **If you see `AuthSessionMissingError`, the session is missing or expired.**
- **Environment variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set and correct.
  - Restart the dev server after changing env vars.
- **Do not use or reintroduce `@supabase/auth-helpers-nextjs` unless refactoring the whole app.**
- **For new features:**
  - Follow the pattern of using `createBrowserClient` for all Supabase operations in client components.
  - Use `createServerClient` for API routes.

---

## **Updating Widget Styles (Tailwind CSS Build)**

**Widget CSS Management:**

- All widget styles are managed directly in `public/widget.css`
- This file is served directly to users and embedded sites
- To modify widget styles:
  1. Edit `public/widget.css` directly
  2. Test your changes locally
  3. Commit and push the changes
  4. Deploy to update the live widget styles

Note: The widget CSS is now managed manually to ensure reliable updates and direct control over the final output.

**How the build works (now automated):**

- The `package.json` build script runs:
  ```sh
  npx tailwindcss -i ./src/widget-embed/widget.css -o ./public/widget.css --minify
  ```
  as part of every Vercel deployment.
- **You do NOT need to run this command manually before pushing.**
- Vercel will always generate the latest CSS from your source on every deploy.
- A safelist is included in `src/widget-embed/widget.css` to ensure all Tailwind utility classes used in widget JSX are present in the final CSS, even if not detected by Tailwind's scan.

**How to update widget styles:**

1. Edit your styles in `src/widget-embed/widget.css` (and/or your widget JSX).
2. Commit and push your changes.
3. Vercel will build and deploy the correct, up-to-date CSS automatically.

**Summary:**
- No more manual CSS builds needed.
- No more missing classes in production.
- Just edit, commit, and push—Vercel takes care of the rest.

For more details, see the safelist comment in `src/widget-embed/widget.css`.

**Tip:**
- You can add this to your `package.json` scripts for convenience:
  ```json
  "scripts": {
    "build:widget:css": "npx tailwindcss -i ./src/widget-embed/widget.css -o ./public/widget.css --minify"
  }
  ```
  Then just run:
  ```sh
  npm run build:widget:css
  ```

---

## **Debugging Tips**

- **If login/auth breaks:**
  - Check for mixed Supabase client usage.
  - Clear cookies/localStorage and try again.
  - Check for errors in the browser console and network tab.
- **If you see session errors:**
  - Make sure you're not running the app on multiple ports/domains.
  - Make sure you're not in incognito/private mode (unless testing).
- **If uploads fail:**
  - Check Supabase Storage bucket permissions and policy.
  - Check file size/type limits.
- **If widget responsiveness breaks:**
  - Check browser console for Swiper loading errors
  - Test with network throttling to simulate slow connections
  - Verify CSS media queries are applying correctly
  - Test on different screen sizes using browser dev tools

---

## **How to Add a New Feature**

1. **Create a new page/component in `src/app/` or `src/app/dashboard/`.**
2. **Use `createBrowserClient` for Supabase operations.**
3. **Add any new DB columns via Supabase SQL editor and update types if needed.**
4. **Test with both a real user and a new incognito session.**
5. **Keep UI/UX consistent with Tailwind and existing design patterns.**

---

## **Where to Look for…**

- **Supabase client setup:**
  - `src/utils/supabase.ts` (for types and helpers)
  - Directly in each page/component via `createBrowserClient`
- **Auth/session logic:**
  - `src/app/auth/sign-in/page.tsx`, `src/app/auth/sign-up/page.tsx`
  - `src/utils/authGuard.ts`
- **Business/profile logic:**
  - `src/app/dashboard/`
- **Prompt/review logic:**
  - `src/app/r/[slug]/page.tsx`
- **API routes:**
  - `src/app/api/`

---

## **Onboarding Checklist**

- [ ] Clone the repo and install dependencies.
- [ ] Set up environment variables in your deployment platform.
- [ ] Run `npm run dev` and test sign-in/sign-up.
- [ ] Familiarize yourself with `@supabase/ssr` usage.
- [ ] Review the dashboard and prompt page flows.
- [ ] Read through `src/utils/supabase.ts` and `src/utils/authGuard.ts` for helper patterns.

---

**If you follow these patterns and keep Supabase client usage consistent, you'll avoid most session/auth headaches and be productive quickly!**

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying the HTML, CSS, and JavaScript files in the project. The page auto-updates as you edit the files.

## Project Structure

- `public/` - Contains all static assets and widget files
  - `widgets/` - Contains the widget implementation files
    - `multi/` - Multi-widget implementation
      - `widget-embed.js` - Main widget JavaScript
      - `widget-embed.css` - Widget styles
      - `multi.html` - Example implementation
- `src/` - Source files for the project
  - `widget-embed/` - Widget source files
    - `widget.css` - Source CSS for widgets
    - `widget.js` - Source JavaScript for widgets

## Development

The project uses a simple development server that serves static files. No framework or build step is required for development.

To modify widget styles:
1. Edit the CSS files directly
2. Test your changes locally
3. Commit and push the changes
4. Deploy to update the live widget styles

## Learn More

To learn more about the technologies used in this project:

- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features and API
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS features
- [Vanilla JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - learn about JavaScript

## Deployment

The project can be deployed to any static hosting service that supports serving static files. Some recommended options:

- [Vercel](https://vercel.com) - Simple deployment with automatic HTTPS
- [Netlify](https://netlify.com) - Great for static sites with form handling
- [GitHub Pages](https://pages.github.com) - Free hosting for static sites

To deploy:
1. Build your static files
2. Upload to your chosen hosting service
3. Configure your domain and SSL certificate

## Prompt Page UI Component Library

### Location

All modular, reusable UI components for prompt page modules (such as Special Offer, Emoji Sentiment, Review Platforms, etc.) are stored in:

```
src/app/dashboard/edit-prompt-page/components/
```

### What is stored here

- **Section modules** for the Universal Prompt Page and other prompt page editors, including:
  - `OfferSection.tsx`: Special Offer input module
  - `EmojiSentimentSection.tsx`: Emoji sentiment input module
  - `ReviewPlatformsSection.tsx`: Review platforms input module (platform name, URL, instructions, word count)
  - `ReviewWriteSection.tsx`: Review platforms + review writing/generation (for custom prompt pages)
  - `OfferToggle.tsx`: Simple toggle for enabling/disabling modules
  - `DisableAIGenerationSection.tsx`: Toggle for enabling/disabling the "Generate with AI" button on prompt pages
- **Shared config files** for module defaults (if needed)
- **Any future prompt page modules** (e.g., testimonials, feedback, etc.)

### How to use

- **Import the component** you need into your page or form:
  ```tsx
  import OfferSection from "src/app/dashboard/edit-prompt-page/components/OfferSection";
  import DisableAIGenerationSection from "src/app/components/DisableAIGenerationSection";
  ```
- **Pass in the required props** (see each component's interface for details).
- **Extend or create new modules** by following the same pattern: section header, icon, consistent styling, and modular props.

### Why this structure?

- Keeps all prompt page modules consistent, discoverable, and easy to maintain.
- Makes it easy to reuse modules across Universal, custom, and business profile pages.
- Encourages modular, scalable UI development.

If you want to move these to a more global shared directory (e.g., `src/app/components/prompt-modules/`), refactor as needed and update this section.

## Universal Prompt Page: Business Defaults Fallback Logic

### How it works

- When editing or rendering a Universal Prompt Page, the app fetches both the Universal Prompt Page record and the associated Business Profile.
- For each field (e.g., Special Offer, Review Platforms):
  - If the Universal Prompt Page has a value (not null/empty), use it.
  - Otherwise, use the value from the Business Profile.

**Example:**

```ts
const mergedOfferEnabled =
  universalPage.offerEnabled ?? businessProfile.default_offer_enabled;
const mergedOfferTitle =
  universalPage.offerTitle || businessProfile.default_offer_title;
const mergedReviewPlatforms = universalPage.reviewPlatforms?.length
  ? universalPage.reviewPlatforms
  : businessProfile.review_platforms;
```

### Editing & Saving

- The Universal Prompt Page editor pre-fills fields with merged values (universal override if present, otherwise business default).
- When a user changes a field, it is saved as an override in the Universal Prompt Page record.
- If a field is cleared, you can either:
  - Remove the override (so it falls back to business default), or
  - Save as null/empty to explicitly override.

### Public Prompt Page Rendering

- The public prompt page uses the same merge logic: show the universal value if set, otherwise show the business default.

### Benefits

- **Consistency:** New universal pages are pre-filled with business defaults, reducing setup friction.
- **Flexibility:** Users can override any field for a specific universal page.
- **Maintainability:** If the business profile changes, universal pages that haven't overridden a field will automatically reflect the new default.

### Implementation Notes

- This pattern can be used for any field: offer, review platforms, emoji sentiment, etc.
- You may want to visually indicate in the editor which fields are using business defaults vs. overridden.

### Public Prompt Page Fallback Logic

- The public prompt page (`/r/[slug]`) uses the same fallback logic as the editor:
  - For each field (Special Offer, Review Platforms, Emoji Sentiment, etc.), it uses the value from the prompt page if set, otherwise falls back to the business profile default.
- This ensures that:
  - New prompt pages always display up-to-date business defaults unless/until a value is explicitly overridden in the prompt page.
  - If the business profile is updated, all public prompt pages that haven't overridden a field will automatically reflect the new default.

---

## Falling Star Animation & Offer Banner Functionality

### Falling Star Animation

- **Purpose:** Adds a celebratory animation (stars, hearts, rainbows, etc.) that falls from the top of the public prompt page.
- **How to Enable:**
  - In any prompt page editor, toggle the "Falling star animation" section ON and select an icon.
  - The animation is enabled if an icon is selected (the toggle reflects this state).
  - The selected icon will be saved as `falling_icon` in the database.
- **How it Works:**
  - On the public prompt page, if `falling_icon` is set, the animation will run.
  - If **Emoji Sentiment** is also enabled, the animation will only run after a user selects a positive sentiment ("Excellent" or "Satisfied").
  - If Emoji Sentiment is **not** enabled, the animation runs immediately when the page loads.
  - The animation creates 20 falling icons with random positions, sizes, and timing for a natural effect.

### **UI Improvements (Latest Update)**
- **Simplified Interface:** Shows only the selected icon with blue border (no grid of default icons)
- **"More Icons" Button:** Opens a modal with 50+ icons organized by category
- **Prompty Integration:** Full-height Prompty image positioned flush with module edges
- **Consistent Styling:** All icons use slate blue color (`text-slate-blue`) for brand consistency
- **Better Layout:** Toggle positioned further from heading, proper spacing and typography
- **Category Organization:** Icons organized into 8 categories for easy browsing:
  - **Nature & Weather:** Rainbows, Suns, Moons, Clouds, Snowflakes, Fire, Trees, Leaves, Flowers
  - **Food & Drinks:** Coffee, Gifts, Wine
  - **Activities & Sports:** Thumbs Up, Bicycles, Dumbbells, Trophies, Medals, Crowns
  - **Tools & Objects:** Wrenches, Anchors, Lightbulbs, Magic, Rockets, Gems
  - **Transportation:** Planes, Cars, Ships
  - **Symbols & Peace:** Peace, Globes, Flags, Shields
  - **Entertainment:** Music, Games, Cameras, Books
  - **Animals:** Cats, Dogs, Birds, Butterflies, Fish, Frogs
  - **Fantasy & Fun:** Dragons, Ghosts, Robots, Unicorns
  - **Time & Communication:** Clocks, Bells, Location markers

### **Technical Implementation**
- **Component:** `FallingStarsSection.tsx` - Reusable component used across all prompt page forms
- **Configuration:** `fallingStarsConfig.ts` - Centralized icon definitions and utilities
- **Animation:** CSS animations with JavaScript-generated random positioning
- **Database:** Stores `falling_icon` as a string key in the `prompt_pages` table
- **Consistent Usage:** Same component used in Universal, Service, Product, and Photo prompt pages

### Offer Banner (Special Offer)

- **Purpose:** Displays a slim, dismissible banner at the top of the public prompt page to promote a special offer, code, or link.
- **How to Enable:**
  - In the Universal Prompt Page editor, toggle the "Special Offer" section ON and fill in the title, message, and (optionally) a Learn More URL.
  - The banner is enabled if the toggle is ON and a title/message are provided.
- **How it Works:**
  - The banner appears at the very top of the public prompt page, above all other content.
  - It includes an icon, the offer title, a short message, and a "Learn More" button if a URL is provided.
  - Users can dismiss the banner (it will not reappear until the page is reloaded).
- **Persistence:** The offer settings are saved to the database and reflected on the public page after save.

---

#### DisableAIGenerationSection

**Props:**

- `enabled: boolean` — Whether the AI button is enabled (shown to customers)
- `onToggle: () => void` — Callback to toggle the enabled state

**Purpose:**

- Shows a styled toggle switch and description for enabling/disabling the "Generate with AI" button on the public prompt page.
- Used in both Universal and custom prompt page editors.

**Example:**

```tsx
<DisableAIGenerationSection
  enabled={aiButtonEnabled}
  onToggle={() => setAiButtonEnabled((v) => !v)}
/>
```

---

## Global Loading Spinner and AppLoader

To ensure a consistent loading experience across the app, use the `AppLoader` component for all loading states. This component displays a centered animated five-star spinner (default size 48) and the text "Loading…" in white, making it suitable for both light and dark backgrounds.

### Usage

Import and use `AppLoader` wherever you need a loading state:

```tsx
import AppLoader from "@/app/components/AppLoader";

// ...
if (isLoading) {
  return <AppLoader />;
}
```

### Details

- The spinner is implemented by `FiveStarSpinner` with a default size of 48.
- The loading text is always white and centered below the spinner.
- This ensures all loading states look and feel the same throughout the app.

If you need a custom loading message or style, consider extending `AppLoader` or passing props as needed.

---

# UI/UX Styles & Component Conventions

## Where to Find Key UI Modules

- **SectionHeader:** `src/app/components/SectionHeader.tsx` — For all section headers with icon, title, and subcopy. Use this for consistent section/module headers.
- **PageCard:** `src/app/components/PageCard.tsx` — For main page/card layout, floating top-left icon, and card-level actions. Always use for dashboard and prompt page forms.
- **ReviewWriteSection:** `src/app/dashboard/edit-prompt-page/components/ReviewWriteSection.tsx` — For review platform cards, AI button, and review template fields.
- **PromptPageForm:** `src/app/components/PromptPageForm.tsx` — Main form for all prompt page types. Shows how to compose all modules and use conventions.

## Visual & Code Conventions

- **Section headers:**
  - Use `<SectionHeader icon={...} title="..." subCopy="..." />` for all major sections.
  - Title: `text-2xl font-bold text-[#1A237E]` (or override with `titleClassName` for page titles).
  - Subcopy: Left-aligned with title, `text-sm text-gray-700`.
- **Page-level icons:**
  - Use the `icon` prop on `PageCard` for a floating, breaching icon in the top-left of the card.
  - Never render the icon manually inside the form/component.
- **AI Gen Button:**
  - Use the standardized button: `inline-flex items-center px-4 py-2 border rounded font-semibold shadow text-slate-blue border-slate-blue bg-white hover:bg-slate-blue/10 transition text-sm whitespace-nowrap w-auto min-w-[180px] self-start gap-2` with `<FaMagic />`

## Recent Updates

### 📅 July 2, 2025 - Major Authentication System Fix
**🎯 Successfully resolved critical authentication issues**

**Problem**: Multiple GoTrueClient instances (10+) were being created across the application, causing session storage conflicts and preventing successful authentication despite valid credentials.

**Root Cause**: 20+ client-side files were creating individual Supabase clients using `createBrowserClient` instead of using the singleton pattern.

**Solution Implemented**:
- ✅ **Enhanced singleton pattern** in `src/utils/supabaseClient.ts` with comprehensive instance tracking
- ✅ **Converted 20+ client-side files** to use singleton from `supabaseClient.ts`
- ✅ **Eliminated ALL multiple client creation patterns** in client-side components
- ✅ **Added automatic authentication redirect** for users with existing sessions
- ✅ **Improved sign-in form handling** to prevent form emptying issues

**Technical Details**:
- **Files Modified**: Core dashboard components, admin pages, auth pages, UI components, widget components
- **Verification**: Confirmed only ONE Supabase client instance (#0) now creates instead of 10+
- **Enhanced Logging**: Added creation location tracking and multiple instance warnings
- **Navigation Improved**: Replaced `window.location.href` with Next.js router

**Result**: 
- ✅ Authentication flow now works seamlessly
- ✅ Session persistence across page navigation  
- ✅ Eliminated session storage conflicts
- ✅ Proper redirect behavior for authenticated users
- ✅ Development server running successfully on port 3002
- ✅ **LOGIN FUNCTIONALITY FULLY RESTORED** - Complete authentication flow working end-to-end
- ✅ **STARFALL CELEBRATION FIXED** - Business creation now triggers celebration animation
- ✅ **NAVIGATION REFRESH FIXED** - Main nav becomes accessible immediately after business creation

**Branch**: `fix/consolidate-supabase-clients`

#### Business Creation Experience Enhancements
**Issues Identified**: After successful authentication, two critical UX issues remained:
1. **Missing celebration animation** - No starfall animation after business creation
2. **Navigation not refreshing** - Main navigation links remained disabled after business creation

**Solutions Implemented**:

1. **Starfall Celebration System**:
   - Added localStorage flag `showBusinessCreatedCelebration` in `SimpleBusinessForm.tsx`
   - Enhanced Dashboard to detect and trigger starfall animation with 1-second delay
   - Integrated with existing `StarfallCelebration` component for consistent UX

2. **Navigation Refresh Enhancement**:
   - Improved Header component event listeners with dedicated `businessCreated` handler
   - Added 500ms delay to ensure database consistency before refresh
   - Enhanced `useBusinessProfile` hook with comprehensive debugging
   - Fixed timing issues between business creation and navigation state updates

**Technical Implementation**:
- **Files Modified**: `SimpleBusinessForm.tsx`, `page.tsx`, `Header.tsx`, `authGuard.ts`
- **Events System**: Improved custom event handling for real-time navigation updates
- **State Management**: Better localStorage coordination between business creation and dashboard
- **Error Handling**: Enhanced debugging and logging throughout the business detection flow

**User Experience Flow**:
1. User completes business creation form
2. Business saved → localStorage celebration flag set → `businessCreated` event dispatched → URL redirect with `businessCreated=1` parameter
3. Redirect to dashboard → Starfall animation triggers → Navigation refreshes
4. User can immediately access all main navigation features

The complete onboarding experience now works seamlessly from authentication through business creation to full platform access.

## 2025-01-17: Business Creation Pricing Modal Fix
- **Issue**: After business creation, the pricing modal wasn't showing up correctly
- **Root Cause**: URL parameter mismatch - business creation was setting `businessCreated=true` but dashboard expected `businessCreated=1`
- **Fix**: Updated `CreateBusinessClient.tsx` to use correct parameter value `businessCreated=1`
- **Result**: Pricing modal now appears correctly after business creation for new users
- **Files Modified**: `src/app/dashboard/create-business/CreateBusinessClient.tsx`
- **Testing**: Verified pricing modal appears after business creation flow

## 2025-01-17: Google Business Profile OAuth Fix
- **Issue**: Google OAuth was working but API calls were failing with "Cannot read properties of undefined (reading 'substring')", duplicate key constraint errors, 404 errors on API endpoints, and rate limiting causing OAuth flow to stall
- **Root Cause**: 
  1. `GoogleBusinessProfileClient` constructor was expecting wrong interface - trying to access `accessToken` from `GoogleBusinessProfileCredentials` which only contains OAuth app credentials
  2. Database upsert was failing due to unique constraint on `user_id` in `google_business_profiles` table
  3. API endpoints were using incorrect Google Business Profile API version (v4 instead of v1)
  4. Google Business Profile API has strict rate limits (1 request/minute) causing OAuth flow to stall during retries
- **Fix**: 
  1. Updated constructor to accept direct token credentials and fixed OAuth callback instantiation
  2. Replaced upsert with explicit check-then-insert/update logic to handle unique constraint properly
  3. Updated API configuration to use correct Google Business Profile API v1 endpoints and base URL
  4. Removed blocking API calls from OAuth callback to prevent rate limit stalls
  5. Reduced retry attempts and delays to prevent long waits
- **Result**: Google Business Profile OAuth flow now completes quickly without stalling
- **Files Modified**: 
  - `src/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient.ts`
  - `src/app/api/auth/google/callback/route.ts`
  - `src/features/social-posting/platforms/google-business-profile/api.ts`
- **Testing**: Verified OAuth flow completes successfully without stalling

## 2025-01-17: Google Business Profile Locations and Posting Functionality
- **Issue**: After OAuth connection, users couldn't post because business locations weren't being fetched and stored, and the social posting page was showing blank due to API response structure mismatches and authentication errors
- **Root Cause**: 
  1. OAuth callback was skipping API calls due to rate limits, so no locations were stored
  2. Locations API endpoint was using wrong table name (`google_business_tokens` instead of `google_business_profiles`)
  3. No way for users to manually fetch locations after connection
  4. Frontend was expecting different API response structure than what was being returned
  5. Locations API was using old `@supabase/auth-helpers-nextjs` instead of `@supabase/ssr`, causing cookie parsing errors
  6. Google Business Profile API has strict rate limits (1 request/minute) causing fetch-locations to fail
- **Fix**: 
  1. Fixed locations API endpoint to use correct table name `google_business_profiles`
  2. Updated locations API to use `@supabase/ssr` for proper cookie handling
  3. Created new `/api/social-posting/platforms/google-business-profile/fetch-locations` endpoint for on-demand location fetching
  4. Added "Fetch Business Locations" button to social posting page for connected users
  5. Updated social posting page to show location fetching option when connected but no locations available
  6. Fixed API response structure mismatches in frontend code
  7. Added localStorage fallback for connection status detection
  8. Improved rate limit handling with better user feedback and retry options
- **Result**: Users can now connect to Google Business Profile and fetch their business locations to enable posting functionality, with proper rate limit handling
- **Files Modified**: 
  - `src/app/api/social-posting/platforms/google-business-profile/locations/route.ts`
  - `src/app/api/social-posting/platforms/google-business-profile/fetch-locations/route.ts` (new)
  - `src/app/dashboard/social-posting/page.tsx`
- **Testing**: Verified OAuth connection works and users can fetch locations to enable posting

## 2025-06-30: Back Button for Multi-Step Prompt Pages
- Added back button functionality to multi-step prompt page forms
- Users can now navigate from step 2 back to step 1 to modify customer/client details
- Added back button to top right action area in edit prompt page (`[slug]/page.tsx`)
- Added back button to bottom left of step 2 in `PromptPageForm.tsx` for create mode
- Product prompt pages already had back button correctly implemented
- Improves user experience by allowing easy navigation between steps
- See `src/app/dashboard/edit-prompt-page/` for details.

## 2025-06-30: Authentication Error Fixes
- Fixed "Auth session missing" errors that were preventing prompt pages from loading
- Updated `getUserOrMock` and `getSessionOrMock` functions in `src/utils/supabase.ts` to handle authentication errors gracefully
- Functions now return null user/session instead of throwing errors when no auth session exists
- Prompt pages now work properly for both authenticated and unauthenticated users
- Resolves blank page issue when visiting saved prompt pages
- Improves overall application stability and user experience
- See `src/utils/supabase.ts` for implementation details.

## 2025-06-30: Migration Enforcement System
- **Automatic Migration Checks:** Added `predev` hook that runs before `npm run dev`
- **Migration Status:** Shows clear status messages: "All migrations applied" or lists missing migrations
- **Auto-Application:** Automatically applies missing migrations when found
- **Manual Commands:** Added `npm run migrations:check` and `npm run migrations:apply`
- **Error Handling:** Graceful handling of database connection issues and CLI problems
- **Color-coded Output:** Green for success, yellow for warnings, red for errors
- **Prevents Schema Issues:** Ensures database schema is always up-to-date
- **Development Integration:** Runs automatically before development server starts
- See `scripts/check-migrations.js` for implementation details.

## 2025-06-30: Popup Conflict Modal Improvements
- Updated popup conflict modal message to be more user-friendly and clear
- Changed message to: "You can't enable Emoji Sentiment and Personalized note pop-up at the same time because that's pop-ups on top of pop-ups—which would be weird."
- Added conflict modal to `ServicePromptPageForm.tsx` (was missing)
- Conflict modal now appears in both `PromptPageForm.tsx` and `ServicePromptPageForm.tsx`
- Users get clear feedback when trying to enable conflicting popup features
- Improves user experience by explaining why certain features can't be enabled together
- See `src/app/components/PromptPageForm.tsx` and `src/app/dashboard/edit-prompt-page/[slug]/ServicePromptPageForm.tsx` for details.

## 2025-06-30
- Updated `prompt_page_type` enum in the database and codebase.
- Allowed values: 'universal', 'product', 'service', 'photo', 'event', 'video', 'employee'.
- Removed legacy values: 'custom', 'experience'.
- Updated all prompt page creation, filtering, and UI logic to use the new enum values.

---

# Current System Status & Architecture Summary

## **Authentication System** ✅ **WORKING**
- **Status**: Fully functional after July 2025 debugging session
- **Sign-in/Sign-up**: Working with email/password authentication
- **Session Management**: Persistent sessions with proper user identification
- **Email Verification**: Configured with local Inbucket testing
- **Security**: Middleware protection with proper auth route allowlisting

## **AI Integration** ✅ **COMPLETE**
- **Status**: Comprehensive AI integration fully implemented with UI
- **Review Response Generation**: AI-powered responses to customer reviews with sentiment analysis
- **Service Description Generation**: SEO-optimized descriptions in multiple lengths
- **Business Description Analysis**: AI analysis with SEO scoring and recommendations
- **Google Business Profile Integration**: Full integration with post improvement and content optimization
- **User Interface**: Professional dashboard with dedicated AI tools tabs

## **Database Architecture** ✅ **STABLE**
- **Schema**: 84 migrations applied and up to date
- **Multi-User Support**: Account-based architecture ready for team features
- **RLS Policies**: Comprehensive Row Level Security implementation
- **Service Keys**: Proper privileged operations with Supabase service key

## **Development Environment** ✅ **CONFIGURED**
- **Local Supabase**: Running on standard ports (54321, 54322, 54323, 54324)
- **Development Server**: Configured for port 3002 with fallback handling
- **Email Testing**: Inbucket available at http://127.0.0.1:54324
- **Debug Tools**: Session reset utility and comprehensive logging

## **User Onboarding** ✅ **COMPLETE**
- **Signup Flow**: Email → Account Creation → Business Setup → Plan Selection
- **Welcome Experience**: Progressive onboarding with celebration animations
- **Task Tracking**: Database-backed onboarding task completion system
- **Auto-signin**: Streamlined local development experience

## **Widget System** ✅ **FUNCTIONAL**
- **Multi-Widget**: Responsive carousel with CSS Grid fallback
- **Photo Widget**: Image-based review collection
- **Single Widget**: Simple review submission form
- **Embedding**: Vanilla JS widgets for external website integration

## **Admin Features** ✅ **IMPLEMENTED**
- **User Management**: Complete user deletion with data cleanup
- **Analytics**: Admin dashboard with usage statistics
- **Team Management**: Account-based team invitation and management
- **Security**: Admin-only routes with proper privilege checking

## **Current Development Focus**
1. **Performance Optimization**: Address multiple GoTrueClient instance creation
2. **Widget Enhancement**: Continued refinement of responsive design
3. **Feature Development**: Building on stable authentication foundation
4. **Testing**: Comprehensive testing of all authentication flows

## **Known Technical Debt**
- **GoTrueClient Instances**: Multiple instances still being created (optimization opportunity)
- **Session Storage**: Periodic cleanup could improve performance
- **Error Recovery**: Additional fallback mechanisms for edge cases

## **Deployment Readiness**
- **Local Development**: Fully functional and stable
- **Authentication**: Production-ready with proper security measures
- **Database**: Schema complete with proper migrations
- **Widget System**: Ready for external embedding

---

**Documentation Last Updated**: July 2, 2025 - After authentication system debugging and resolution

## 🔧 **Major Supabase Client Modernization (January 2025)**

### **Legacy Pattern Elimination**
- **Issue**: 70+ files using legacy `supabase` proxy pattern
- **Problem**: Multiple client instances, session conflicts, warnings
- **Solution**: Comprehensive modernization to `createClient()` pattern
- **Result**: Single client instance, stable authentication, no warnings

### **Files Modernized**
- ✅ **Core utilities**: `admin.ts`, `sessionUtils.ts`, `supabaseClient.ts`
- ✅ **Dashboard components**: All layout and page components
- ✅ **Authentication flows**: Sign-in, sign-up, callbacks
- ✅ **Admin interfaces**: All admin pages and utilities
- ✅ **Widget system**: All widget components and hooks
- ✅ **API routes**: Generate reviews, track events
- ✅ **Total**: 54 files automatically updated

### **Architecture Improvements**
- **Singleton Pattern**: Proper client instance management
- **Memory Optimization**: No multiple client instances
- **Session Stability**: Consistent authentication state
- **Error Reduction**: Eliminated proxy-related issues
- **Performance**: Faster client creation and access

### **Testing Validation**
- **Playwright Tests**: All authentication flows pass
- **Infinite Loading**: Completely resolved
- **Middleware Retries**: No longer needed
- **Rapid Navigation**: Smooth and stable
- **Session Timing**: Optimized and reliable

This modernization resolves all remaining authentication issues and establishes a solid foundation for the application's authentication system.

# PromptReviews - Get More Reviews

## Recent Updates

### Authentication & Onboarding Flow Fix (January 2025)

✅ **FIXED**: Infinite loading issue during login
- Fixed dashboard layout loading state management
- Added comprehensive logging for authentication and onboarding flow debugging
- Prevent premature loading state changes during onboarding redirects
- Proper flow control ensures smooth user experience without infinite spinners

✅ **FIXED**: Users getting stuck on account page without proper onboarding
- Added centralized onboarding flow logic to dashboard layout
- Users without businesses are automatically redirected to create-business page
- Users without plans are automatically redirected to plan selection page
- Prevents users from accessing dashboard pages until onboarding is complete
- Single implementation point eliminates code duplication

✅ **FIXED**: Authentication login issues  
- Fixed sign-in page to use direct Supabase client authentication
- Removed problematic API route causing session cookie issues
- Authentication now properly establishes session cookies for persistent login
- Users can now successfully log in and access the application