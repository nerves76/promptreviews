# Modular Multi-Widget System

A responsive, modular review carousel widget that integrates seamlessly with the PromptReviews dashboard system.

## Features

- **Responsive Design**: Automatically adjusts to different screen sizes
- **Modular Architecture**: Split into maintainable modules
- **Dashboard Integration**: Works with existing design system
- **Multiple Activation Methods**: Auto-activation, manual activation, and dynamic loading
- **Design Customization**: Full control over colors, borders, shadows, and typography
- **Carousel Navigation**: Smooth sliding with pagination dots and arrow controls

## Architecture

The widget is split into modular components:

```
widget-embed-auto.js      # Main loader and auto-activation
widget-utils.js          # Utility functions (stars, dates, etc.)
widget-styles.js         # CSS styles and hover effects
widget-cards.js          # Review card creation and styling
widget-carousel.js       # Carousel logic and navigation
```

## Integration with Dashboard

The widget integrates with the existing PromptReviews dashboard system:

### Design System
All styling is controlled by the `DesignState` interface:
- `bgColor`, `textColor`, `accentColor` - Color scheme
- `borderColor`, `borderWidth`, `borderRadius` - Border styling
- `shadow`, `shadowIntensity`, `shadowColor` - Shadow effects
- `font`, `lineSpacing` - Typography
- `showQuotes`, `showRelativeDate` - Display options
- `bgOpacity` - Background transparency

### API Integration
The widget can fetch data from the dashboard API:
- Endpoint: `/api/widgets/[id]`
- Returns: Widget data including design settings and reviews
- Auto-activation: Automatically fetches data when widget ID is provided

## Embedding Methods

### Method 1: Auto-Activation with API (Recommended)

```html
<!-- Load the auto-activating script -->
<script src="/widgets/multi/widget-embed-auto.js"></script>

<!-- Add widget container with widget ID -->
<div data-prompt-reviews-widget="your-widget-id"></div>
```

The widget will automatically:
1. Find containers with `data-prompt-reviews-widget`
2. Fetch widget data from `/api/widgets/your-widget-id`
3. Initialize the widget with the fetched data

### Method 2: Manual Activation with Data

```html
<!-- Load the auto-activating script -->
<script src="/widgets/multi/widget-embed-auto.js"></script>

<!-- Add widget container with data -->
<div data-prompt-reviews-data='{"reviews":[...], "design":{...}, "businessSlug":"test"}'></div>

<!-- Or initialize manually -->
<script>
window.PromptReviews.renderMultiWidget(container, widgetData);
</script>
```

### Method 3: Dynamic Loading

```html
<!-- Load the auto-activating script -->
<script src="/widgets/multi/widget-embed-auto.js"></script>

<script>
// Create container dynamically
const container = document.createElement('div');
container.setAttribute('data-prompt-reviews-widget', 'dynamic-widget-id');
document.body.appendChild(container);

// Widget will auto-initialize
</script>
```

## Design Customization

The widget respects all design settings from the dashboard:

### Colors
- `bgColor`: Background color for cards and controls
- `textColor`: Main text color
- `accentColor`: Accent color for buttons and highlights
- `nameTextColor`: Reviewer name color
- `roleTextColor`: Reviewer role color
- `borderColor`: Border color

### Layout
- `borderWidth`: Border thickness
- `borderRadius`: Corner roundness
- `lineSpacing`: Text line height
- `attributionFontSize`: Name/role font size

### Effects
- `shadow`: Enable/disable inner shadow
- `shadowIntensity`: Shadow opacity (0-1)
- `shadowColor`: Shadow color
- `bgOpacity`: Background transparency (0-1)

### Display Options
- `showQuotes`: Show quotation marks
- `showRelativeDate`: Show "X days ago"
- `showSubmitReviewButton`: Show submit button
- `border`: Show/hide borders
- `font`: Font family

## Responsive Behavior

The widget automatically adjusts based on screen size:

- **Mobile (< 768px)**: Single card view, smaller controls
- **Tablet (768px - 1024px)**: 2-3 cards visible
- **Desktop (> 1024px)**: 3-4 cards visible

Navigation controls are always visible and positioned at the bottom of the carousel.

## Testing

Use the provided test pages to verify functionality:

- `test-activation-methods.html` - Tests all three embedding methods
- `test-integration.html` - Tests design system integration
- `test-responsive.html` - Tests responsive behavior

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance

- Modular loading reduces initial bundle size
- Lazy initialization prevents blocking page load
- Efficient DOM manipulation
- Minimal reflows during navigation

## Troubleshooting

### Widget Not Loading
1. Check browser console for errors
2. Verify script path is correct
3. Ensure container has proper data attributes
4. Check API endpoint availability

### Design Not Applying
1. Verify design object structure matches `DesignState`
2. Check color values are valid hex codes
3. Ensure all required properties are present

### Responsive Issues
1. Check container width constraints
2. Verify CSS is not being overridden
3. Test on actual devices, not just dev tools

## Development

To modify the widget:

1. Edit the appropriate module file
2. Test changes using the test pages
3. Verify integration with dashboard
4. Update documentation if needed

The modular architecture makes it easy to:
- Add new features
- Modify styling
- Fix bugs
- Optimize performance

## API Reference

### `window.PromptReviews.renderMultiWidget(container, data)`
Renders a widget in the specified container.

**Parameters:**
- `container` (HTMLElement): The container element
- `data` (Object): Widget data object

**Data Object Structure:**
```javascript
{
  reviews: Array<Review>,
  design: DesignState,
  businessSlug: string
}
```

### `window.PromptReviews.initializeWidgets()`
Manually triggers auto-initialization of all widgets on the page.

### Auto-Activation
Widgets with `data-prompt-reviews-widget` attributes are automatically initialized when the script loads. 