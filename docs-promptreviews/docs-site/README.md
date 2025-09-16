# Prompt Reviews Documentation Site

This is the documentation site for Prompt Reviews, built with Next.js and designed to integrate with the main application's help system.

## Features

- **Search API**: Provides article search functionality for the main app's help system
- **Article Association**: Maps app pages to relevant documentation articles
- **Context-Aware Recommendations**: Suggests articles based on user's current page and behavior
- **Comprehensive Strategies Section**: 6 detailed review collection strategies with proven techniques
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful gradient backgrounds and glassmorphism design

## API Endpoints

### Search API (`/api/search`)

The search API provides article search functionality for the main application's help system.

**POST** `/api/search`
- **Purpose**: Search articles based on keywords and context
- **Request Body**:
  ```json
  {
    "keywords": ["prompt-pages", "create"],
    "path": "/dashboard/create-prompt-page",
    "limit": 6,
    "includeMetadata": true
  }
  ```
- **Response**:
  ```json
  {
    "tutorials": [...],
    "articles": [...],
    "total": 6,
    "keywords": ["prompt-pages", "create"],
    "path": "/dashboard/create-prompt-page",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

**GET** `/api/search`
- **Query Parameters**:
  - `q`: Search query string
  - `category`: Filter by article category
- **Example**: `/api/search?q=prompt pages&category=getting-started`

## Article Metadata

Each documentation page includes metadata for better search and association:

```typescript
export const metadata = {
  title: 'Getting Started',
  description: 'Quick start guide for new users',
  helpContext: {
    appPages: ['/dashboard', '/dashboard/business-profile'],
    keywords: ['getting-started', 'setup', 'overview'],
    category: 'getting-started',
    priority: 'high'
  }
}
```

## Integration with Main App

The main application connects to this docs site through:

1. **Help Bubble**: Floating help button in bottom-right corner
2. **Context Mapping**: Maps app routes to relevant docs articles
3. **Behavioral Tracking**: Tracks user actions for better recommendations
4. **Smart Recommendations**: Suggests articles based on current page and user behavior

## Development

### Running Locally

```bash
cd docs-promptreviews/docs-site
npm install
npm run dev
```

### Environment Variables

Add to your `.env.local`:
```
# Help System Configuration
DOCS_API_URL=https://docs.promptreviews.app/api/search
```

### Adding New Articles

1. Create a new page in `src/app/`
2. Add metadata with help context
3. Update the search API metadata array
4. Test the integration with the main app

## Strategies Section

The documentation includes a comprehensive **Strategies Section** with 6 proven review collection techniques:

### 1. The Double-Dip Strategy
- **Purpose**: Import existing Google reviews and turn them into prompt pages to collect reviews on other platforms
- **Key Features**: 
  - Step-by-step implementation guide
  - Real examples and best practices
  - Advanced Triple-Dip and Quadruple-Dip techniques
  - Humor and personality with ice cream metaphors
- **File**: `/strategies/double-dip`

### 2. Leverage Reciprocity Strategy
- **Purpose**: Use Dr. Cialdini's psychology of reciprocity to increase review response rates
- **Key Features**:
  - Scientific backing with Dr. Cialdini's research
  - Win-win philosophy emphasizing genuine relationships
  - Real examples from restaurants and service businesses
  - Implementation steps and best practices
- **File**: `/strategies/reciprocity`

### 3. Personal Outreach Strategy
- **Purpose**: Why one-on-one connections are more effective than mass requests for building trust and loyalty
- **Key Features**:
  - Comparison of personal vs. mass marketing approaches
  - Implementation guide for building personal connections
  - Success story from a dental practice
  - Best practices for authentic relationships
- **File**: `/strategies/personal-outreach`

### 4. Non-AI Strategies
- **Purpose**: Use kickstarters, recent reviews, and personalized templates to help customers write better reviews
- **Key Features**:
  - Three main strategies: Review Kickstarters, Recent Examples, Personalized Templates
  - Emphasis on bullet points as valuable alternatives
  - Human-centered approaches without AI dependency
  - Best practices for implementation
- **File**: `/strategies/non-ai-strategies`

### 5. Novelty Factor Strategy
- **Purpose**: Leverage the unique experience of AI-powered review writing and delightful interactions
- **Key Features**:
  - Highlighting unique Prompt Reviews features (AI assistance, star fall effects)
  - Marketing strategies for competitive advantage
  - Social sharing potential and word-of-mouth benefits
  - Success story from a tech-savvy restaurant
- **File**: `/strategies/novelty`

### 6. Reviews on the Fly Strategy
- **Purpose**: Get reviews in person by highlighting the speed and ease of the review process
- **Key Features**:
  - Perfect timing identification and implementation
  - Mobile-ready approach with immediate collection
  - Real examples from restaurants and service businesses
  - Success story from a mobile hair salon
- **File**: `/strategies/reviews-on-fly`

### Strategy Features
- **SEO Optimized**: Each strategy includes comprehensive metadata and JSON-LD structured data
- **Interactive Navigation**: Step-by-step navigation between strategies with progress indicators
- **Real Examples**: Practical examples and success stories from real businesses
- **Best Practices**: Actionable tips and pro tips throughout each strategy
- **Brand Voice**: Consistent with Prompt Reviews and Prompty brand personality

## File Structure
docs-site/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── search/
│   │   │       └── route.ts          # Search API endpoint
│   │   ├── getting-started/
│   │   ├── prompt-pages/
│   │   │   ├── page.tsx              # Main prompt pages overview
│   │   │   ├── types/
│   │   │   │   ├── page.tsx          # All prompt page types
│   │   │   │   └── service/
│   │   │   │       └── page.tsx      # Service prompt pages guide
│   │   │   └── features/
│   │   │       └── page.tsx          # All prompt page features
│   │   ├── ai-reviews/
│   │   ├── contacts/
│   │   ├── troubleshooting/
│   │   └── faq/
│   └── components/
└── README.md
```

