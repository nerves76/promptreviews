import DocsLayout from '../../docs-layout'

export default function Loading() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Back button skeleton */}
        <div className="mb-6 h-6 w-48 bg-white/10 rounded" />

        {/* Category label skeleton */}
        <div className="mb-4 h-8 w-32 bg-white/10 rounded-full" />

        {/* Title skeleton */}
        <div className="mb-4 h-12 w-3/4 bg-white/10 rounded" />

        {/* Description skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-6 w-full bg-white/10 rounded" />
          <div className="h-6 w-5/6 bg-white/10 rounded" />
        </div>

        {/* Metadata skeleton */}
        <div className="mb-8 flex gap-4">
          <div className="h-5 w-32 bg-white/10 rounded" />
          <div className="h-5 w-24 bg-white/10 rounded" />
          <div className="h-5 w-28 bg-white/10 rounded" />
        </div>

        {/* Content skeleton */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-4">
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-4/5 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-3/4 bg-white/10 rounded" />

          <div className="py-4" />

          <div className="h-6 w-1/3 bg-white/10 rounded mb-4" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-5/6 bg-white/10 rounded" />
        </div>
      </div>
    </DocsLayout>
  )
}
