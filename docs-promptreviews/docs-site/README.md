# Prompt Reviews Documentation Site

A comprehensive documentation website for Prompt Reviews, built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3001 in your browser
```

## 📁 Project Structure

```
docs-site/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── getting-started/    # Getting started guides
│   │   ├── prompt-pages/       # Prompt pages documentation
│   │   ├── contacts/           # Contact management guides
│   │   ├── reviews/            # Review management docs
│   │   ├── google-business/    # Google Business Profile guides
│   │   ├── widgets/            # Widget integration docs
│   │   ├── team/               # Team management guides
│   │   ├── advanced/           # Advanced features
│   │   └── troubleshooting/    # Troubleshooting & FAQ
│   ├── components/             # Reusable React components
│   │   ├── Header.tsx          # Site header with navigation
│   │   └── Sidebar.tsx         # Documentation sidebar
│   └── lib/                    # Utility functions
├── content/                    # MDX content files (future)
├── public/                     # Static assets
└── tailwind.config.js          # Tailwind configuration
```

## 🎨 Brand & Design

### Colors
- **Primary**: `#6366F1` (Slate Blue) - Prompt Reviews brand color
- **Secondary**: Gray scale for text and backgrounds
- **Accent**: Purple and blue gradients for visual hierarchy

### Typography
- **Font**: Inter (sans-serif)
- **Headings**: Bold weights with proper hierarchy
- **Body**: Regular weight with good line height for readability

### Components
- **Header**: Sticky navigation with search and app link
- **Sidebar**: Collapsible navigation with icons and active states
- **Content**: Responsive prose with callouts and code blocks
- **Screenshot Placeholders**: Ready for actual app screenshots

## 📝 Content Guidelines

### Writing Style
- **Voice**: Friendly, professional, helpful
- **Tone**: Clear, concise, action-oriented
- **Prompt Reviews Features**: Always mention "Prompty" AI assistant when relevant
- **Screenshots**: Include placeholder divs ready for actual screenshots

### SEO Optimization
- **Meta Tags**: Comprehensive title, description, keywords
- **Schema Markup**: JSON-LD structured data for better search visibility
- **URL Structure**: Clean, hierarchical paths
- **Internal Linking**: Cross-references between related topics

### Content Structure
```markdown
# Page Title
Brief introduction with what users will learn.

## Prerequisites
What users need before starting.

## Step-by-Step Instructions
Numbered steps with screenshots.

## Tips & Best Practices
Additional helpful information.

## Related Articles
Links to related documentation.
```

## 🔍 SEO Features

### Metadata
- Dynamic page titles with template
- Comprehensive meta descriptions
- Keywords targeting search terms
- OpenGraph and Twitter Card support

### Structured Data
- WebSite schema for homepage
- HowTo schema for tutorials
- BreadcrumbList for navigation
- TechArticle schema for technical content

### Performance
- Static site generation for fast loading
- Optimized images with Next.js Image component
- Minimal JavaScript bundle
- Mobile-first responsive design

## 📱 Features

### Navigation
- **Header**: Global navigation with search and app link
- **Sidebar**: Contextual navigation with expand/collapse
- **Breadcrumbs**: Show user location in site hierarchy
- **Mobile**: Responsive design with mobile menu

### Search (Planned)
- Full-text search across all documentation
- Keyboard shortcut (⌘K) support
- Search suggestions and autocomplete
- Results highlighting

### Content
- **Callouts**: Info, warning, success, and tip boxes
- **Code Blocks**: Syntax highlighting with copy button
- **Screenshots**: Placeholder system ready for actual images
- **Cross-References**: Related articles and internal linking

## 🚀 Deployment

### Development
```bash
npm run dev    # Start development server on port 3001
npm run build  # Build for production
npm run start  # Start production server
```

### Production
- Deploy to Vercel, Netlify, or similar platform
- Set up custom domain: `docs.promptreviews.com`
- Configure analytics (Google Analytics, Mixpanel, etc.)
- Set up search indexing (Algolia DocSearch)

### Environment Variables
```env
# Add if using search or analytics
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_key
NEXT_PUBLIC_GA_TRACKING_ID=your_ga_id
```

## 📸 Adding Screenshots

Replace screenshot placeholders with actual app screenshots:

1. **Take Screenshots**: Capture key screens from Prompt Reviews app
2. **Optimize Images**: Use WebP format, optimize for web
3. **Replace Placeholders**: Update `.screenshot-placeholder` divs
4. **Add Alt Text**: Descriptive alt text for accessibility

### Screenshot Guidelines
- **Consistent**: Same browser, zoom level, and UI state
- **Clean**: Hide sensitive user data, use sample data
- **Annotated**: Add callouts and highlights when helpful
- **Mobile**: Include mobile screenshots for responsive features

## 🤝 Contributing

### Adding New Content
1. Create new page in appropriate `src/app/` subdirectory
2. Follow content structure guidelines
3. Include proper metadata and SEO optimization
4. Add navigation links in `Sidebar.tsx`
5. Test on mobile and desktop

### Content Updates
- Keep documentation in sync with app updates
- Update screenshots when UI changes
- Verify all links work correctly
- Test search functionality

## 🛠 Technical Details

### Built With
- **Next.js 14**: App Router, Server Components
- **TypeScript**: Type safety and better DX
- **Tailwind CSS**: Utility-first styling
- **MDX**: Markdown with React components (future)
- **Lucide Icons**: Consistent icon set

### Performance
- **Static Generation**: Fast loading times
- **Image Optimization**: Automatic WebP conversion
- **Code Splitting**: Minimal JavaScript bundles
- **Caching**: Aggressive caching for production

### Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Color Contrast**: WCAG 2.1 AA compliance

---

**Note**: This documentation site is ready for content and screenshots. The structure, navigation, and styling are complete. Add your app screenshots to replace the placeholder boxes and start creating comprehensive documentation for Prompt Reviews users.