/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wisdomstream/shared"],
  // Unset in dev (each app gets its own port). In prod all three Next apps
  // share one domain behind nginx, split by path prefix, so this app is
  // mounted at /studio.
  basePath: process.env.NEXT_BASE_PATH || undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "cdn.wisdomstream.com" },
    ],
  },
};

module.exports = nextConfig;
