# VibeFlix - Tech Stack

## Frontend
- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Framer Motion (Netflix-style animations)
- Embla Carousel (screenshot slider)

## Backend
- Next.js API Routes (serverless)
- @supabase/supabase-js
- @anthropic-ai/sdk (Claude API for AI analysis)
- playwright-core (automated screenshots)

## Database & Storage
- Supabase PostgreSQL (project data, categories)
- Supabase Storage (screenshots)

## Deploy
- Vercel (hosting + serverless functions)
- GitHub Webhook (new repo detection)

## Auth
- Simple ENV token for admin panel (single user)
- No Supabase Auth needed initially

## External APIs
- GitHub API (repo metadata, README, languages)
- Claude API / Haiku (AI analysis ~$0.01/repo)