## Design System

### Styling Approach

The documentation site uses a modern design system with:

- **Gradient Backgrounds**: Beautiful indigo-to-purple-to-fuchsia gradients
- **Glassmorphism**: Semi-transparent backgrounds with backdrop blur
- **Consistent Spacing**: Tailwind CSS utility classes for spacing
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Color Palette

- **Primary**: Slate blue (`#6366F1`) - Prompt Reviews brand color
- **Background**: Gradient from indigo-900 to purple-900 to fuchsia-900
- **Text**: White with opacity variations for hierarchy
- **Accents**: Blue, green, purple for different content types

### Component Patterns

- **Cards**: Semi-transparent backgrounds with backdrop blur
- **Headers**: Gradient backgrounds with white text
- **Navigation**: Hover effects with border color changes
- **Tables**: Semi-transparent backgrounds with proper contrast

## Prompt Pages Documentation

### Structure

The prompt pages documentation is organized into three main sections:

1. **Main Overview** (`/prompt-pages`)
   - Introduction to prompt pages
   - Quick navigation to types and features
   - Getting started guide

2. **Types** (`/prompt-pages/types`)
   - Service Prompt Pages
   - Product Prompt Pages
   - Photo Prompt Pages
   - Video Prompt Pages
   - Universal Prompt Pages
   - Comparison table

3. **Features** (`/prompt-pages/features`)
   - Emoji Sentiment Flow
   - Prompty AI
   - QR Code Generation
   - Customization Options
   - Analytics & Insights
   - Multi-Platform Sharing
   - Mobile Optimization
   - Security & Privacy
   - Platform Integration

### Content Guidelines

- **Comprehensive Coverage**: Every prompt page type and feature documented
- **Real Examples**: Practical use cases and business examples
- **Step-by-Step Guides**: Clear instructions for implementation
- **Best Practices**: Tips for optimal results
- **SEO Optimization**: Proper metadata and structured data

## Recent Updates

- **2024-01-XX**: Added comprehensive prompt page documentation structure
- **2024-01-XX**: Implemented modern gradient design system
- **2024-01-XX**: Created individual pages for each prompt page type
- **2024-01-XX**: Added detailed feature documentation
- **2024-01-XX**: Updated search API with new content
- **2024-01-XX**: Added article association system