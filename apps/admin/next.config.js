/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wisdomstream/shared"],
  // Unset in dev (each app gets its own port). In prod all three Next apps
  // share one domain behind nginx, split by path prefix, so this app is
  // mounted at /admin.
  basePath: process.env.NEXT_BASE_PATH || undefined,
};

module.exports = nextConfig;
