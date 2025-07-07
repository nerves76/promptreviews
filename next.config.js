require("dotenv").config({
  path: require("path").resolve(process.cwd(), ".env.local"),
});

/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
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
  },
  webpack: (config, { isServer, dev }) => {
    // Fix webpack devtool warning in development
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/sign-in",
        permanent: true,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
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
