/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

const nextConfig = {
  // Subdirectory deployment configuration
  basePath: process.env.NODE_ENV === 'production' ? '/docs' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/docs' : '',
  trailingSlash: true,
  
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    domains: ['docs.promptreviews.com', 'promptreviews.com'],
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