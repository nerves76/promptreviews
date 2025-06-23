# Widget Dashboard - Complete Documentation

## Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Widget Management](#widget-management)
3. [Styling System](#styling-system)
4. [Review Management](#review-management)
5. [Widget Types](#widget-types)
6. [Embedding System](#embedding-system)
7. [API Integration](#api-integration)
8. [User Interface Features](#user-interface-features)

---

## Dashboard Overview

The Widget Dashboard (`/dashboard/widget`) is the central hub for creating, customizing, and managing review widgets. It provides a comprehensive interface for businesses to display customer reviews on their websites.

### Key Features
- **Live Preview**: Real-time widget preview with instant styling updates
- **Widget Management**: Create, edit, and delete multiple widgets
- **Style Customization**: Extensive theming options for widget appearance
- **Review Management**: Select and organize which reviews to display
- **Embed Code Generation**: Easy copy-paste embedding for websites
- **Multi-Widget Support**: Manage different widget types (multi, single, photo)

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Widget Preview                           │
│  [Live widget display with current styling]                │
│  [Edit Style] [Manage Reviews] [Copy Embed Code]           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Your Widgets                            │
│  [Widget List] [New Widget Button]                        │
│  [Widget cards with preview and actions]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Widget Management

### Creating Widgets
Widgets can be created through the dashboard interface:

1. **New Widget Button**: Click "New Widget" to create a new widget
2. **Widget Type Selection**: Choose between multi, single, or photo widgets
3. **Initial Configuration**: Set basic settings and styling
4. **Review Selection**: Choose which reviews to display

### Widget Properties
Each widget has the following properties:

```typescript
interface Widget {
  id: string;                    // Unique widget identifier
  name: string;                  // Display name for the widget
  widget_type: 'multi' | 'single' | 'photo';  // Widget type
  theme: DesignState;            // Styling configuration
  reviews: Review[];             // Selected reviews to display
  created_at: string;            // Creation timestamp
  updated_at: string;            // Last modification timestamp
}
```

### Widget Actions
- **Edit Style**: Open styling modal for customization
- **Manage Reviews**: Select and organize reviews
- **Copy Embed Code**: Get HTML code for website embedding
- **Delete Widget**: Remove widget from dashboard
- **Rename Widget**: Change widget display name

---

## Styling System

The widget dashboard provides extensive styling options through the Style Modal. All styling changes are applied in real-time to the preview.

### Design State Structure
```typescript
interface DesignState {
  // Colors
  bgColor: string;               // Background color
  textColor: string;             // Main text color
  accentColor: string;           // Accent/brand color
  nameTextColor: string;         // Reviewer name color
  roleTextColor: string;         // Reviewer role color
  borderColor: string;           // Border color
  
  // Typography
  font: string;                  // Font family
  attributionFontSize: number;   // Font size for attribution
  lineSpacing: number;           // Line height multiplier
  
  // Layout & Spacing
  borderRadius: number;          // Corner radius in pixels
  borderWidth: number;           // Border thickness
  width: number;                 // Widget width
  
  // Effects
  shadow: boolean;               // Enable shadow/vignette
  shadowIntensity: number;       // Shadow opacity (0-1)
  shadowColor: string;           // Shadow color
  bgOpacity: number;             // Background transparency (0-1)
  
  // Behavior
  autoAdvance: boolean;          // Auto-advance carousel
  slideshowSpeed: number;        // Auto-advance speed in seconds
  
  // Display Options
  showQuotes: boolean;           // Show quotation marks
  showRelativeDate: boolean;     // Show relative dates
  showSubmitReviewButton: boolean; // Show review submission button
}
```

### Styling Categories

#### 1. Typography Settings
- **Font Family**: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins
- **Text Colors**: Main text, reviewer names, roles
- **Font Sizes**: Attribution text size
- **Line Spacing**: Text line height multiplier

#### 2. Color Customization
- **Background Color**: Widget card background
- **Text Color**: Main review text color
- **Accent Color**: Buttons, links, and highlights
- **Name Color**: Reviewer name display color
- **Role Color**: Reviewer role/title color
- **Border Color**: Card border color

#### 3. Layout & Spacing
- **Border Radius**: Corner roundness (0-50px)
- **Border Width**: Border thickness (1-10px)
- **Background Opacity**: Transparency level (0-100%)
- **Widget Width**: Overall widget width

#### 4. Visual Effects
- **Shadow/Vignette**: Inner shadow effect
- **Shadow Intensity**: Shadow opacity (0-100%)
- **Shadow Color**: Shadow color customization
- **Border Display**: Show/hide card borders

#### 5. Behavior Settings
- **Auto-Advance**: Automatic carousel rotation
- **Slideshow Speed**: Auto-advance timing (1-10 seconds)
- **Display Options**: Quotes, dates, submit button

### Default Design Values
```typescript
const DEFAULT_DESIGN: DesignState = {
  bgColor: '#FDFBF2',
  textColor: '#22223b',
  accentColor: 'slateblue',
  nameTextColor: '#1a237e',
  roleTextColor: '#6b7280',
  attributionFontSize: 15,
  borderRadius: 16,
  shadow: true,
  bgOpacity: 1,
  autoAdvance: false,
  slideshowSpeed: 4,
  border: true,
  borderWidth: 2,
  lineSpacing: 1.4,
  showQuotes: false,
  showRelativeDate: false,
  showSubmitReviewButton: true,
  font: 'Inter',
  // ... other defaults
};
```

---

## Review Management

The Review Management Modal provides comprehensive control over which reviews appear in widgets and how they're displayed.

### Review Data Structure
```typescript
interface Review {
  id: string;                    // Unique review identifier
  first_name?: string;           // Reviewer first name
  last_name?: string;            // Reviewer last name
  reviewer_role?: string;        // Reviewer role/title
  review_content: string;        // Review text content
  star_rating: number;           // Star rating (1-5)
  photo_url?: string;            // Optional photo URL
  created_at: string;            // Review creation date
  platform?: string;             // Review platform (Google, Yelp, etc.)
}
```

### Review Management Features

#### 1. Review Selection
- **Available Reviews**: All reviews from `review_submissions` table
- **Selected Reviews**: Reviews assigned to specific widget
- **Toggle Selection**: Add/remove reviews from widget
- **Maximum Reviews**: Up to 8 reviews per widget

#### 2. Review Editing
- **Content Editing**: Modify review text (250 word limit)
- **Name Editing**: Change reviewer names
- **Role Editing**: Update reviewer roles/titles
- **Rating Editing**: Adjust star ratings
- **Photo Upload**: Add photos to reviews

#### 3. Review Organization
- **Order Management**: Drag-and-drop reordering
- **Sorting Options**: Recent, alphabetical, rating
- **Search & Filter**: Find specific reviews
- **Pagination**: Navigate large review sets

#### 4. Custom Reviews
- **Add Custom Reviews**: Create new reviews manually
- **Custom Content**: Write custom review text
- **Custom Names**: Set reviewer names
- **Custom Ratings**: Assign star ratings

### Review Management Workflow

#### Step 1: Open Review Modal
```javascript
// Click "Manage Reviews" button
const handleManageReviews = () => {
  setShowReviewModal(true);
};
```

#### Step 2: Load Available Reviews
```javascript
// Fetch all reviews from database
const { data: reviews } = await supabase
  .from('review_submissions')
  .select('*')
  .order('created_at', { ascending: false });
```

#### Step 3: Load Selected Reviews
```javascript
// Fetch reviews assigned to this widget
const { data: widgetReviews } = await supabase
  .from('widget_reviews')
  .select('*')
  .eq('widget_id', widgetId)
  .order('order_index', { ascending: true });
```

#### Step 4: Edit and Save
```javascript
// Save changes to widget_reviews table
await supabase
  .from('widget_reviews')
  .upsert(updatedReviews);
```

### Review Limits and Constraints
- **Maximum Reviews**: 8 reviews per widget
- **Word Limit**: 250 words per review
- **Photo Size**: Optimized for web display
- **Character Limits**: Names and roles have reasonable limits

---

## Widget Types

### 1. Multi Widget
**Purpose**: Display multiple reviews in a carousel format
**Best For**: Showcasing variety of customer feedback
**Features**:
- Carousel navigation (prev/next buttons)
- Dot indicators
- Auto-advance capability
- Responsive design (3/2/1 cards per view)

### 2. Single Widget
**Purpose**: Display one prominent review at a time
**Best For**: Highlighting specific testimonials
**Features**:
- Large, prominent review card
- Simple navigation
- Focus on individual testimonials
- Clean, minimal design

### 3. Photo Widget
**Purpose**: Display photo-based testimonials
**Best For**: Visual testimonials with customer photos
**Features**:
- Photo integration
- Review text overlay
- Photo upload capability
- Visual emphasis

### Widget Type Selection
```javascript
// Widget type determines component and behavior
const WIDGET_COMPONENTS = {
  multi: MultiWidget,
  single: SingleWidget,
  photo: PhotoWidget,
};

// Auto-select appropriate component
const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type];
```

---

## Embedding System

### Embed Code Generation
The dashboard automatically generates embed code for each widget:

```html
<!-- Multi Widget -->
<script src="https://yourdomain.com/widgets/multi/widget-embed.min.js"></script>
<div id="promptreviews-multi-widget" data-widget-id="WIDGET_ID"></div>

<!-- Single Widget -->
<script src="https://yourdomain.com/widgets/single/widget-embed.min.js"></script>
<div id="promptreviews-single-widget" data-widget-id="WIDGET_ID"></div>

<!-- Photo Widget -->
<script src="https://yourdomain.com/widgets/photo/widget-embed.min.js"></script>
<div id="promptreviews-photo-widget" data-widget-id="WIDGET_ID"></div>
```

### Embed Code Features
- **One-Click Copy**: Copy embed code to clipboard
- **Widget-Specific**: Different code for each widget type
- **Minified Scripts**: Optimized for production use
- **Async Loading**: Non-blocking script loading

### Embedding Process
1. **Select Widget**: Choose widget from dashboard
2. **Copy Code**: Click "Copy Embed Code" button
3. **Paste on Website**: Insert code into website HTML
4. **Widget Loads**: Widget automatically initializes

---

## API Integration

### Widget Data API
```typescript
// Fetch widget data
GET /api/widgets/{widgetId}

Response:
{
  id: string;
  name: string;
  widget_type: string;
  theme: DesignState;
  reviews: Review[];
  businessSlug: string;
}
```

### Review Management API
```typescript
// Widget reviews table structure
interface WidgetReview {
  id: string;
  widget_id: string;
  review_id: string;
  order_index: number;
  review_content: string;
  first_name: string;
  last_name: string;
  reviewer_role: string;
  star_rating: number;
  photo_url?: string;
  created_at: string;
}
```

### Database Tables

#### Widgets Table
```sql
CREATE TABLE widgets (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  theme JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Widget Reviews Table
```sql
CREATE TABLE widget_reviews (
  id UUID PRIMARY KEY,
  widget_id UUID REFERENCES widgets(id),
  review_id UUID REFERENCES review_submissions(id),
  order_index INTEGER,
  review_content TEXT,
  first_name TEXT,
  last_name TEXT,
  reviewer_role TEXT,
  star_rating INTEGER,
  photo_url TEXT,
  created_at TIMESTAMP
);
```

---

## User Interface Features

### Real-Time Preview
- **Live Updates**: Style changes apply immediately
- **Responsive Preview**: Shows how widget looks on different devices
- **Interactive Elements**: Test navigation and interactions
- **Visual Feedback**: See styling changes in real-time

### Modal System
- **Draggable Modals**: Move modals around screen
- **Modal Stacking**: Multiple modals can be open
- **Keyboard Navigation**: ESC to close, Enter to save
- **Focus Management**: Proper focus trapping

### Action Buttons
- **Edit Style**: Opens styling modal
- **Manage Reviews**: Opens review management modal
- **Copy Embed Code**: Copies embed code to clipboard
- **New Widget**: Creates new widget

### Widget List
- **Widget Cards**: Visual representation of each widget
- **Quick Actions**: Edit, delete, copy embed code
- **Widget Preview**: Thumbnail of widget appearance
- **Status Indicators**: Active/inactive states

### Error Handling
- **Loading States**: Show loading indicators
- **Error Messages**: Clear error communication
- **Fallback Content**: Graceful degradation
- **Validation**: Input validation and feedback

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **Color Contrast**: WCAG compliant color choices
- **Focus Indicators**: Clear focus management

---

## Best Practices

### Widget Creation
1. **Choose Appropriate Type**: Select widget type based on use case
2. **Set Meaningful Names**: Use descriptive widget names
3. **Test Responsiveness**: Verify widget works on all devices
4. **Optimize Performance**: Keep review count reasonable

### Styling Guidelines
1. **Brand Consistency**: Match website branding
2. **Readability**: Ensure sufficient color contrast
3. **Mobile Optimization**: Test on mobile devices
4. **Performance**: Avoid overly complex styling

### Review Management
1. **Quality Over Quantity**: Select best reviews
2. **Diversity**: Include variety of customer types
3. **Relevance**: Choose reviews relevant to audience
4. **Regular Updates**: Keep reviews fresh and current

### Embedding
1. **Test Thoroughly**: Test widget on target website
2. **Monitor Performance**: Watch for loading issues
3. **Update Regularly**: Keep widget content current
4. **Backup Strategy**: Have fallback content ready

---

## Troubleshooting

### Common Issues

#### Widget Not Loading
- Check embed code is correct
- Verify widget ID exists
- Check browser console for errors
- Ensure script URL is accessible

#### Styling Not Applied
- Verify CSS is being injected
- Check for CSS conflicts
- Test in different browsers
- Clear browser cache

#### Reviews Not Displaying
- Check review selection in dashboard
- Verify review data is complete
- Check API responses
- Test with different reviews

#### Performance Issues
- Reduce number of reviews
- Optimize images
- Check network performance
- Monitor resource usage

### Debug Tools
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API requests
- **Elements Tab**: Inspect widget structure
- **Performance Tab**: Monitor loading times

---

## Conclusion

The Widget Dashboard provides a comprehensive solution for creating and managing review widgets. With its extensive styling options, review management capabilities, and user-friendly interface, businesses can easily create professional review displays that match their branding and showcase their customer feedback effectively.

The system is designed to be flexible, performant, and easy to use, while providing the customization options needed for professional website integration. 