import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Hide the floating "N" Next.js button in development (errors are still shown).
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
