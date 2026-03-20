# VibeFlix - Design Specification

**Date:** 2026-03-21
**Status:** Approved
**Owner:** sokrateng

---

## 1. Purpose

Netflix-style project catalog for sokrateng's GitHub repositories. AI-powered analysis generates descriptions, categories, and visual trailers for each project. Semi-automatic workflow: AI proposes, user approves.

## 2. Architecture

### Approach: Hybrid (SSG + API Routes + ISR)

```
GitHub Webhook → API Route → Claude AI Analiz → Playwright Screenshot
    → Supabase (pending) → Admin Panel (onay) → ISR Revalidate → Yayında
```

### Data Flow States

```
NEW → ANALYZING → PENDING_REVIEW → APPROVED → PUBLISHED
                                  → REJECTED → (arşiv)
```

### System Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Kullanıcı                         │
│         ┌─────────────┼──────────────┐               │
│         ▼             ▼              ▼               │
│    Ana Sayfa      Proje Detay    Admin Panel         │
│    (Netflix UI)   (Trailer+Demo) (/admin)            │
│         └─────────────┼──────────────┘               │
│                       ▼                              │
│              Next.js App (Vercel)                     │
│              ┌────────┴────────┐                     │
│         SSG/ISR Pages    API Routes                   │
│              │                 │                      │
│          Supabase         Claude API                  │
│        (proje data)    (AI analiz/özet)               │
│              │           Playwright                   │
│              │         (screenshot)                   │
│     GitHub API ←── Webhook ←── GitHub (yeni repo)    │
└─────────────────────────────────────────────────────┘
```

## 3. Database Schema (Supabase)

### projects

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| github_repo | TEXT (unique) | "sokrateng/SAP_Gateway" |
| name | TEXT | "SAP Gateway" |
| slug | TEXT (unique) | URL-friendly slug |
| description | TEXT | AI-generated description |
| category | TEXT | "SAP/ERP", "Finans", etc. |
| status | TEXT | NEW / ANALYZING / PENDING / APPROVED / REJECTED |
| tech_stack | TEXT[] | ["TypeScript", "React"] |
| demo_url | TEXT | Live demo link (nullable) |
| github_url | TEXT | Repo URL |
| last_updated | TIMESTAMP | Last GitHub update |
| activity | TEXT | "aktif" / "arşiv" / "bakımda" |
| ai_trailer | TEXT | AI-generated trailer text |
| sort_order | INT | Manual sort order |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### screenshots

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| project_id | UUID (FK) | → projects |
| image_url | TEXT | Supabase Storage URL |
| caption | TEXT | Optional caption |
| sort_order | INT | Carousel order |
| created_at | TIMESTAMP | Auto |

### categories

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | TEXT (unique) | "sap-erp" |
| display_name | TEXT | "SAP / ERP Entegrasyonları" |
| icon | TEXT | Emoji or icon name |
| sort_order | INT | Display order |

## 4. Pages & UI

### Routes

```
/                   → Main catalog (Netflix layout)
/project/[slug]     → Project detail page
/admin              → Admin panel (token-protected)
/api/webhook        → GitHub webhook endpoint
/api/analyze        → AI analysis trigger
/api/screenshot     → Playwright screenshot
/api/approve        → Project approval
/api/revalidate     → ISR trigger
```

### Main Page Layout

- **Hero Section:** Featured/pinned project with large screenshot + description
- **Category Rows:** Horizontal scroll rows grouped by category (SAP/ERP, Finans, AI Araçları, etc.)
- **Project Cards:** Thumbnail + name + category badge + activity status
- **Hover Effect:** Card scales up (Netflix-style), screenshot carousel auto-plays

### Project Detail Page

- Project name + AI description
- Screenshot carousel (auto-play with navigation dots)
- Category, last update, activity status
- GitHub link + live demo link (if available)
- AI Trailer section (3-4 sentence engaging summary)

### Admin Panel

- List of pending projects with AI-generated content preview
- Edit description, category, trailer text before approval
- Approve / Edit / Reject buttons
- Published + rejected project counts
- Protected by ADMIN_TOKEN env variable

## 5. AI Analysis Pipeline

### Trigger: GitHub Webhook → /api/webhook

1. Receive webhook payload
2. Fetch from GitHub API: README, package.json/deps, language distribution, description, homepage
3. Save to Supabase as status=ANALYZING

### Analysis: /api/analyze

Claude API prompt:
- Input: README content, tech stack, dependencies
- Output (JSON):
  - `description`: 1-2 sentence Turkish description
  - `category`: Suggested category from existing list
  - `ai_trailer`: 3-4 sentence engaging summary
  - `activity`: "aktif" / "arşiv" based on commit frequency

### Screenshots: /api/screenshot

Decision tree:
1. **Demo URL exists** → Playwright captures 3-5 screenshots (main page, scrolled, features)
2. **No demo but README has images** → Extract images from README
3. **Nothing available** → GitHub repo card screenshot + tech stack placeholder

### Completion

Update Supabase: status=PENDING_REVIEW, attach all generated content and screenshots.

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Carousel | Embla Carousel |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| AI | Claude API (@anthropic-ai/sdk) |
| Screenshots | playwright-core |
| Hosting | Vercel |
| Auth | Simple ENV token (ADMIN_TOKEN) |

## 7. Authentication

Single-user admin auth via environment variable:
- `ADMIN_TOKEN` set in Vercel env
- Admin API routes check `Authorization: Bearer <token>` header
- Admin page sends token with all requests
- No login page needed — token stored in localStorage after first entry

## 8. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GITHUB_WEBHOOK_SECRET=
ADMIN_TOKEN=
```

## 9. Cost Estimate

| Service | Free Tier | Sufficient? |
|---------|-----------|-------------|
| Claude API (Haiku) | ~$0.01/repo | Yes |
| Supabase | 500MB DB + 1GB storage | 50+ repos |
| Vercel | 100GB bandwidth | Yes |
| Playwright | Runs in Vercel Functions | Free |

## 10. Project Structure

```
VibeFlix/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── project/[slug]/page.tsx
│   │   ├── admin/page.tsx
│   │   └── api/
│   │       ├── webhook/route.ts
│   │       ├── analyze/route.ts
│   │       ├── screenshot/route.ts
│   │       ├── approve/route.ts
│   │       └── revalidate/route.ts
│   ├── components/
│   │   ├── HeroSection.tsx
│   │   ├── CategoryRow.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ScreenshotCarousel.tsx
│   │   ├── ProjectDetail.tsx
│   │   └── AdminPanel.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── github.ts
│   │   ├── claude.ts
│   │   ├── screenshot.ts
│   │   └── types.ts
│   └── styles/
│       └── globals.css
├── public/
│   └── placeholder.png
├── docs/
│   └── specs/
│       └── 2026-03-21-vibeflix-design.md
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
