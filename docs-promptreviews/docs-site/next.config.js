/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

const nextConfig = {
  // Dynamic deployment to Vercel (Supabase-driven content)
  // basePath: '/docs' tells Next.js all routes should be prefixed with /docs
  // This is required because the site is accessed via promptreviews.app/docs/
  output: undefined,
  basePath: '/docs',
  assetPrefix: '/docs',
  trailingSlash: false,
  
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    domains: ['docs.promptreviews.app', 'promptreviews.app', 'docs.promptreviews.com', 'promptreviews.com'],
    unoptimized: false,
  },
  async redirects() {
    return [
      {
        source: '/help',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = withMDX(nextConfig)
