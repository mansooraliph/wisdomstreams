/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wisdomstream/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "cdn.wisdomstream.com" },
    ],
  },
  // Next.js reserves folders starting with "@" for parallel routes, so the
  // YouTube-style "/@handle" channel URL is implemented as a rewrite to
  // app/(main)/channel/[handle] instead of a literal "@[handle]" route folder.
  async rewrites() {
    return [{ source: "/@:handle", destination: "/channel/:handle" }];
  },
};

module.exports = nextConfig;
