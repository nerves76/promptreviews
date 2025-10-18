require("dotenv").config({
  path: require("path").resolve(process.cwd(), ".env.local"),
});

const DEFAULT_GBO_FRAME_ANCESTORS = [
  'https://promptreviews.com',
  'https://www.promptreviews.com',
  'https://promptreviews.app',
  'https://www.promptreviews.app',
  'http://localhost:*',
  'https://localhost:*',
];

function normalizeOrigin(origin) {
  if (!origin) return null;
  const trimmed = origin.trim();
  if (!trimmed) return null;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function buildGoogleBizOptimizerFrameAncestors() {
  const configured = (process.env.EMBED_ALLOWED_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  const merged = [];
  for (const origin of [...DEFAULT_GBO_FRAME_ANCESTORS, ...configured]) {
    const normalized = normalizeOrigin(origin);
    if (normalized && !merged.includes(normalized)) {
      merged.push(normalized);
    }
  }

  return merged;
}

const gboFrameAncestorsList = buildGoogleBizOptimizerFrameAncestors();
const gboFrameAncestorsValue = gboFrameAncestorsList.join(' ');
const gboAllowFromOrigin = gboFrameAncestorsList.find(
  (origin) => origin && !origin.includes('*') && origin.startsWith('http'),
) || 'https://promptreviews.com';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable type checking during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['react-icons', 'lucide-react'],
    // Modern JavaScript compilation
    esmExternals: true,
  },
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ltneloufqjktdplodvao.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // CRITICAL FIX: Prevent CSS from being loaded as JavaScript
    // This is a workaround for Next.js 15 CSS chunking bug
    if (!dev && !isServer) {
      // Disable CSS code splitting to prevent MIME type errors
      // This forces all CSS into a single file instead of chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Force all CSS into a single chunk
          styles: {
            name: 'styles',
            test: /\.(css|scss|sass)$/,
            chunks: 'all',
            enforce: true,
            priority: 40,
            reuseExistingChunk: true,
          },
          // Keep vendor code separate
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Common chunks for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Compression
  compress: true,
  
  // Output optimization
  output: 'standalone',
  
  // Headers for performance and caching
  async headers() {
    return [
      // Prevent caching for embed routes in development
      {
        source: '/infographic-embed',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-store, no-cache, must-revalidate' 
              : 'public, max-age=3600',
          },
        ],
      },
      {
        source: '/embed/google-business-optimizer',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-store, no-cache, must-revalidate'
              : 'public, max-age=600',
          },
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors ${gboFrameAncestorsValue};`,
          },
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()',
          },
          {
            key: 'X-Frame-Options',
            value: `ALLOW-FROM ${gboAllowFromOrigin}`,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/embed/google-business-optimizer/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors ${gboFrameAncestorsValue};`,
          },
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()',
          },
          {
            key: 'X-Frame-Options',
            value: `ALLOW-FROM ${gboAllowFromOrigin}`,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // CRITICAL: Ensure correct MIME types for ALL CSS files (including chunked CSS)
      {
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Additional catch-all for any CSS file pattern
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Additional rule for any Next.js static JS files
      {
        source: '/_next/static/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Game files should allow iframe embedding (no X-Frame-Options = allows all)
      {
        source: '/prompty-power-game/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Emoji widget should allow iframe embedding (no X-Frame-Options = allows all)
      {
        source: '/emoji-sentiment-embed.html',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Review dashboard embed should allow iframe embedding
      {
        source: '/embed/review-dashboard',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Multi-business posting demo should allow iframe embedding
      {
        source: '/demo/multi-business-posting',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Multi-business posting embed version should allow iframe embedding
      {
        source: '/demo/multi-business-posting-embed',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Review trends tablet demo should allow iframe embedding
      {
        source: '/demo/review-trends-tablet',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // All other routes should deny iframe embedding
      {
        source: '/((?!prompty-power-game|emoji-sentiment-embed|embed/review-dashboard|embed/google-business-optimizer|demo/multi-business-posting|demo/multi-business-posting-embed|demo/review-trends-tablet).*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/(_next/static|favicon.ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache API responses briefly
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300',
          },
        ],
      },

    ];
  },
  async rewrites() {
    // Proxy docs site to /docs path (updated 2025-01-18)
    return [
      {
        source: '/docs',
        destination: 'https://docs.promptreviews.app',
      },
      {
        source: '/docs/:path*',
        destination: 'https://docs.promptreviews.app/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
