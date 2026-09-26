/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wisdomstream/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "cdn.wisdomstream.com" },
    ],
  },
};

module.exports = nextConfig;
