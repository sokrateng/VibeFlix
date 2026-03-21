# VibeFlix - Task Completion Checklist

When a task is completed, run the following checks:

## 1. Type Check
```bash
npx tsc --noEmit
```

## 2. Lint
```bash
npm run lint
```

## 3. Build
```bash
npm run build
```

## 4. Tests
```bash
npm test
```

## 5. Security Check
- No hardcoded secrets (API keys, tokens)
- All user inputs validated
- Admin routes protected by token
- No sensitive data in error messages

## 6. Code Quality
- No console.log left
- No unused imports
- Immutability patterns used
- Files under 800 lines
- Functions under 50 lines

## 7. Git
- Descriptive commit message (conventional commits)
- No .env files committed
