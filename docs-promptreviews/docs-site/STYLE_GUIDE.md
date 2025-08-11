# Documentation Site Style Guide

This guide outlines the standards and patterns for creating new documentation pages in the Prompt Reviews help docs site.

## Table of Contents
- [Design System](#design-system)
- [Page Structure](#page-structure)
- [Component Usage](#component-usage)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)

## Design System

### Theme
The documentation site uses a **dark gradient theme** with glass-morphism effects:
- Background: Gradient from indigo-900 via purple-900 to fuchsia-900
- Cards/Containers: White with 10% opacity and backdrop blur
- Borders: White with 20% opacity

### Visual Hierarchy
1. **Page Headers**: Use `PageHeader` component for consistency
2. **Section Headers**: `text-3xl` or `text-2xl` with `font-bold text-white`
3. **Subsection Headers**: `text-xl` or `text-lg` with `font-semibold text-white`
4. **Body Text**: `text-white/80` or `text-white/90` for readability

## Page Structure

### Basic Page Template

```tsx
import { Metadata } from 'next';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import { IconName } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Title | Prompt Reviews Help',
  description: 'Brief description for SEO',
  keywords: 'relevant, keywords, here',
  openGraph: {
    title: 'Page Title',
    description: 'Brief description',
  },
};

export default function PageName() {
  return (
    <DocsLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' },
          { label: 'Parent Section', href: '/parent' }
        ]}
        currentPage="Current Page"
        categoryLabel="Category Label"
        categoryIcon={IconName}
        categoryColor="blue" // or purple, green, etc.
        title="Page Title"
        description="Page description that explains what users will learn."
      />
      
      {/* Page Content */}
      <div className="max-w-4xl mx-auto">
        {/* Sections go here */}
      </div>
    </DocsLayout>
  );
}
```

### Section Structure

```tsx
{/* Standard Section */}
<div className="mb-16">
  <h2 className="text-3xl font-bold text-white mb-8">Section Title</h2>
  
  {/* Content Card */}
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
    <p className="text-white/90 mb-4">
      Section content here...
    </p>
  </div>
</div>
```

## Component Usage

### Cards
Use for grouping related content:

```tsx
<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
  <h3 className="text-xl font-semibold text-white mb-4">Card Title</h3>
  <p className="text-white/80">Card content...</p>
</div>
```

### Feature Grids
For displaying multiple features or options:

```tsx
<div className="grid md:grid-cols-2 gap-6">
  {features.map((feature) => (
    <div key={feature.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <feature.icon className="w-6 h-6 text-blue-300" />
        </div>
        <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
      </div>
      <p className="text-white/80">{feature.description}</p>
    </div>
  ))}
</div>
```

### Step-by-Step Guides
For process documentation:

```tsx
<div className="space-y-6">
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
      <h3 className="text-xl font-semibold text-white">Step Title</h3>
    </div>
    <p className="text-white/90">Step description...</p>
  </div>
</div>
```

### Call-to-Action Sections
For the bottom of pages:

```tsx
<div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-center">
  <h2 className="text-2xl font-bold text-white mb-4">
    Ready to Get Started?
  </h2>
  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
    Brief encouraging message.
  </p>
  <div className="flex flex-col sm:flex-row gap-4 justify-center">
    <a
      href="https://app.promptreviews.com/dashboard"
      className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
    >
      Primary Action
    </a>
    <a
      href="/related-page"
      className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
    >
      Secondary Action
    </a>
  </div>
</div>
```

## Color Palette

### Background Colors
- **Primary containers**: `bg-white/10` with `backdrop-blur-md`
- **Hover states**: `hover:bg-white/15` or `hover:bg-white/20`
- **Active states**: `bg-white/20`

### Accent Colors
Use these for icons and highlights:
- **Blue**: `bg-blue-500/20` background, `text-blue-300` text
- **Green**: `bg-green-500/20` background, `text-green-300` text
- **Purple**: `bg-purple-500/20` background, `text-purple-300` text
- **Yellow**: `bg-yellow-500/20` background, `text-yellow-300` text
- **Pink**: `bg-pink-500/20` background, `text-pink-300` text
- **Orange**: `bg-orange-500/20` background, `text-orange-300` text
- **Red**: `bg-red-500/20` background, `text-red-300` text
- **Cyan**: `bg-cyan-500/20` background, `text-cyan-300` text

### Text Colors
- **Primary**: `text-white`
- **Secondary**: `text-white/90` or `text-white/80`
- **Muted**: `text-white/70` or `text-white/60`
- **Links**: `text-yellow-300 hover:text-yellow-200`
- **Accent links**: `text-blue-300 hover:text-blue-200`

### Border Colors
- **Default**: `border-white/20`
- **Hover**: `border-white/30`
- **Accent borders**: `border-blue-400/30`, `border-green-400/30`, etc.

## Typography

### Font Sizes
- **Page title (h1)**: `text-4xl sm:text-5xl font-bold`
- **Section title (h2)**: `text-3xl font-bold` or `text-2xl font-bold`
- **Subsection (h3)**: `text-xl font-semibold` or `text-lg font-semibold`
- **Body text**: Default size with opacity variants
- **Small text**: `text-sm`

### Font Weights
- **Bold**: For headings and emphasis
- **Semibold**: For subheadings
- **Medium**: For buttons and navigation
- **Normal**: For body text

## Code Examples

### Lists with Icons

```tsx
<ul className="space-y-2 text-white/80">
  <li className="flex items-start space-x-2">
    <span className="text-green-300">✓</span>
    <span>List item text</span>
  </li>
</ul>
```

### Info Boxes

```tsx
<div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
  <p className="text-white/80 text-sm">
    <strong className="text-blue-300">Tip:</strong> Helpful information here
  </p>
</div>
```

### Feature Lists

```tsx
<div className="grid md:grid-cols-3 gap-6">
  <div className="text-center">
    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
      <IconName className="w-6 h-6 text-blue-300" />
    </div>
    <h3 className="font-semibold text-white mb-2">Feature Name</h3>
    <p className="text-white/70 text-sm">Feature description</p>
  </div>
</div>
```

## Best Practices

### Content Guidelines
1. **Be concise**: Keep paragraphs short and scannable
2. **Use examples**: Include real-world examples when possible
3. **Visual hierarchy**: Use headings to break up content
4. **Action-oriented**: Focus on what users can do

### Accessibility
1. **Color contrast**: Ensure text has sufficient contrast on dark backgrounds
2. **Icon usage**: Always pair icons with text labels
3. **Link text**: Use descriptive link text, not "click here"
4. **Alt text**: Include alt text for any images

### Mobile Responsiveness
1. **Use responsive grid classes**: `grid md:grid-cols-2` for tablet and up
2. **Stack on mobile**: Use `flex-col sm:flex-row` for flexible layouts
3. **Touch targets**: Ensure buttons are at least 44x44px
4. **Text size**: Use responsive text classes like `text-4xl sm:text-5xl`

### Performance
1. **Lazy loading**: Use Next.js Image component for images
2. **Code splitting**: Keep components modular
3. **Minimize animations**: Use simple transitions only

### SEO
1. **Metadata**: Always include title, description, and keywords
2. **Heading hierarchy**: Use proper h1, h2, h3 structure
3. **Internal linking**: Link to related documentation pages
4. **Canonical URLs**: Set canonical URLs in metadata

## Common Patterns

### Navigation Items in Sidebar
When adding new sections to the sidebar navigation:

```tsx
{
  title: 'Section Name',
  href: '/section-path',
  icon: IconComponent,
  children: [
    { title: 'Subsection', href: '/section-path/subsection' },
  ]
}
```

### Gradient Backgrounds for CTAs
Use gradient backgrounds for important call-to-action sections:

```tsx
className="bg-gradient-to-r from-blue-500 to-purple-600"
className="bg-gradient-to-r from-green-500 to-blue-600"
className="bg-gradient-to-r from-pink-500 to-purple-600"
```

### Hover Effects
Standard hover patterns:
- Cards: `hover:border-white/30 hover:bg-white/15`
- Buttons: `hover:bg-white/30`
- Links: `hover:text-yellow-200` or color variant

## File Naming Conventions

- **Pages**: Use kebab-case for folders and `page.tsx` for the file
- **Components**: Use PascalCase for component files
- **Utilities**: Use camelCase for utility functions
- **Constants**: Use UPPER_SNAKE_CASE for constants

## Testing Checklist

Before committing a new page:
- [ ] Page renders without errors
- [ ] All links work correctly
- [ ] Mobile responsive design works
- [ ] Text is readable on dark background
- [ ] Metadata is complete
- [ ] Page follows DocsLayout structure
- [ ] Icons and colors are consistent
- [ ] No accessibility issues