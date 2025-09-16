/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

const nextConfig = {
  // Static export for cPanel hosting
  output: 'export',
  
  // Subdirectory deployment configuration
  basePath: process.env.NODE_ENV === 'production' ? '/docs' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/docs' : '',
  trailingSlash: true,
  
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    domains: ['docs.promptreviews.com', 'promptreviews.com'],
    unoptimized: true, // Required for static export
  },
  async redirects() {
    return [
      {
        source: '/help',
        destination: '/',
        permanent: true,
      },
      {
        source: '/docs',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = withMDX(nextConfig)