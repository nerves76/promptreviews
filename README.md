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

Last updated: March 19, 2024 