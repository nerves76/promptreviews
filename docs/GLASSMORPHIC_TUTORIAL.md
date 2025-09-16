# Glassmorphic Design Tutorial for PromptReviews

## What is Glassmorphism?

Glassmorphism is a modern design trend that creates a frosted glass effect, making elements appear semi-transparent with a blurred background showing through. This guide will help you create beautiful glassmorphic effects for your review widgets using PromptReviews' built-in style settings.

## Key Components of Glassmorphic Design

To achieve the glassmorphic effect in PromptReviews, you'll combine these settings found in your widget's Style Form:

1. **Background Opacity** (Card Appearance section): 20-70%
2. **Backdrop Blur** (Backdrop Blur section): 8-12px
3. **Border** (Border section): Enabled with 0.5-1px width
4. **Border Transparency** (Border section): 30-50%
5. **Inner Shadow** (enabled by default for frosty effect)

## Step-by-Step Setup

### 1. Access Your Widget Style Settings

Navigate to **Dashboard > Widgets** and click the edit button on your widget. The Style Form contains all the settings you need.

### 2. Configure Basic Glassmorphic Settings

#### Card Appearance Section:
- **Background Color**: Keep white (#FFFFFF) for best results
- **Background Opacity**: Set to 30% (0.3) for optimal transparency
- **Corner Roundness**: 16px (default) works well

#### Backdrop Blur Section:
- **Blur Intensity**: Set to 10px for a balanced frosted effect
  - Lower values (0-5px): Subtle blur, more background visibility
  - Medium values (8-12px): Ideal glassmorphic effect
  - Higher values (15-20px): Heavy blur, more opaque appearance

#### Border Section:
- **Show border**: Check this box
- **Border Color**: White (#FFFFFF)
- **Border Width**: 0.5px for subtle, or 1px for more defined edges
- **Border Transparency**: 30% for a soft, ethereal border

## Optimizing for Different Backgrounds

### Light Backgrounds

For websites with light/white backgrounds:

**Recommended Settings:**
- Background Color: #FFFFFF
- Background Opacity: 20-30%
- Text Color: #000000 or #222222
- Name Text Color: #1a237e (dark blue)
- Border Color: #000000
- Border Opacity: 10-20%
- Backdrop Blur: 8-10px

**Why it works:** The lower opacity and darker text create contrast against light backgrounds while maintaining readability.

### Dark Backgrounds

For websites with dark/black backgrounds:

**Recommended Settings:**
- Background Color: #FFFFFF
- Background Opacity: 10-20%
- Text Color: #FFFFFF
- Name Text Color: #FFFFFF
- Border Color: #FFFFFF
- Border Opacity: 30-50%
- Backdrop Blur: 10-15px

**Why it works:** Lower background opacity prevents the widget from appearing too bright, while white text ensures readability.

### Colorful/Patterned Backgrounds

For websites with images, gradients, or patterns:

**Recommended Settings:**
- Background Color: #FFFFFF
- Background Opacity: 30-40%
- Text Color: #FFFFFF (or dark depending on pattern)
- Border Color: #FFFFFF
- Border Opacity: 40-50%
- Backdrop Blur: 12-15px

**Why it works:** Higher blur values help reduce visual noise from busy backgrounds while maintaining the glassmorphic aesthetic.

## How Backdrop Blur Works

The backdrop blur effect uses the CSS `backdrop-filter` property to blur whatever is behind your widget. Here's what happens at different settings:

- **0px**: No blur - full transparency effect, background is completely visible
- **5px**: Slight blur - background details softened but still recognizable
- **10px**: Medium blur - balanced frosted glass effect, shapes visible but details obscured
- **15px**: Heavy blur - background becomes abstract color zones
- **20px**: Maximum blur - background is completely diffused

**Note:** Backdrop blur only affects what's behind the widget. If your website has a solid color background, the blur effect won't be as noticeable. It works best over images, gradients, or varied content.

## Text Contrast Best Practices

### Ensuring Readability

1. **Test your settings** by previewing the widget over different areas of your website
2. **Use the Typography section** to adjust:
   - Review Text Color
   - Reviewer Name Color
   - Accent Color (affects buttons and navigation)

### Contrast Guidelines:
- **White text** works best when Background Opacity is below 40%
- **Dark text** works best when Background Opacity is above 60%
- **For mixed backgrounds**, consider using a slight text shadow (not available in current settings, but white text with lower opacity backgrounds provides natural contrast)

## Accessibility Considerations

### 1. Maintain WCAG Contrast Ratios

While glassmorphism is visually appealing, ensure your text remains readable:

- **Large text** (reviewer names): Aim for at least 3:1 contrast ratio
- **Body text** (review content): Aim for at least 4.5:1 contrast ratio
- **Test your widget** using browser developer tools' accessibility checker

### 2. Provide Fallbacks

The glassmorphic effect relies on modern CSS features. The widgets automatically fallback to solid backgrounds for browsers that don't support backdrop-filter, ensuring your reviews remain readable for all users.

### 3. Consider Motion Sensitivity

If you're using the **Auto-advance slideshow** feature (Animation section):
- Keep the **Slideshow Speed** at 4 seconds or higher
- This gives users with motion sensitivity time to read content

### 4. Interactive Elements

Ensure navigation elements remain visible:
- The default white accent color provides good contrast for buttons
- Border settings help define widget boundaries
- The inner shadow effect adds depth without relying on color alone

## Common Settings Combinations

### "Subtle Glass" Preset
Perfect for professional sites:
- Background Opacity: 50%
- Backdrop Blur: 5px
- Border Width: 0.5px
- Border Opacity: 20%

### "Frosted Window" Preset
Classic glassmorphic look:
- Background Opacity: 30%
- Backdrop Blur: 10px
- Border Width: 0.5px
- Border Opacity: 30%
- Inner Shadow: Enabled (default)

### "Heavy Glass" Preset
For maximum blur effect:
- Background Opacity: 20%
- Backdrop Blur: 20px
- Border Width: 1px
- Border Opacity: 50%

## Troubleshooting

### "I can't see the blur effect"
- Ensure your widget is placed over a varied background (image, gradient, or content)
- Solid color backgrounds won't show the blur effect
- Try increasing the Blur Intensity slider to 15-20px

### "Text is hard to read"
- Adjust the Background Opacity higher (40-60%)
- Change text colors in the Typography section
- Reduce the Backdrop Blur to 5-8px

### "The effect looks too heavy"
- Reduce Background Opacity to 20-30%
- Lower the Backdrop Blur to 5-10px
- Decrease Border Opacity to 20-30%

### "Borders appear too strong"
- Use 0.5px Border Width instead of higher values
- Reduce Border Opacity to 20-30%
- Consider changing Border Color to match your site's theme

## Advanced Tips

### 1. Matching Your Brand
- Use your brand colors for the Border Color
- Adjust the Accent Color to match your website's buttons
- Keep typography consistent with your site's Font Family setting

### 2. Creating Depth
- The inner shadow (enabled by default) creates a subtle white frost effect
- Combine with the "Add shadow vignette" option for more depth
- Adjust Shadow Intensity for stronger/lighter effects

### 3. Responsive Considerations
- The glassmorphic effect works well across all device sizes
- On mobile, consider slightly higher Background Opacity (40-50%) for better readability
- Test your widget on different screen sizes using your browser's device preview

## Platform-Specific Notes

### For WordPress Users
Place widgets in areas with varied backgrounds for best effect. The glassmorphic style works particularly well in hero sections or over featured images.

### For Shopify Stores
Consider using glassmorphic widgets on product pages where product images can show through, creating an integrated look.

### For Custom Websites
Ensure your widget container doesn't have conflicting CSS that might override the backdrop-filter effect.

## Summary

Creating beautiful glassmorphic effects in PromptReviews is about finding the right balance between transparency, blur, and contrast. Start with the recommended settings above, then fine-tune based on your specific website design. Remember that the effect is most striking over varied, colorful backgrounds, and always prioritize readability for the best user experience.

The key settings to remember:
- **Background Opacity**: 20-70% (lower = more transparent)
- **Backdrop Blur**: 8-12px (higher = more blur)
- **Border**: 0.5-1px width with 30-50% opacity
- **Text Colors**: Adjust based on your background for optimal contrast

Experiment with these settings to create a unique glassmorphic style that enhances your review widgets while maintaining excellent readability and accessibility.