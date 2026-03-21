# VibeFlix - Project Overview

## Purpose
Netflix-style project catalog for GitHub repositories. Displays vibe coding projects with AI-powered analysis, screenshot carousels, and auto-categorization.

## Owner
GitHub user: sokrateng

## Architecture
Hybrid approach: SSG + API Routes + ISR (Incremental Static Regeneration)

### Flow
1. GitHub Webhook detects new repo push
2. API route fetches repo info from GitHub API
3. Claude API analyzes README + code structure → generates description, category, AI trailer
4. Playwright takes screenshots of live demos
5. Everything saved to Supabase as "pending"
6. Admin reviews and approves via /admin panel
7. ISR revalidates → published on main page

### Data States
NEW → ANALYZING → PENDING_REVIEW → APPROVED → PUBLISHED (or REJECTED)

## Key Features
- Netflix-style UI with hero section + horizontal category rows
- AI-generated project descriptions and "trailers" (summaries)
- Automatic screenshot carousel from live demos
- Semi-automatic: AI proposes, user approves
- Category system: AI suggests, user confirms
- Admin panel with simple ENV token auth
