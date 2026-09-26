# 🎬 WisdomStream — Full System Blueprint
> YouTube-like video streaming platform powered by **Mux** for video infrastructure

---

## 📌 Table of Contents

1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Module Overview](#module-overview)
4. [Module 01 — Authentication & Authorization](#module-01--authentication--authorization)
5. [Module 02 — User Profile](#module-02--user-profile)
6. [Module 03 — Channel Management](#module-03--channel-management)
7. [Module 04 — Video Upload Portal (Backend)](#module-04--video-upload-portal-backend)
8. [Module 05 — Mux Integration (Core Video Engine)](#module-05--mux-integration-core-video-engine)
9. [Module 06 — Video Streaming & Playback (User Portal)](#module-06--video-streaming--playback-user-portal)
10. [Module 07 — YouTube Studio (Creator Dashboard)](#module-07--youtube-studio-creator-dashboard)
11. [Module 08 — Comments & Interactions](#module-08--comments--interactions)
12. [Module 09 — Search & Discovery](#module-09--search--discovery)
13. [Module 10 — Subscriptions & Notifications](#module-10--subscriptions--notifications)
14. [Module 11 — Analytics Engine](#module-11--analytics-engine)
15. [Module 12 — Recommendation Engine](#module-12--recommendation-engine)
16. [Module 13 — Monetization (Ad-Ready)](#module-13--monetization-ad-ready)
17. [Module 14 — Admin Panel](#module-14--admin-panel)
18. [Module 15 — API Gateway & Security](#module-15--api-gateway--security)
19. [Database Schema (Overview)](#database-schema-overview)
20. [Project Folder Structure](#project-folder-structure)
21. [Environment Variables](#environment-variables)
22. [Development Phases & Milestones](#development-phases--milestones)

---

## Tech Stack

### Frontend (User Portal + Studio)
| Layer | Technology |
|---|---|
| Framework | **Next.js 14** (App Router, SSR/SSG/ISR) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** + **shadcn/ui** |
| State Management | **Zustand** (global) + **TanStack Query v5** (server state) |
| Video Player | **Mux Player** (`@mux/mux-player-react`) |
| Forms | **React Hook Form** + **Zod** |
| Rich Text Editor | **TipTap** (descriptions, community posts) |
| Charts/Analytics | **Recharts** |
| Upload UI | **Uppy.js** or custom drag-and-drop |
| Realtime | **Socket.io-client** |
| Icons | **Lucide React** |

### Backend (API + Business Logic)
| Layer | Technology |
|---|---|
| Runtime | **Node.js 20+** |
| Framework | **NestJS** (modular, scalable) or **Express.js** |
| Language | **TypeScript** |
| ORM | **Prisma** |
| Validation | **Zod** / class-validator |
| Auth | **Clerk** (recommended) or **NextAuth.js** + JWT |
| Task Queue | **BullMQ** (Redis-backed) |
| Realtime | **Socket.io** |
| Email | **Resend** + **React Email** |

### Infrastructure & Storage
| Service | Purpose |
|---|---|
| **Mux** | Video upload, transcoding, streaming, thumbnails, analytics |
| **PostgreSQL 16** | Primary relational database |
| **Redis 7** | Caching, sessions, queues, pub/sub |
| **MinIO** | Self-hosted S3-compatible object storage on VPS (avatars, banners, thumbnails) |
| **Nginx** | Reverse proxy + static file serving + SSL termination (Let's Encrypt) |
| **Elasticsearch 8** | Full-text video search, tags, filters |
| **Docker + Docker Compose** | All services containerized and orchestrated on VPS |

### DevOps
| Tool | Purpose |
|---|---|
| **VPS (Ubuntu 22.04+)** | Single server hosting all services via Docker Compose |
| **Nginx** | Reverse proxy routing all subdomains (`api.`, `studio.`, `cdn.`) |
| **Let's Encrypt + Certbot** | Free SSL certificates, auto-renewed |
| **GitHub Actions** | CI/CD — SSH deploy to VPS on push to `main` |
| **Sentry** | Error monitoring (self-hosted or free cloud tier) |
| **Grafana + Prometheus** | Metrics & observability (runs on VPS) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│   ┌────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│   │ User Portal│  │  Studio Portal   │  │  Upload Portal    │  │
│   │ (Next.js)  │  │   (Next.js)      │  │  (Next.js/React)  │  │
│   └─────┬──────┘  └────────┬─────────┘  └─────────┬─────────┘  │
└─────────┼───────────────────┼──────────────────────┼────────────┘
          │                   │                      │
          ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (NestJS)                        │
│         Rate Limiting · Auth Guards · CORS · Logging            │
└────────────┬──────────────────────────────────────┬─────────────┘
             │                                      │
    ┌────────▼────────┐                   ┌─────────▼──────────┐
    │   Core Services │                   │  Background Workers │
    │  ┌───────────┐  │                   │  ┌──────────────┐   │
    │  │Auth Module│  │                   │  │ BullMQ Queue │   │
    │  ├───────────┤  │                   │  │  - Mux hooks │   │
    │  │  Video    │  │                   │  │  - Emails    │   │
    │  ├───────────┤  │                   │  │  - Analytics │   │
    │  │ Channel   │  │                   │  └──────────────┘   │
    │  ├───────────┤  │                   └────────────────────┘
    │  │ Analytics │  │
    │  └───────────┘  │
    └────────┬─────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │           Data Layer                       │
    │  PostgreSQL  │  Redis  │  Elasticsearch   │
    └────────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │         External Services                  │
    │   Mux API   │   S3/R2   │   Clerk/Auth    │
    └────────────────────────────────────────────┘
```

---

## Module Overview

| # | Module | Portal | Priority |
|---|--------|--------|----------|
| 01 | Authentication & Authorization | All | 🔴 Critical |
| 02 | User Profile | User + Studio | 🔴 Critical |
| 03 | Channel Management | User + Studio | 🔴 Critical |
| 04 | Video Upload Portal | Upload + Studio | 🔴 Critical |
| 05 | Mux Integration (Core Engine) | Backend | 🔴 Critical |
| 06 | Video Streaming & Playback | User | 🔴 Critical |
| 07 | YouTube Studio Dashboard | Studio | 🟠 High |
| 08 | Comments & Interactions | User + Studio | 🟠 High |
| 09 | Search & Discovery | User | 🟠 High |
| 10 | Subscriptions & Notifications | User + Studio | 🟠 High |
| 11 | Analytics Engine | Studio | 🟡 Medium |
| 12 | Recommendation Engine | User | 🟡 Medium |
| 13 | Monetization (Ad-Ready) | Studio | 🟡 Medium |
| 14 | Admin Panel | Admin | 🟡 Medium |
| 15 | API Gateway & Security | Backend | 🔴 Critical |

---

## Module 01 — Authentication & Authorization

### Overview
Handles user registration, login, session management, OAuth, and role-based access control (RBAC).

### Sub-modules
- **01.1 Registration** — Email/password signup with email verification
- **01.2 Login** — Email/password + OAuth (Google, GitHub)
- **01.3 Session Management** — JWT access tokens (15min) + refresh tokens (7 days) stored in httpOnly cookies
- **01.4 RBAC** — Roles: `viewer`, `creator`, `moderator`, `admin`
- **01.5 2FA** — TOTP (optional, for Studio)
- **01.6 OAuth Providers** — Google OAuth 2.0 (mandatory), GitHub (optional)

### API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email?token=
GET    /api/auth/me
POST   /api/auth/oauth/google
POST   /api/auth/2fa/setup
POST   /api/auth/2fa/verify
```

### Tech Details
- **Provider**: Clerk (recommended) — handles all of the above with pre-built UI components
- **Alternative**: `passport.js` (local + google strategy) + `jsonwebtoken` + `bcryptjs`
- **Session Store**: Redis (for refresh token blocklist)
- Guards: `AuthGuard`, `RolesGuard` (NestJS decorators)

### Database Tables
- `users` — core user record
- `sessions` — refresh token store (or Redis only)
- `oauth_accounts` — linked OAuth providers

---

## Module 02 — User Profile

### Overview
User identity, avatar, preferences, watch history, liked videos, and saved playlists.

### Sub-modules
- **02.1 Profile Settings** — Display name, bio, avatar, banner
- **02.2 Watch History** — Tracks every video watched with timestamp progress
- **02.3 Liked Videos** — User's liked video library
- **02.4 Saved Playlists** — Watch later, custom playlists
- **02.5 Privacy Settings** — History on/off, visibility of liked videos

### API Endpoints

```
GET    /api/users/:username
PATCH  /api/users/me
DELETE /api/users/me
GET    /api/users/me/history
DELETE /api/users/me/history
DELETE /api/users/me/history/:videoId
GET    /api/users/me/liked-videos
GET    /api/users/me/playlists
POST   /api/users/me/playlists
PATCH  /api/users/me/playlists/:id
DELETE /api/users/me/playlists/:id
POST   /api/users/me/playlists/:id/videos
DELETE /api/users/me/playlists/:id/videos/:videoId
```

### Frontend Components (User Portal)
- `ProfilePage` — Public-facing channel/profile view
- `SettingsPage` — Edit profile, privacy, notifications
- `HistoryPage` — Watch history list with clear option
- `PlaylistPage` — Playlist detail + video list
- `LibraryPage` — Liked videos, playlists, saved content

---

## Module 03 — Channel Management

### Overview
Every user can create one or more channels. A channel is the content publishing entity (like a YouTube channel).

### Sub-modules
- **03.1 Channel Creation** — Name, handle (@handle), description, category
- **03.2 Channel Branding** — Profile picture, banner art, links (social)
- **03.3 Channel Home** — Sections: Featured video, playlists, about
- **03.4 Channel Sections** — Customizable home page layout
- **03.5 Multi-channel** — One user → multiple channels
- **03.6 Channel Verification** — Verified badge system (admin-managed)
- **03.7 Channel URL** — `platform.com/@channelHandle`

### API Endpoints

```
POST   /api/channels                      — Create channel
GET    /api/channels/:handle              — Public channel page
PATCH  /api/channels/:id                  — Update channel info
DELETE /api/channels/:id                  — Delete channel
POST   /api/channels/:id/avatar           — Upload avatar (MinIO)
POST   /api/channels/:id/banner           — Upload banner (MinIO)
GET    /api/channels/:id/videos           — List channel videos
GET    /api/channels/:id/playlists        — List channel playlists
GET    /api/channels/:id/about            — Channel about/links
PATCH  /api/channels/:id/sections         — Update home sections
GET    /api/channels/me                   — List my channels
POST   /api/channels/:id/sections         — Add/reorder sections
```

### Frontend Components
- `ChannelSetupWizard` — Step-by-step first-time channel creation
- `ChannelHomePage` — Public channel view (videos, playlists, about)
- `ChannelSettingsPage` — Studio settings for the channel
- `ChannelBrandingEditor` — Upload/crop avatar, banner

---

## Module 04 — Video Upload Portal (Backend)

### Overview
The upload portal enables creators to upload videos, fill in metadata, set visibility, and schedule publishing. This connects directly to Mux for processing.

### Sub-modules
- **04.1 Upload Interface** — Drag-and-drop, progress bar, multi-file queue
- **04.2 Direct Upload to Mux** — Server generates Mux Direct Upload URL; client uploads directly to Mux (never touches your server)
- **04.3 Metadata Entry** — Title, description, tags, category, language
- **04.4 Thumbnail Management** — Auto-generated by Mux (select from 3) or custom upload
- **04.5 Visibility Settings** — Public, Unlisted, Private, Scheduled
- **04.6 Chapter Markers** — Add timestamps for video chapters
- **04.7 Cards & End Screens** — (Phase 2) — Overlay links
- **04.8 Upload Queue** — Multi-video batch uploads with status tracking
- **04.9 Webhook Receiver** — Receive Mux asset status events

### Upload Flow

```
Creator → Upload Portal
    │
    ▼
[1] POST /api/videos/init
    → Server calls Mux API: createDirectUpload()
    → Returns { uploadUrl, uploadId, videoId }
    │
    ▼
[2] Client uploads video file directly to Mux Upload URL
    (using PUT/tus protocol — no file touches your server)
    │
    ▼
[3] Mux processes video (transcode → multiple resolutions)
    │
    ▼
[4] Mux sends webhook → POST /api/webhooks/mux
    Events: video.asset.ready, video.asset.errored
    │
    ▼
[5] Server updates video record: status = "ready"
    Notifies creator via WebSocket/notification
```

### API Endpoints

```
POST   /api/videos/init               — Init upload, get Mux direct upload URL
PATCH  /api/videos/:id/metadata       — Save title, description, tags, etc.
PATCH  /api/videos/:id/visibility     — Set public/private/unlisted/scheduled
POST   /api/videos/:id/thumbnail      — Upload custom thumbnail → MinIO
DELETE /api/videos/:id                — Delete video (Mux asset + DB record)
GET    /api/videos/:id/upload-status  — Poll upload + processing status
POST   /api/webhooks/mux              — Mux webhook receiver (signed)
PATCH  /api/videos/:id/chapters       — Save chapter markers
```

### Frontend Components (Upload Portal / Studio)
- `UploadDropzone` — Drag-and-drop area with `uppy.js` or native File API
- `UploadProgressCard` — Per-video upload + processing progress
- `MetadataForm` — Title, desc, tags, category (React Hook Form + Zod)
- `ThumbnailPicker` — Choose from Mux auto-frames or upload custom
- `VisibilityScheduler` — Date/time picker for scheduled publish
- `ChapterEditor` — Timestamp-based chapter list editor
- `UploadQueue` — Multi-video status dashboard

---

## Module 05 — Mux Integration (Core Video Engine)

### Overview
Mux is the backbone of video infrastructure. This module covers all Mux API interactions, webhook handling, and the video data lifecycle.

### Mux Services Used
| Mux Feature | Usage |
|---|---|
| **Mux Video** | Upload, transcode, store videos |
| **Direct Uploads** | Upload from browser directly to Mux CDN |
| **HLS Streaming** | Adaptive bitrate streaming (ABR) |
| **Thumbnails** | Auto-generated `image.mux.com/{playbackId}/thumbnail.jpg` |
| **Animated GIFs** | Hover preview `image.mux.com/{playbackId}/animated.gif` |
| **Mux Player React** | `@mux/mux-player-react` — drop-in player |
| **Mux Data** | Per-video quality metrics, viewer analytics |
| **Signed Playback** | DRM-lite: time-limited signed tokens for private videos |
| **Webhooks** | `video.asset.ready`, `video.live_stream.active`, etc. |

### Implementation

```typescript
// lib/mux.ts — Mux client singleton
import Mux from '@mux/mux-node';

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

// Create direct upload URL
export async function createDirectUpload() {
  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL!, // https://wisdomstream.com
    new_asset_settings: {
      playback_policy: ['public'],
      mp4_support: 'standard',   // enable MP4 download
      normalize_audio: true,
      master_access: 'temporary',
    },
  });
  return upload; // { id, url }
}

// Generate signed playback token (for private videos)
export function getSignedPlaybackToken(playbackId: string): string {
  const token = new Mux.JWT.signPlaybackId(playbackId, {
    keyId: process.env.MUX_SIGNING_KEY_ID!,
    keySecret: process.env.MUX_SIGNING_PRIVATE_KEY!,
    expiration: '1d',
  });
  return token;
}

// Delete asset
export async function deleteAsset(assetId: string) {
  await mux.video.assets.delete(assetId);
}
```

### Webhook Handler

```typescript
// routes/webhooks/mux.ts
import { verifyWebhookSignature } from '@mux/mux-node/webhooks';

router.post('/webhooks/mux', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['mux-signature'] as string;
  const isValid = verifyWebhookSignature(req.body, signature, process.env.MUX_WEBHOOK_SECRET!);
  if (!isValid) return res.status(401).send('Invalid signature');

  const event = JSON.parse(req.body.toString());

  switch (event.type) {
    case 'video.asset.ready':
      await handleAssetReady(event.data);
      break;
    case 'video.asset.errored':
      await handleAssetError(event.data);
      break;
    case 'video.upload.asset_created':
      await handleUploadLinked(event.data);
      break;
  }

  res.status(200).json({ received: true });
});
```

### Mux Asset Lifecycle States
```
initiated → upload_started → upload_complete 
  → asset_created → preparing → ready ✅
                             → errored ❌
```

### Database Fields for Video (Mux-related)
```prisma
model Video {
  muxUploadId     String?    // Mux upload session ID
  muxAssetId      String?    // Mux asset ID (after processing)
  muxPlaybackId   String?    // Public/private playback ID
  muxStatus       String     // preparing | ready | errored
  duration        Float?     // seconds (from Mux)
  aspectRatio     String?    // "16:9"
  resolutions     Json?      // ["360p","720p","1080p"]
  mp4Url          String?    // MP4 download URL (if enabled)
}
```

---

## Module 06 — Video Streaming & Playback (User Portal)

### Overview
The public-facing experience where users discover and watch videos. Powered by Mux HLS streaming and the Mux Player component.

### Sub-modules
- **06.1 Home Feed** — Algorithmic + trending video grid
- **06.2 Video Watch Page** — Player + metadata + comments + recommendations
- **06.3 Mux Player** — HLS adaptive streaming, quality selector, subtitles
- **06.4 Subtitles/CC** — Upload SRT/VTT, auto-caption (Mux or third-party)
- **06.5 Video Progress** — Resume playback from last position
- **06.6 Quality Selector** — Auto / 360p / 720p / 1080p
- **06.7 Theater/Fullscreen Mode** — Layout toggle
- **06.8 Shorts-style Feed** — Vertical short videos (<60s)
- **06.9 Playlist Autoplay** — Queue-based sequential playback
- **06.10 Speed Control** — 0.25x → 2x playback speed

### Video Watch Page Layout
```
┌────────────────────────────────────────────────────────┐
│  NAVBAR                                                 │
├────────────────────────────────────┬───────────────────┤
│                                    │                   │
│     MUX PLAYER (16:9)             │  UP NEXT          │
│     ──────────────────            │  Recommendations   │
│     Title                         │  (sidebar list)   │
│     Channel · Views · Date        │                   │
│     ❤️ Like  🔖 Save  ↗️ Share     │                   │
│     ─────────────────             │                   │
│     DESCRIPTION (expandable)      │                   │
│     ─────────────────             │                   │
│     COMMENTS (threaded)           │                   │
│                                   │                   │
└───────────────────────────────────┴───────────────────┘
```

### API Endpoints

```
GET    /api/videos/:id              — Public video data + playback URL
POST   /api/videos/:id/view         — Record view (debounced)
POST   /api/videos/:id/progress     — Save watch progress
GET    /api/videos/:id/progress     — Get watch progress
GET    /api/feed                    — Home feed (personalized)
GET    /api/feed/trending           — Trending videos
GET    /api/feed/subscriptions      — Subscribed channel videos
GET    /api/videos/search           — Search endpoint
GET    /api/videos/:id/related      — Related videos
```

### Player Setup (React)

```tsx
// components/VideoPlayer.tsx
import MuxPlayer from '@mux/mux-player-react';

interface Props {
  playbackId: string;
  token?: string;          // signed token for private
  startTime?: number;      // resume position
  onTimeUpdate?: (t: number) => void;
}

export function VideoPlayer({ playbackId, token, startTime, onTimeUpdate }: Props) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      tokens={{ playback: token }}
      startTime={startTime}
      streamType="on-demand"
      defaultHiddenCaptions
      thumbnailTime={0}
      onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
      style={{ aspectRatio: '16/9', width: '100%' }}
    />
  );
}
```

---

## Module 07 — YouTube Studio (Creator Dashboard)

### Overview
A full management interface for creators — think YouTube Studio. Manages all uploaded content, analytics, comments, monetization, and settings.

### Studio Pages

#### 07.1 Dashboard (Overview)
- Latest video performance metrics
- Channel subscriber count, total views, watch time
- Recent comments requiring attention
- News/updates feed

#### 07.2 Content Manager
- Sortable/filterable table of all uploaded videos
- Columns: Thumbnail, Title, Visibility, Date, Views, Comments, Likes, Duration
- Bulk actions: delete, change visibility, add to playlist
- Quick-edit inline (title, visibility)
- Video detail page: full metadata edit

#### 07.3 Video Detail Editor
- Edit title, description, tags, category
- Replace thumbnail
- Edit chapters
- Add/edit subtitles (upload SRT/VTT)
- Change visibility
- View Mux processing status
- Cards & end screens editor (Phase 2)

#### 07.4 Analytics (Deep Dive)
- Views over time (line chart)
- Watch time (hours)
- Average view duration %
- Impressions & CTR
- Traffic sources (search, suggested, direct)
- Audience demographics (countries, devices)
- Revenue (Phase 2 — monetization)
- Per-video analytics vs channel-wide

#### 07.5 Comments Moderation
- All comments with reply + delete + hold for review
- Held for review queue
- Hidden users list (block)
- Pinned comment management
- Keyword filters (auto-hold)
- Spam detection integration

#### 07.6 Subtitles Manager
- Upload SRT/VTT per video per language
- Request auto-caption (Mux Captions or Whisper API)
- Publish/unpublish captions
- Edit captions in browser

#### 07.7 Playlists Manager
- Create, reorder, delete playlists
- Set playlist visibility
- Add videos to playlists from here

#### 07.8 Channel Customization (Studio Settings)
- Profile picture, banner, watermark
- Channel description, links (socials, website)
- Contact email, category
- Featured channels

#### 07.9 Notifications Settings
- Email notifications: new comments, milestones
- Mobile push (Phase 2)
- Digest frequency

#### 07.10 Permissions (For Teams)
- Invite collaborators to channel (manager, editor, analyst)
- Role-based access per channel

### API Endpoints (Studio)

```
GET    /api/studio/dashboard                   — Overview stats
GET    /api/studio/content                     — All videos (paginated, filtered)
PATCH  /api/studio/content/:videoId            — Edit video metadata
DELETE /api/studio/content/:videoId            — Delete video
PATCH  /api/studio/content/:videoId/visibility — Change visibility
GET    /api/studio/analytics                   — Channel analytics
GET    /api/studio/analytics/:videoId          — Per-video analytics
GET    /api/studio/comments                    — All comments (channel-wide)
PATCH  /api/studio/comments/:id/status         — approve/hold/hide
DELETE /api/studio/comments/:id                — Delete comment
POST   /api/studio/captions/:videoId           — Upload SRT/VTT
DELETE /api/studio/captions/:captionId         — Remove caption
GET    /api/studio/playlists                   — List playlists
POST   /api/studio/playlists                   — Create playlist
PATCH  /api/studio/playlists/:id               — Edit playlist
DELETE /api/studio/playlists/:id               — Delete playlist
GET    /api/studio/permissions                 — Channel collaborators
POST   /api/studio/permissions/invite          — Invite collaborator
DELETE /api/studio/permissions/:userId         — Remove collaborator
```

---

## Module 08 — Comments & Interactions

### Overview
Threaded comments (2 levels), likes, dislikes, replies, pinning, and moderation.

### Sub-modules
- **08.1 Comments Feed** — Sorted by Top/New, paginated (infinite scroll)
- **08.2 Threaded Replies** — 1 level deep (like YouTube)
- **08.3 Like / Dislike Video** — Toggle reactions on videos
- **08.4 Like Comments** — Heart a comment
- **08.5 Pin Comment** — Creator can pin one comment
- **08.6 Heart Reply** — Creator heart on a comment
- **08.7 Report** — Report video/comment for violations
- **08.8 Moderation Queue** — Studio moderation workflow

### API Endpoints

```
GET    /api/videos/:id/comments             — List comments (paginated)
POST   /api/videos/:id/comments             — Post comment
PATCH  /api/comments/:id                    — Edit comment
DELETE /api/comments/:id                    — Delete comment
POST   /api/comments/:id/like               — Like comment
DELETE /api/comments/:id/like               — Unlike comment
GET    /api/comments/:id/replies            — Get replies
POST   /api/comments/:id/replies            — Reply to comment
POST   /api/videos/:id/like                 — Like video
DELETE /api/videos/:id/like                 — Unlike video
POST   /api/videos/:id/dislike              — Dislike video
POST   /api/comments/:id/pin                — Pin comment (creator)
POST   /api/videos/:id/report               — Report video
POST   /api/comments/:id/report             — Report comment
```

### Data Model
```prisma
model Comment {
  id          String    @id @default(cuid())
  videoId     String
  userId      String
  parentId    String?   // null = top-level, set = reply
  body        String
  isPinned    Boolean   @default(false)
  isHeld      Boolean   @default(false)  // pending moderation
  likeCount   Int       @default(0)
  createdAt   DateTime  @default(now())
  editedAt    DateTime?
}
```

---

## Module 09 — Search & Discovery

### Overview
Enables users to find videos, channels, and playlists. Powered by Elasticsearch for full-text search with filters.

### Sub-modules
- **09.1 Search Bar** — Autocomplete / suggestions as you type
- **09.2 Search Results Page** — Videos, channels, playlists tabs
- **09.3 Filters** — Upload date, duration, type (video/channel/playlist), sort (relevance/date/views/rating)
- **09.4 Tags** — Tag-based discovery
- **09.5 Category Browsing** — Gaming, Music, Education, etc.
- **09.6 Trending** — Platform-wide trending (views/velocity)
- **09.7 Elasticsearch Indexing** — Auto-index videos on publish; update on edit

### Elasticsearch Mappings (Video Index)

```json
{
  "mappings": {
    "properties": {
      "id":           { "type": "keyword" },
      "title":        { "type": "text", "analyzer": "english" },
      "description":  { "type": "text", "analyzer": "english" },
      "tags":         { "type": "keyword" },
      "category":     { "type": "keyword" },
      "channelName":  { "type": "text" },
      "channelId":    { "type": "keyword" },
      "viewCount":    { "type": "long" },
      "likeCount":    { "type": "long" },
      "duration":     { "type": "float" },
      "publishedAt":  { "type": "date" },
      "language":     { "type": "keyword" },
      "thumbnailUrl": { "type": "keyword", "index": false }
    }
  }
}
```

### API Endpoints

```
GET    /api/search?q=&type=&sort=&duration=&date=   — Main search
GET    /api/search/suggestions?q=                   — Autocomplete
GET    /api/categories                              — Category list
GET    /api/categories/:slug/videos                 — Category videos
GET    /api/trending                                — Trending videos
GET    /api/trending/:category                      — Trending by category
```

---

## Module 10 — Subscriptions & Notifications

### Overview
Users subscribe to channels; receive notifications when new content is published.

### Sub-modules
- **10.1 Subscribe / Unsubscribe** — Follow channel
- **10.2 Notification Preferences** — All / Personalized / None per channel
- **10.3 Bell Notifications** — In-app notification center
- **10.4 Email Digest** — Weekly/instant new upload emails
- **10.5 Push Notifications** — Web Push (Phase 2)
- **10.6 Subscription Feed** — Videos from subscribed channels

### Notification Events
| Trigger | Recipients | Channel |
|---|---|---|
| New video published | Subscribers with bell on | In-app + Email |
| New comment on your video | Creator | In-app |
| Reply to your comment | Comment author | In-app |
| Subscriber milestone | Creator | In-app |
| Video like milestone | Creator | In-app |

### API Endpoints

```
POST   /api/channels/:id/subscribe        — Subscribe to channel
DELETE /api/channels/:id/subscribe        — Unsubscribe
PATCH  /api/channels/:id/subscribe        — Update notification level
GET    /api/channels/:id/subscribers      — Subscriber count
GET    /api/users/me/subscriptions        — My subscribed channels
GET    /api/notifications                 — My notifications (paginated)
PATCH  /api/notifications/read-all        — Mark all as read
PATCH  /api/notifications/:id/read        — Mark one as read
DELETE /api/notifications/:id             — Dismiss notification
```

### Email Template (Resend + React Email)
```tsx
// emails/NewVideoEmail.tsx
export const NewVideoEmail = ({ channelName, videoTitle, thumbnailUrl, videoUrl }) => (
  <Html>
    <Heading>{channelName} uploaded a new video</Heading>
    <Img src={thumbnailUrl} width={480} />
    <Text>{videoTitle}</Text>
    <Button href={videoUrl}>Watch Now</Button>
  </Html>
);
```

---

## Module 11 — Analytics Engine

### Overview
Provides creators with deep insights into their content performance. Data sourced from Mux Data + internal event tracking.

### Data Sources
1. **Mux Data** — Quality of experience metrics (buffering, bitrate, errors)
2. **Internal Events** — Views, likes, shares, comments, impressions
3. **Geo/Device** — From request headers + Mux Data

### Tracked Events
| Event | When | Data |
|---|---|---|
| `video.view` | User watches >10s | videoId, userId, sessionId |
| `video.progress` | Every 10s while watching | videoId, position, duration% |
| `video.like` | User likes | videoId, userId |
| `video.share` | Share button click | videoId, platform |
| `video.impression` | Video thumbnail shown | videoId, feedPosition |
| `video.click` | Thumbnail clicked | videoId |

### Analytics API Endpoints

```
GET /api/studio/analytics?range=7d|30d|90d|lifetime
    Response: { views, watchTime, subscribers, revenue }

GET /api/studio/analytics/:videoId?range=
    Response: per-video breakdown

GET /api/studio/analytics/realtime
    WebSocket — live viewer count for latest video
```

### Frontend Charts (Recharts)
- `ViewsLineChart` — Views over time
- `WatchTimePieChart` — Traffic source breakdown
- `GeoMap` — Viewer countries (D3 or react-simple-maps)
- `DeviceBarChart` — Mobile vs Desktop vs Tablet
- `ImpressionFunnelChart` — Impressions → Clicks → Watched

---

## Module 12 — Recommendation Engine

### Overview
Surfaces relevant videos on the home feed, sidebar, and after video ends.

### Strategy (Phase 1 — Rule-based)
1. **Collaborative Filtering Lite** — Videos liked/watched by users who also watched this video
2. **Content-Based** — Same tags, category, channel
3. **Trending Boost** — High velocity (views in last 24h)
4. **Freshness Boost** — Newer videos get a score boost
5. **Personalization** — Based on user's watch history tags/categories

### Score Formula
```
score = (viewVelocity * 0.3)
      + (likeRatio * 0.2)
      + (freshness * 0.2)
      + (categoryMatch * 0.2)
      + (watchHistoryMatch * 0.1)
```

### Phase 2 — ML-based
- Embed videos using title/tags (sentence-transformers)
- Store vectors in **pgvector** or **Pinecone**
- ANN (approximate nearest neighbor) for related videos

### Implementation
- Pre-computed home feed stored in Redis (TTL: 1hr)
- Background job (BullMQ) refreshes feed per user on activity
- Real-time fallback: category-based trending

---

## Module 13 — Monetization (Ad-Ready)

### Overview
Prepares the platform for revenue generation. Phase 1: ad-ready infrastructure. Phase 2: creator monetization payouts.

### Sub-modules
- **13.1 Ad Slots** — Pre-roll, mid-roll, post-roll markers stored per video
- **13.2 VAST Integration** — Standard ad server protocol (Google Ad Manager)
- **13.3 Channel Memberships** — Recurring subscription tiers (Stripe)
- **13.4 Super Thanks / Tips** — One-time payment on video (Stripe)
- **13.5 Creator Revenue Split** — Admin-configured percentage
- **13.6 Stripe Integration** — Payments, payouts, subscription billing

### API Endpoints

```
POST   /api/payments/membership/:channelId     — Subscribe to channel membership
POST   /api/payments/tip/:videoId              — Send super thanks
GET    /api/studio/monetization                — Monetization overview
GET    /api/studio/monetization/balance        — Pending payout balance
POST   /api/studio/monetization/payout         — Request payout
```

---

## Module 14 — Admin Panel

### Overview
Platform-level administration: user management, content moderation, analytics, and configuration.

### Admin Portal Pages
- **Dashboard** — Platform stats (total users, videos, DAU, storage, bandwidth)
- **User Management** — Search/ban/suspend users, change roles
- **Content Moderation** — Reported videos/comments queue, take action
- **Channel Verification** — Review and approve verification requests
- **Category Management** — Add/edit/delete video categories
- **Feature Flags** — Toggle features per user segment
- **Email Templates** — Manage transactional emails
- **System Settings** — Rate limits, upload size caps, supported formats

### API Endpoints

```
GET    /api/admin/stats                       — Platform overview
GET    /api/admin/users                       — List all users (filtered)
PATCH  /api/admin/users/:id/status            — ban/suspend/activate
PATCH  /api/admin/users/:id/role              — Change role
GET    /api/admin/reports                     — Content/comment reports
PATCH  /api/admin/reports/:id/action          — remove/dismiss/warn
PATCH  /api/admin/channels/:id/verify         — Grant verification
DELETE /api/admin/videos/:id                  — Force delete video
GET    /api/admin/categories                  — Category list
POST   /api/admin/categories                  — Create category
PATCH  /api/admin/categories/:id              — Update category
DELETE /api/admin/categories/:id              — Delete category
```

---

## Module 15 — API Gateway & Security

### Overview
Central entry point for all API requests. Handles routing, rate limiting, auth, logging, and security headers.

### Features
- **Rate Limiting** — `express-rate-limit` + Redis: 100 req/min per IP (public), 1000/min (auth)
- **CORS** — Configured per environment (dev/prod)
- **Helmet.js** — HTTP security headers (CSP, HSTS, X-Frame-Options)
- **Request Logging** — Morgan + Winston to files/Datadog
- **Input Validation** — Zod schemas on all endpoints
- **SQL Injection Prevention** — Prisma parameterized queries (automatic)
- **File Upload Security** — MIME-type validation, max size check before Mux upload URL issued
- **Mux Webhook Verification** — Signature check on all incoming webhooks
- **API Versioning** — `/api/v1/` prefix

### Middleware Stack (NestJS)
```typescript
// main.ts
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.enableCors({ origin: process.env.ALLOWED_ORIGINS, credentials: true });
app.use(new RateLimit({ windowMs: 60_000, max: 100 }).handler);
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new LoggingInterceptor());
```

---

## Database Schema (Overview)

```prisma
// schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String?
  role          Role      @default(VIEWER)
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  channels      Channel[]
  watchHistory  WatchHistory[]
  liked         VideoLike[]
  subscriptions Subscription[]
  notifications Notification[]
  playlists     Playlist[]
}

model Channel {
  id            String    @id @default(cuid())
  userId        String
  handle        String    @unique   // @handle
  name          String
  description   String?
  avatarUrl     String?
  bannerUrl     String?
  isVerified    Boolean   @default(false)
  subscriberCount Int     @default(0)
  createdAt     DateTime  @default(now())
  user          User      @relation(fields: [userId], references: [id])
  videos        Video[]
  playlists     Playlist[]
}

model Video {
  id              String    @id @default(cuid())
  channelId       String
  title           String
  description     String?
  tags            String[]
  category        String?
  visibility      Visibility @default(PRIVATE)
  thumbnailUrl    String?
  duration        Float?
  viewCount       Int       @default(0)
  likeCount       Int       @default(0)
  commentCount    Int       @default(0)
  muxUploadId     String?
  muxAssetId      String?
  muxPlaybackId   String?
  muxStatus       String    @default("waiting")
  scheduledAt     DateTime?
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  channel         Channel   @relation(fields: [channelId], references: [id])
  comments        Comment[]
  likes           VideoLike[]
  chapters        Chapter[]
}

model WatchHistory {
  id          String   @id @default(cuid())
  userId      String
  videoId     String
  progress    Float    @default(0)   // seconds watched
  watchedAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  @@unique([userId, videoId])
}

model Subscription {
  id            String   @id @default(cuid())
  subscriberId  String
  channelId     String
  notifyLevel   NotifyLevel @default(PERSONALIZED)
  createdAt     DateTime @default(now())
  subscriber    User     @relation(fields: [subscriberId], references: [id])
  @@unique([subscriberId, channelId])
}

model Comment {
  id          String   @id @default(cuid())
  videoId     String
  userId      String
  parentId    String?
  body        String
  isPinned    Boolean  @default(false)
  isHeld      Boolean  @default(false)
  likeCount   Int      @default(0)
  createdAt   DateTime @default(now())
  editedAt    DateTime?
  video       Video    @relation(fields: [videoId], references: [id])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  data      Json
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Chapter {
  id        String   @id @default(cuid())
  videoId   String
  title     String
  startTime Float
  video     Video    @relation(fields: [videoId], references: [id])
}

model Playlist {
  id          String   @id @default(cuid())
  userId      String?
  channelId   String?
  title       String
  description String?
  visibility  Visibility @default(PUBLIC)
  videoIds    String[]
  createdAt   DateTime @default(now())
}

enum Role { VIEWER CREATOR MODERATOR ADMIN }
enum Visibility { PUBLIC UNLISTED PRIVATE SCHEDULED }
enum NotifyLevel { ALL PERSONALIZED NONE }
```

---

## Project Folder Structure

```
wisdomstream/
│
├── apps/
│   ├── web/                          # WisdomStream User Portal (Next.js 14)
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, Register, Forgot Password
│   │   │   ├── (main)/
│   │   │   │   ├── page.tsx          # Home feed
│   │   │   │   ├── watch/[id]/       # Video watch page
│   │   │   │   ├── @[handle]/        # Channel page
│   │   │   │   ├── search/           # Search results
│   │   │   │   ├── trending/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── library/
│   │   │   │   └── history/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── player/               # VideoPlayer, PlayerControls
│   │   │   ├── feed/                 # VideoCard, VideoGrid, InfiniteScroll
│   │   │   ├── channel/              # ChannelCard, SubscribeButton
│   │   │   ├── comments/             # CommentThread, CommentInput
│   │   │   ├── search/               # SearchBar, SearchFilters
│   │   │   └── ui/                   # shadcn/ui components
│   │   └── lib/
│   │       ├── api.ts
│   │       └── mux.ts
│   │
│   ├── studio/                       # WisdomStream Studio (Next.js 14)
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── content/
│   │   │   │   ├── page.tsx          # All videos table
│   │   │   │   └── [videoId]/        # Video detail editor
│   │   │   ├── analytics/
│   │   │   ├── comments/
│   │   │   ├── playlists/
│   │   │   ├── subtitles/
│   │   │   ├── customization/
│   │   │   └── settings/
│   │   └── components/
│   │       ├── upload/               # UploadDropzone, ProgressCard, Queue
│   │       ├── editor/               # MetadataForm, ThumbnailPicker, ChapterEditor
│   │       ├── analytics/            # Charts: ViewsChart, WatchTimeChart
│   │       └── comments/             # ModerationQueue, CommentRow
│   │
│   └── admin/                        # WisdomStream Admin Panel (Next.js 14)
│       ├── app/
│       │   ├── users/
│       │   ├── content/
│       │   ├── reports/
│       │   ├── channels/
│       │   └── settings/
│       └── components/
│
├── packages/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── channels/
│   │   │   │   ├── videos/
│   │   │   │   ├── comments/
│   │   │   │   ├── search/
│   │   │   │   ├── notifications/
│   │   │   │   ├── analytics/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── playlists/
│   │   │   │   ├── studio/
│   │   │   │   ├── admin/
│   │   │   │   ├── mux/              # Mux service + webhook
│   │   │   │   └── payments/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   ├── decorators/
│   │   │   │   └── pipes/
│   │   │   ├── queues/               # BullMQ workers
│   │   │   │   ├── mux.worker.ts
│   │   │   │   ├── email.worker.ts
│   │   │   │   └── analytics.worker.ts
│   │   │   ├── gateways/             # Socket.io gateways
│   │   │   │   ├── notifications.gateway.ts
│   │   │   │   └── realtime.gateway.ts
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma
│   │   │   └── main.ts
│   │   └── Dockerfile
│   │
│   └── shared/                       # Shared types, schemas, utils
│       ├── types/
│       ├── schemas/                  # Zod schemas
│       └── constants/
│
├── infrastructure/
│   ├── docker-compose.yml            # PostgreSQL, Redis, Elasticsearch, MinIO, Nginx
│   ├── docker-compose.prod.yml       # Production overrides (restart policies, volumes)
│   ├── nginx/
│   │   ├── nginx.conf                # Main Nginx config
│   │   ├── wisdomstream.conf         # Reverse proxy rules per subdomain
│   │   └── ssl/                      # Certbot-managed Let's Encrypt certs
│   ├── minio/
│   │   └── init-buckets.sh           # Creates buckets + policies on first run
│   └── scripts/
│       ├── deploy.sh                 # GitHub Actions calls this via SSH
│       └── backup.sh                 # Daily DB + MinIO backup script
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── turbo.json                        # Turborepo config
├── package.json
└── pnpm-workspace.yaml
```

---

## Environment Variables

```env
# === APP ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://wisdomstream.com
API_URL=https://api.wisdomstream.com

# === DATABASE ===
DATABASE_URL=postgresql://user:pass@host:5432/wisdomstream

# === REDIS ===
REDIS_URL=redis://localhost:6379

# === MUX ===
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_secret
MUX_SIGNING_KEY_ID=your_signing_key_id
MUX_SIGNING_PRIVATE_KEY=your_signing_private_key   # base64 encoded

# === AUTH (Clerk) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# OR (Custom JWT)
JWT_ACCESS_SECRET=supersecret
JWT_REFRESH_SECRET=supersecretrefresh

# === STORAGE (MinIO — Self-hosted on VPS) ===
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=https://cdn.wisdomstream.com        # Nginx proxies MinIO on this subdomain
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET_AVATARS=wisdomstream-avatars
MINIO_BUCKET_BANNERS=wisdomstream-banners
MINIO_BUCKET_THUMBNAILS=wisdomstream-thumbnails
CDN_URL=https://cdn.wisdomstream.com               # Public URL served via Nginx → MinIO

# === ELASTICSEARCH ===
ELASTICSEARCH_URL=https://localhost:9200
ELASTICSEARCH_API_KEY=...

# === EMAIL (Resend) ===
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@wisdomstream.com

# === STRIPE (Monetization) ===
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## VPS Self-Hosting Setup (MinIO + Nginx + Docker)

### Docker Compose — Storage & Proxy Services

```yaml
# docker-compose.yml (relevant services)

services:

  minio:
    image: minio/minio:latest
    container_name: wisdomstream_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"    # API (internal only — Nginx proxies externally)
      - "9001:9001"    # MinIO Console (internal only)
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: wisdomstream_nginx
    volumes:
      - ./nginx/wisdomstream.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/ssl:/etc/letsencrypt
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - minio
    restart: unless-stopped

  # Init container — runs once to create buckets
  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      mc alias set local http://minio:9000 $$MINIO_ACCESS_KEY $$MINIO_SECRET_KEY;
      mc mb --ignore-existing local/wisdomstream-avatars;
      mc mb --ignore-existing local/wisdomstream-banners;
      mc mb --ignore-existing local/wisdomstream-thumbnails;
      mc anonymous set download local/wisdomstream-avatars;
      mc anonymous set download local/wisdomstream-banners;
      mc anonymous set download local/wisdomstream-thumbnails;
      "

volumes:
  minio_data:
```

### Nginx Config (cdn.wisdomstream.com → MinIO)

```nginx
# nginx/wisdomstream.conf

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name wisdomstream.com api.wisdomstream.com studio.wisdomstream.com cdn.wisdomstream.com;
    return 301 https://$host$request_uri;
}

# CDN subdomain → MinIO (public bucket read)
server {
    listen 443 ssl;
    server_name cdn.wisdomstream.com;

    ssl_certificate     /etc/letsencrypt/live/wisdomstream.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wisdomstream.com/privkey.pem;

    location / {
        proxy_pass         http://minio:9000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_buffering    off;
        proxy_http_version 1.1;
        # Cache static assets at edge (Nginx local cache)
        proxy_cache_valid  200 7d;
        add_header         Cache-Control "public, max-age=604800";
    }
}

# API subdomain → NestJS backend
server {
    listen 443 ssl;
    server_name api.wisdomstream.com;

    ssl_certificate     /etc/letsencrypt/live/wisdomstream.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wisdomstream.com/privkey.pem;

    location / {
        proxy_pass         http://api:3001;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";   # WebSocket support
    }
}

# Main app → Next.js
server {
    listen 443 ssl;
    server_name wisdomstream.com www.wisdomstream.com studio.wisdomstream.com;

    ssl_certificate     /etc/letsencrypt/live/wisdomstream.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wisdomstream.com/privkey.pem;

    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### MinIO Storage Client (NestJS)

```typescript
// lib/storage.ts — MinIO via AWS SDK v3 (S3-compatible)
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const storageClient = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,       // https://cdn.wisdomstream.com
  region: 'us-east-1',                        // MinIO ignores region, but SDK needs a value
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,    // Required for MinIO
});

export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await storageClient.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
  // Public URL served via Nginx → MinIO
  return `${process.env.CDN_URL}/${bucket}/${key}`;
}

export async function deleteFile(bucket: string, key: string): Promise<void> {
  await storageClient.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
```

### VPS Minimum Recommended Specs
| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| SSD | 80 GB (OS + DB + MinIO) | 200 GB+ |
| Bandwidth | 2 TB/mo | 5 TB/mo |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

> **Note:** Video files are NOT stored on VPS. Mux handles all video storage and CDN delivery. MinIO on VPS only stores small static assets (avatars ~50KB, banners ~200KB, thumbnails ~100KB), so disk usage grows slowly.

### GitHub Actions Deploy Script

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/wisdomstream
            git pull origin main
            docker compose pull
            docker compose up -d --build --remove-orphans
            docker image prune -f
```

---

## Development Phases & Milestones

### Phase 1 — Foundation (Weeks 1–4) 🔴 Critical
- [ ] Project setup (monorepo, Turborepo, pnpm)
- [ ] Database schema (Prisma + PostgreSQL)
- [ ] Auth module (Clerk or custom JWT)
- [ ] User profile + channel creation
- [ ] Mux integration (upload flow + webhook)
- [ ] Basic video upload portal
- [ ] Video watch page with Mux Player
- [ ] Home feed (no recommendations yet — latest videos)

### Phase 2 — Creator Tools (Weeks 5–8) 🟠 High
- [ ] Full YouTube Studio UI
- [ ] Metadata editor, chapter editor, thumbnail picker
- [ ] Comments system (post, thread, like)
- [ ] Subscriptions + basic notifications
- [ ] Channel page (public-facing)
- [ ] Search (Elasticsearch indexing + basic query)
- [ ] Video visibility (public/private/unlisted/scheduled)

### Phase 3 — Discovery & Engagement (Weeks 9–12) 🟡 Medium
- [ ] Recommendations engine (rule-based)
- [ ] Search autocomplete + advanced filters
- [ ] Watch history + resume playback
- [ ] Playlists (create, add, reorder)
- [ ] Trending page
- [ ] Analytics dashboard (Studio)
- [ ] Push notifications (web push)

### Phase 4 — Scale & Monetization (Weeks 13–16) 🟢 Future
- [ ] Admin panel
- [ ] Monetization (Stripe — memberships, tips)
- [ ] Advanced analytics (Mux Data integration)
- [ ] ML recommendations (pgvector)
- [ ] Live streaming (Mux Live Streams)
- [ ] Shorts-style vertical video feed
- [ ] Multi-language subtitle support (Whisper API)
- [ ] Community posts (channel posts)
- [ ] Mobile app (React Native / Expo)

---

## Key Third-Party Integrations Summary

| Service | Purpose | Pricing Model |
|---|---|---|
| **Mux** | Video upload, transcode, stream | Per-minute encoded + streamed |
| **Clerk** | Auth (signin, OAuth, sessions) | Free tier → MAU-based |
| **Resend** | Transactional email | Free tier → email volume |
| **MinIO** | Self-hosted asset storage on VPS (avatars, banners, thumbnails) | Free (open source) — VPS disk cost only |
| **Nginx** | Reverse proxy, SSL, static file serving | Free (open source) |
| **Let's Encrypt** | SSL certificates | Free |
| **Stripe** | Payments, subscriptions, payouts | 2.9% + 30¢ per transaction |
| **Sentry** | Error tracking (self-hosted on VPS or free cloud) | Free |
| **Algolia** (optional) | Search alternative to self-hosted Elasticsearch | Per search operation |

---

*WisdomStream Blueprint v1.0 — Built for Next.js 14, NestJS, Mux, PostgreSQL*
*Last updated: September 2026*
