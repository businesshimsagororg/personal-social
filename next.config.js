/**
 * Next.js configuration for the production-ready social platform.
 * - Enables external image domains (CDN for uploaded media).
 * - Server Actions are enabled by default in Next.js 16.
 *
 * Note: Public env vars are accessed directly via process.env.NEXT_PUBLIC_*
 * (publicRuntimeConfig was removed in Next.js 16).
 */

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Enable React Strict Mode for development safety
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "true" : "false",
  },

  // Image optimization – allow loading from any CDN (UploadThing/Cloudinary)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
