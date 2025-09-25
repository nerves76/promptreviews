#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Template for React component
const createReactComponent = (title, description, content, breadcrumb, category) => {
  // Extract metadata from content
  const lines = content.split('\n');
  const mainTitle = title || lines[0].replace(/^#\s+/, '');
  const desc = description || lines.find(line => line.length > 20 && !line.startsWith('#'))?.trim() || '';

  // Convert markdown to JSX content
  const convertedContent = convertMarkdownToJSX(content);

  return `import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '${breadcrumb.includes('metrics') ? '../../../' : breadcrumb.includes('optimization') || breadcrumb.includes('engagement') || breadcrumb.includes('performance') ? '../../../' : '../../'}docs-layout'
import PageHeader from '${breadcrumb.includes('metrics') ? '../../../' : breadcrumb.includes('optimization') || breadcrumb.includes('engagement') || breadcrumb.includes('performance') ? '../../../' : '../../'}components/PageHeader'
import {
  Star,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowRight,
  Search,
  MessageSquare,
  Image,
  Phone,
  Globe,
  Lightbulb
} from 'lucide-react'

export const metadata: Metadata = {
  title: '${mainTitle} | Google Biz Optimizer™',
  description: '${desc.replace(/'/g, "\\'")}',
  keywords: [
    'Google Business Profile',
    '${category}',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com${breadcrumb}',
  },
}

export default function Page() {
  return (
    <DocsLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' },
          { label: 'Google Biz Optimizer', href: '/google-biz-optimizer' }
        ]}
        currentPage="${mainTitle}"
        categoryLabel="${category}"
        categoryIcon={${getCategoryIcon(category)}}
        categoryColor="${getCategoryColor(category)}"
        title="${mainTitle}"
        description="${desc.replace(/"/g, '\\"')}"
      />

      <div className="prose prose-gray max-w-none">
        ${convertedContent}
      </div>
    </DocsLayout>
  )
}`;
};

// Convert markdown to JSX
function convertMarkdownToJSX(markdown) {
  const lines = markdown.split('\n');
  const jsxParts = [];
  let currentList = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip the first heading as it's in PageHeader
    if (i === 0 && line.startsWith('# ')) continue;

    // Handle headings
    if (line.startsWith('## ')) {
      if (inList) {
        jsxParts.push(`<ul className="space-y-2 mb-6">${currentList.join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      jsxParts.push(`<h2 className="text-2xl font-bold mb-4 mt-8">${line.substring(3)}</h2>`);
    } else if (line.startsWith('### ')) {
      if (inList) {
        jsxParts.push(`<ul className="space-y-2 mb-6">${currentList.join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      jsxParts.push(`<h3 className="text-xl font-semibold mb-3 mt-6">${line.substring(4)}</h3>`);
    } else if (line.startsWith('#### ')) {
      if (inList) {
        jsxParts.push(`<ul className="space-y-2 mb-6">${currentList.join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      jsxParts.push(`<h4 className="text-lg font-medium mb-2 mt-4">${line.substring(5)}</h4>`);
    }
    // Handle lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      currentList.push(`<li>${processInlineMarkdown(line.substring(2))}</li>`);
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        inList = true;
      }
      currentList.push(`<li>${processInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</li>`);
    }
    // Handle blockquotes
    else if (line.startsWith('> ')) {
      if (inList) {
        jsxParts.push(`<ul className="space-y-2 mb-6">${currentList.join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      jsxParts.push(`<blockquote className="border-l-4 border-blue-500 pl-4 italic my-4">${processInlineMarkdown(line.substring(2))}</blockquote>`);
    }
    // Handle paragraphs
    else if (line.trim()) {
      if (inList) {
        jsxParts.push(`<ul className="space-y-2 mb-6">${currentList.join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      jsxParts.push(`<p className="mb-4">${processInlineMarkdown(line)}</p>`);
    }
  }

  // Close any open list
  if (inList) {
    jsxParts.push(`<ul className="space-y-2 mb-6">${currentList.join('')}</ul>`);
  }

  return jsxParts.join('\n        ');
}

// Process inline markdown (bold, italic, links)
function processInlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" className="text-blue-600 hover:text-blue-700 underline">$1</a>')
    .replace(/`(.+?)`/g, '<code className="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
}

// Get icon based on category
function getCategoryIcon(category) {
  const iconMap = {
    'Metrics': 'BarChart3',
    'Optimization': 'Search',
    'Engagement': 'MessageSquare',
    'Performance': 'Phone'
  };
  return iconMap[category] || 'Star';
}

// Get color based on category
function getCategoryColor(category) {
  const colorMap = {
    'Metrics': 'blue',
    'Optimization': 'green',
    'Engagement': 'purple',
    'Performance': 'orange'
  };
  return colorMap[category] || 'blue';
}

// Process a single markdown file
function processMarkdownFile(filePath, outputPath, breadcrumb, category) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');
  const title = fileName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const reactComponent = createReactComponent(title, '', content, breadcrumb, category);

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, reactComponent);
  console.log(`✅ Converted: ${fileName} -> ${outputPath}`);
}

// Main conversion
const docsDir = '/Users/chris/promptreviews/docs-promptreviews/docs-site/src/app/google-biz-optimizer';

// Process metrics
const metricsFiles = [
  { file: 'average-rating.md', title: 'Average Star Rating Impact' },
  { file: 'review-trends.md', title: 'Review Growth Trends' },
  { file: 'monthly-patterns.md', title: 'Monthly Review Patterns' }
];

metricsFiles.forEach(({ file, title }) => {
  const inputPath = path.join(docsDir, 'metrics', file);
  const outputDir = path.join(docsDir, 'metrics', file.replace('.md', ''));
  const outputPath = path.join(outputDir, 'page.tsx');

  if (fs.existsSync(inputPath)) {
    processMarkdownFile(inputPath, outputPath, `/google-biz-optimizer/metrics/${file.replace('.md', '')}`, 'Metrics');
  }
});

// Process optimization
const optimizationFiles = [
  { file: 'seo-score.md', title: 'SEO Score Explained' },
  { file: 'categories.md', title: 'Business Categories Guide' },
  { file: 'services.md', title: 'Services & Descriptions' },
  { file: 'photos.md', title: 'Photo Strategy Guide' },
  { file: 'quick-wins.md', title: 'Quick Wins & Priority Tasks' }
];

optimizationFiles.forEach(({ file, title }) => {
  const inputPath = path.join(docsDir, 'optimization', file);
  const outputDir = path.join(docsDir, 'optimization', file.replace('.md', ''));
  const outputPath = path.join(outputDir, 'page.tsx');

  if (fs.existsSync(inputPath)) {
    processMarkdownFile(inputPath, outputPath, `/google-biz-optimizer/optimization/${file.replace('.md', '')}`, 'Optimization');
  }
});

// Process engagement
const engagementFiles = [
  { file: 'review-responses.md', title: 'Responding to Reviews' },
  { file: 'questions-answers.md', title: 'Q&A Management' },
  { file: 'posts.md', title: 'Google Posts Strategy' }
];

engagementFiles.forEach(({ file, title }) => {
  const inputPath = path.join(docsDir, 'engagement', file);
  const outputDir = path.join(docsDir, 'engagement', file.replace('.md', ''));
  const outputPath = path.join(outputDir, 'page.tsx');

  if (fs.existsSync(inputPath)) {
    processMarkdownFile(inputPath, outputPath, `/google-biz-optimizer/engagement/${file.replace('.md', '')}`, 'Engagement');
  }
});

// Process performance
const performanceFiles = [
  { file: 'customer-actions.md', title: 'Customer Actions' }
];

performanceFiles.forEach(({ file, title }) => {
  const inputPath = path.join(docsDir, 'performance', file);
  const outputDir = path.join(docsDir, 'performance', file.replace('.md', ''));
  const outputPath = path.join(outputDir, 'page.tsx');

  if (fs.existsSync(inputPath)) {
    processMarkdownFile(inputPath, outputPath, `/google-biz-optimizer/performance/${file.replace('.md', '')}`, 'Performance');
  }
});

console.log('\n✨ All markdown files converted to React components!');