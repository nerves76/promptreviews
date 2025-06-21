# PromptReviews Widget System

A modern, customizable review widget system built with Next.js, TypeScript, and Tailwind CSS.

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
        └── widget-embed.js                 # Client-side widget bundle
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

### ConsoleLogger Fixes
- **Fixed setState during render error** by implementing a queue system for log processing
- **Prevented state updates during initial render** using mounted flag
- **Added deferred processing** to avoid React render cycle conflicts
- **Improved error handling** for console method interception

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

3. **Fixed ConsoleLogger** in `src/app/components/ConsoleLogger.tsx`:
   - Implemented queue system for pending logs
   - Added mounted flag to prevent initial render captures
   - Used setTimeout for deferred state updates
   - Improved type safety and error handling

4. **Created test pages**:
   - `public/widgets/multi/test-responsive.html` for isolated widget testing
   - `src/app/test-console/page.tsx` for ConsoleLogger testing
   - `public/widgets/multi/test-submit-button.html` for submit button visibility testing

5. **Fixed submit review button visibility** in `public/widgets/multi/multi-widget.css`:
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