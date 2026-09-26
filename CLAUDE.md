# WisdomStream — Project Context

## What this is
YouTube-like video streaming platform. Full spec is in WisdomStream_Blueprint.md — read that too.

## Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- Backend: NestJS, Prisma, PostgreSQL 16, Redis 7
- Video: Mux (all video upload/stream — never store video on VPS)
- Auth: Custom JWT (Passport + jsonwebtoken + bcryptjs), refresh tokens in Redis — no third-party auth provider
- Storage: MinIO on VPS (avatars, banners, thumbnails only)
- Search: Elasticsearch 8
- Monorepo: Turborepo + pnpm workspaces

## Apps
- apps/web → User portal
- apps/studio → Creator dashboard  
- apps/admin → Admin panel
- packages/api → NestJS backend
- packages/shared → Shared types + Zod schemas

## Rules
- Never hardcode env vars
- Never store video on VPS — Mux handles all video
- All API responses use { data, error, meta } shape
- Use Prisma for all DB queries, no raw SQL
- UI must replicate real YouTube screens — layout, spacing, component behavior, and interaction patterns should match YouTube (home feed, watch page, Studio dashboard, etc.) as closely as possible. When building any frontend component, use actual YouTube as the reference, not a generic approximation.