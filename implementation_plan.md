# Upgrade Private Social Media Platform to Production-Ready

## Goal Description

Transform the existing private social media website into a modern, scalable, production‑ready platform (Twitter/Instagram style) using the cheapest free‑tier services while keeping Vercel compatibility and a clean, maintainable codebase. The stack: Next.js 16, TypeScript, Tailwind, PostgreSQL (Prisma), Vercel deployment.

## User Review Required

> [!IMPORTANT]
> The following decisions require your confirmation before implementation proceeds.
>
> - **Service selections**: Choose preferred providers for each category (uploads, realtime, cache, push notifications, search). Recommended defaults are listed but can be changed.
> - **Existing authentication**: Clarify current auth implementation (Auth.js, Lucia, custom). We need to ensure compatibility with new features.
> - **Database schema**: Review proposed Prisma model extensions for media, likes, follows, notifications, etc.
> - **Design preferences**: Dark mode style, color palette, animation level, and any brand assets/logo.
> - **Deployment constraints**: Any limits on Vercel build size, environment variables, or CI/CD.
> - **Moderation policies**: Desired level of content moderation (simple sanitization vs. AI‑based moderation). 

## Open Questions

> [!WARNING]
> Please answer the following to avoid re‑planning later.
>
> 1. **Upload service** – Do you prefer **UploadThing** (free tier) or **Cloudinary**? Both provide CDN; UploadThing integrates easily with Next.js API routes.
> 2. **Realtime service** – Preferred: **Pusher** or **Ably**? Both have generous free tiers.
> 3. **Cache & rate limiting** – Confirm use of **Upstash Redis** (free tier). Any existing Redis instance?
> 4. **Push notifications** – **OneSignal** or **Firebase Cloud Messaging**?
> 5. **Search** – Start with **PostgreSQL full‑text search**. Should we provision **Algolia** now or later?
> 6. **Current auth** – Which library are you using now (Auth.js v5/Lucia/NextAuth)? Do you need social login integration?
> 7. **Existing code structure** – Is the project rooted at `d:\private social mediia byy antigarviy` with standard `app/`, `pages/`, `components/` directories? Any custom serverless functions?
> 8. **Design assets** – Do you have a logo or brand colors? If not, should we generate placeholder assets using the image generation tool?
> 9. **Feature prioritisation** – Any features you consider optional for the initial MVP (e.g., hashtags, explore page, admin moderation panel)?
> 10. **SEO requirements** – Any specific Open Graph defaults or sitemap structures you need?

## Proposed Changes

---
### 1. Project Foundation & Tooling
- Update `next.config.js` to enable **image optimisation** via external loader (Cloudinary/UploadThing) and **experimental server actions** if needed.
- Install required dependencies:
  - `@prisma/client`, `prisma`
  - `tailwindcss@latest`, `postcss`, `autoprefixer`
  - `sharp` for server‑side image compression
  - `pusher-js` + `@pusher/push-notifications-server`
  - `upstash-redis`
  - `uploadthing` (or `cloudinary`)
  - `sanitize-html`, `csurf`
  - `react-query` / `tanstack/query` for data fetching & caching
  - `next-seo` for SEO metadata handling
- Configure **ESLint**, **Prettier**, and **TypeScript** strict settings.

---
### 2. Media Upload System
#### Files
- **[NEW]** `app/api/upload/route.ts` – Handles multipart uploads, validates MIME type, size, uses `sharp` to resize/compress images, stores to selected upload provider, returns URL.
- **[MODIFY]** `prisma/schema.prisma` – Add `Media` model with fields `id`, `url`, `type`, `size`, `postId` (optional), `userId`, timestamps.
- **[NEW]** `components/UploadDropzone.tsx` – Drag‑and‑drop UI with preview, progress bar, and client‑side validation.
- **[MODIFY]** Post creation component to include `UploadDropzone` and associate uploaded media IDs.
- **[NEW]** `lib/uploadProvider.ts` – Wrapper abstracts UploadThing / Cloudinary API.

