# VibeFlix - Style & Conventions

## Language
- TypeScript strict mode for all files
- Typed interfaces for all API request/response objects

## Code Style
- Immutability: never mutate, always create new objects
- Files: 200-400 lines typical, 800 max
- Functions: <50 lines
- No console.log in production code
- No hardcoded values — use constants or env vars

## Naming
- Components: PascalCase (ProjectCard.tsx)
- Utilities/lib: camelCase (supabase.ts, github.ts)
- API routes: kebab-case folders (api/webhook/route.ts)
- Types: PascalCase with descriptive names (Project, Screenshot, Category)

## File Organization
- Feature/domain based under src/
- Components in src/components/
- Shared logic in src/lib/
- Types in src/lib/types.ts

## Error Handling
- try/catch on all async operations
- User-friendly error messages in UI
- Detailed logging server-side
- Input validation with Zod at API boundaries

## API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```
