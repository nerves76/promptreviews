// Server component for SEO and performance
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Renders markdown content with:
 * - Automatic heading IDs for anchor links (kebab-case)
 * - Syntax highlighting for code blocks
 * - GitHub-flavored markdown (tables, task lists, etc.)
 *
 * Security: rehypeRaw removed to prevent XSS attacks.
 * This component is a server component for better SEO and performance.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{
          // Custom heading components to ensure proper styling
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold text-white mb-6 mt-8 first:mt-0" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-bold text-white mb-4 mt-8 border-b border-white/20 pb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-semibold text-white mb-3 mt-6" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xl font-semibold text-white mb-2 mt-4" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-lg font-semibold text-white mb-2 mt-4" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-base font-semibold text-white mb-2 mt-4" {...props} />
          ),

          // Paragraph styling
          p: ({ node, ...props }) => (
            <p className="text-white/90 mb-4 leading-relaxed" {...props} />
          ),

          // List styling
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside text-white/90 mb-4 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside text-white/90 mb-4 space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-white/90" {...props} />
          ),

          // Link styling
          a: ({ node, ...props }) => (
            <a
              className="text-yellow-300 hover:text-yellow-200 underline transition-colors"
              target={props.href?.startsWith('http') ? '_blank' : undefined}
              rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            />
          ),

          // Code block styling
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="bg-white/10 text-yellow-300 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={`${className} block`} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4 border border-white/10" {...props} />
          ),

          // Blockquote styling
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-yellow-400 pl-4 py-2 my-4 bg-white/5 text-white/80 italic"
              {...props}
            />
          ),

          // Table styling
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-white/20 border border-white/20" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-white/10" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-white/10" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-white/5 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-white" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-sm text-white/90" {...props} />
          ),

          // Horizontal rule styling
          hr: ({ node, ...props }) => (
            <hr className="border-white/20 my-8" {...props} />
          ),

          // Image styling
          img: ({ node, ...props }) => (
            <img
              className="rounded-lg border border-white/20 my-4 max-w-full h-auto"
              loading="lazy"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