---
### 3. Feed System (Infinite Scroll)
#### Files
- **[MODIFY]** `app/api/feed/route.ts` – Supports cursor‑based pagination (`cursor`, `limit`). Utilises Prisma `findMany` with `take`, `skip`, `orderBy` and includes media relations.
- **[NEW]** `components/Feed.tsx` – Uses `react-infinite-scroll-component` or custom IntersectionObserver to load more posts.
- **[NEW]** `hooks/useFeed.ts` – Tanstack Query hook for fetching feed with caching and optimistic UI for likes/comments.
- Add indexes on `createdAt` and `popularity` in Prisma for fast sorting.

---
### 4. Performance Optimizations
#### Files
- **[NEW]** `lib/redis.ts` – Initialise Upstash Redis client.
- **[MODIFY]** `app/api/*` routes to read/write cached data (e.g., profile lookups, feed snippets, notification counts).
- **[NEW]** `middleware/rateLimiter.ts` – Uses Redis token bucket to limit API calls per IP.
- Integrate **debounced search** in UI using Tanstack Query `staleTime` and `refetchOnWindowFocus: false`.

---
### 5. Realtime & Notifications
#### Files
- **[NEW]** `lib/pusher.ts` – Initialise Pusher client/server.
- **[MODIFY]** `app/api/notifications/route.ts` – Publish new notification events via Pusher.
- **[NEW]** `components/NotificationToast.tsx` – Real‑time toast UI.
- Push notifications integration using **OneSignal** (or FCM) server SDK.
- Presence & typing indicator hooks for chat.

---
### 6. Search & Discovery
#### Files
- Extend Prisma `User`, `Post` models with `@@fulltext([name, username, bio])` etc.
- **[MODIFY]** `app/api/search/route.ts` – Accept query, perform PostgreSQL full‑text search, return paginated results.
- UI components: `SearchBar.tsx`, `SearchResults.tsx` with debounced input.
- Optional: Add Algolia client scaffolding commented out for future migration.

---
### 7. Security & Moderation
#### Files
- **[NEW]** `middleware/security.ts` – CSP headers, XSS protection, CSRF (`csurf`).
- Sanitise post content using `sanitize-html` before persisting.
- Simple profanity filter (list based) in server‑side validation.
- **[NEW]** `app/api/report/route.ts` – Users can flag content; creates `Report` record for admin review.
- Admin dashboard component for moderation actions.

---
### 8. UX Improvements (Optimistic UI, Skeletons, Dark Mode)
#### Files
- Global Tailwind config with **dark mode class**.
- Add `theme.ts` for color palette (premium gradient, glassmorphism cards).
- Implement skeleton loaders for feed cards and profile sections using Tailwind animation utilities.
- Use `react-query`'s `mutate` with `optimisticUpdate` for likes, follows, comments.
- Toast notifications component for success/error feedback.

---
### 9. SEO & Sharing
#### Files
- **[MODIFY]** `app/layout.tsx` – Include `<Head>` with dynamic `<title>`, Open Graph meta tags via `next-seo`.
- Generate `sitemap.xml` and `robots.txt` at build time using `next-sitemap`.
- Add `meta` tags for each post page (image, description, author).

---
### 10. Environment & Deployment
- Create `.env.example` with placeholders for:
  - `DATABASE_URL` (Neon/Supabase)
  - `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`
  - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY`
- Update `vercel.json` to set `functions` timeout, `rewrites` for API routes, and enable **edge functions** for rate‑limiting middleware.
- Add **production architecture diagram** (will be generated with the image tool after confirmation).

## Verification Plan

### Automated Tests
- Unit tests for Prisma models using `jest` + `ts-jest`.
- Integration tests for API routes with `supertest`.
- End‑to‑end UI tests using `playwright` (feed infinite scroll, upload flow, real‑time notifications).

### Manual Checks
- Deploy preview on Vercel, verify media upload, CDN delivery, feed pagination, realtime updates, push notifications, search results, SEO meta tags.
- Load test rate‑limiting using simple curl script.
- Verify Redis caching hits via dashboard.

---
**Next steps**:
1. Await your selections for services and clarification of open questions.
2. Once approved, we will scaffold the project structure and incrementally implement each feature set.

*Please review the above plan and provide feedback or approvals where indicated.*
