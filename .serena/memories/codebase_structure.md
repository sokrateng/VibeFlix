# VibeFlix - Codebase Structure

```
VibeFlix/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page (Netflix catalog)
│   │   ├── layout.tsx            # Root layout
│   │   ├── project/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Project detail page
│   │   ├── admin/
│   │   │   └── page.tsx          # Admin panel
│   │   └── api/
│   │       ├── webhook/
│   │       │   └── route.ts      # GitHub webhook handler
│   │       ├── analyze/
│   │       │   └── route.ts      # AI analysis trigger
│   │       ├── screenshot/
│   │       │   └── route.ts      # Playwright screenshots
│   │       ├── approve/
│   │       │   └── route.ts      # Project approval
│   │       └── revalidate/
│   │           └── route.ts      # ISR trigger
│   ├── components/
│   │   ├── HeroSection.tsx       # Featured project banner
│   │   ├── CategoryRow.tsx       # Horizontal scroll row
│   │   ├── ProjectCard.tsx       # Single project card
│   │   ├── ScreenshotCarousel.tsx# Screenshot slider
│   │   ├── ProjectDetail.tsx     # Detail page content
│   │   └── AdminPanel.tsx        # Admin components
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── github.ts             # GitHub API helper
│   │   ├── claude.ts             # Claude AI analysis
│   │   ├── screenshot.ts         # Playwright logic
│   │   └── types.ts              # Shared TypeScript types
│   └── styles/
│       └── globals.css           # Tailwind + custom styles
├── public/
│   └── placeholder.png
├── .env.local                    # API keys (in .gitignore)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Key Directories
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Reusable React components
- `src/lib/` — Shared utilities, API clients, types
- `src/app/api/` — Serverless API endpoints
