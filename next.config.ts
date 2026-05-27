import type { NextConfig } from "next";

/**
 * Next.js configuration for the production‑ready social platform.
 * - Enables external image domains (CDN for uploaded media).
 * - Adds support for edge‑runtime middleware (rate limiting, security).
 * - Exposes required environment variables to the client via `publicRuntimeConfig`.
 */
const nextConfig: NextConfig = {
  // Enable React Strict Mode for development safety
  reactStrictMode: true,

  // Image optimization – allow loading from any CDN (UploadThing/Cloudinary)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Public runtime config – expose only safe variables to the client
  publicRuntimeConfig: {
    UPLOADTHING_APP_ID: process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID,
    PUSHER_APP_KEY: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    ONE_SIGNAL_APP_ID: process.env.NEXT_PUBLIC_ONE_SIGNAL_APP_ID,
  },

  // Edge middleware configuration (rate limiting, security)
  // Requires Vercel Edge Runtime support (free tier)
  middleware: [],

  // Experimental features you may need later (e.g., server actions)
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;

