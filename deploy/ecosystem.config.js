// PM2 process list for production. Each app loads its own secrets from its
// own .env.production file (via dotenv/Next.js's built-in env loading) — this
// file only wires up ports and working directories, no secrets live here.
module.exports = {
  apps: [
    {
      name: "wisdomstream-api",
      cwd: "packages/api",
      script: "dist/main.js",
      env: { NODE_ENV: "production", PORT: 4001 },
    },
    {
      name: "wisdomstream-web",
      cwd: "apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4002",
      env: { NODE_ENV: "production" },
    },
    {
      name: "wisdomstream-studio",
      cwd: "apps/studio",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4003",
      env: { NODE_ENV: "production" },
    },
    {
      name: "wisdomstream-admin",
      cwd: "apps/admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4004",
      env: { NODE_ENV: "production" },
    },
  ],
};
