require("dotenv").config({
  path: require("path").resolve(process.cwd(), ".env.local"),
});

// Import Sentry webpack plugin
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
  },
  serverExternalPackages: ["@supabase/supabase-js", "openai"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure that the native Supabase client is not bundled for the client
      config.externals = [
        ...config.externals,
        "@supabase/supabase-js/dist/module/SupabaseClient",
      ];
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
  // Add static file serving configuration
  async headers() {
    return [
      {
        source: "/widgets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  silent: true, // Suppresses source map upload logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

// Export with Sentry configuration
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
