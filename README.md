This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. Link the repo to a Vercel project (framework preset: **Next.js**).
2. Copy [`.env.example`](.env.example) and set variables in **Project Settings → Environment Variables** for Preview and Production.

### Environment variables

| Variable | Required for build? | Purpose |
|----------|---------------------|---------|
| `DATABASE_URL` | No | Postgres connection at runtime |
| `JWT_SECRET` | No | Session JWT signing |
| `NEXTAUTH_SECRET` | No | NextAuth session encryption |
| `NEXTAUTH_URL` | No | Canonical site URL for NextAuth |
| `NEXT_PUBLIC_APP_URL` | No | Links in verification/reset emails |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Google OAuth (if enabled) |
| `SMTP_*` / `USE_MOCK_EMAIL` | No | Outbound email |
| `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` | No | Media uploads |
| `PUSHER_*` | No | Realtime events |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | No | Rate limiting / cache |
| `ONESIGNAL_APP_ID` / `ONESIGNAL_API_KEY` | No | Push notifications |

The production build runs `prisma generate`, `prisma migrate deploy`, then `next build` (see `package.json`). Set `DATABASE_URL` in Vercel for **both** Build and Runtime so migrations apply and API routes can connect.

**Registration on Vercel:** set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://your-app.vercel.app`). Without SMTP, keep `USE_MOCK_EMAIL=true` (default in `.env.example`) so new users are email-verified automatically and can sign in after signup. Set `REQUIRE_ADMIN_APPROVAL=true` only if you want manual approval (there is no admin approval UI yet).

### Local setup

```bash
cp .env.example .env
# Edit .env with your values
npm ci
npm run dev
```

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
