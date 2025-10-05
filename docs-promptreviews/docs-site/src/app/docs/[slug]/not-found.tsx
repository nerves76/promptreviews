import Link from 'next/link'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'
import DocsLayout from '../../docs-layout'

export default function NotFound() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-6">
            <FileQuestion className="w-12 h-12 text-white/60" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Article Not Found
          </h1>

          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            We couldn't find the article you're looking for. It may have been moved,
            renamed, or is not yet available.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
          >
            <Home className="w-5 h-5" />
            <span>Go to Homepage</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <span>Browse Documentation</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Popular articles suggestion */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">
            Popular Documentation Pages
          </h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link
              href="/getting-started"
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-colors text-left"
            >
              <h3 className="font-semibold text-white mb-1">Getting Started</h3>
              <p className="text-sm text-white/70">Quick start guide for new users</p>
            </Link>
            <Link
              href="/prompt-pages"
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-colors text-left"
            >
              <h3 className="font-semibold text-white mb-1">Prompt Pages</h3>
              <p className="text-sm text-white/70">Create review request pages</p>
            </Link>
            <Link
              href="/faq-comprehensive"
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-colors text-left"
            >
              <h3 className="font-semibold text-white mb-1">Complete FAQ</h3>
              <p className="text-sm text-white/70">Answers to common questions</p>
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
