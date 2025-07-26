require("dotenv").config({
  path: require("path").resolve(process.cwd(), ".env.local"),
});

/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Instrumentation is now available by default, no config needed
  experimental: {
    // instrumentationHook removed - it's deprecated and no longer needed
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'ltneloufqjktdplodvao.supabase.co',
      },
    ],
    // ⚡ PERFORMANCE: Image optimization settings
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { isServer, dev }) => {
    // Fix webpack devtool warning in development
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  // Security headers
  async headers() {
    return [
      // Allow iframe for the emoji sentiment embed demo
      {
        source: '/emoji-sentiment-embed.html',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Default: deny for everything else (excluding emoji sentiment embed)
      {
        source: '/((?!emoji-sentiment-embed\.html).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

// Only apply Sentry configuration if not disabled
if (process.env.DISABLE_SENTRY !== 'true') {
  const { withSentryConfig } = require("@sentry/nextjs");
  
  // Sentry configuration
  const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry webpack plugin
    silent: true, // Suppresses source map upload logs
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  };

  // Export with Sentry configuration
  module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
} else {
  // Export without Sentry configuration
  module.exports = nextConfig;
}
