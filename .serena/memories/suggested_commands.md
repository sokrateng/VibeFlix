# VibeFlix - Suggested Commands

## Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

## Testing
```bash
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Database
```bash
# Supabase CLI (if installed)
npx supabase start   # Local Supabase
npx supabase db push # Push migrations
```

## Git
```bash
git status           # Check status
git diff             # See changes
git log --oneline -10 # Recent commits
```

## System (Windows)
```bash
ls                   # List files (Git Bash)
cat <file>           # Read file
cd <dir>             # Change directory
```

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ANTHROPIC_API_KEY=xxx
GITHUB_WEBHOOK_SECRET=xxx
ADMIN_TOKEN=xxx
```
