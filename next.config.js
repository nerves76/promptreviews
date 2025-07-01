require("dotenv").config({
  path: require("path").resolve(process.cwd(), ".env.local"),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com", "ltneloufqjktdplodvao.supabase.co"],
  },
  serverExternalPackages: ["@supabase/supabase-js", "openai"],
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      // Ensure that the native Supabase client is not bundled for the client
      config.externals = [
        ...config.externals,
        "@supabase/supabase-js/dist/module/SupabaseClient",
      ];
    }
    
    // Optimize for development performance
    if (dev) {
      // Reduce bundle analysis overhead
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Use faster source maps for development
      config.devtool = 'eval';
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
