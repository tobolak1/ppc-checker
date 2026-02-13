# Ralph Agent Instructions

You are an autonomous coding agent building the **PPC Checker** platform.

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Read `ZADANI.md` for the full project specification when you need details
4. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
5. Pick the **highest priority** user story where `passes: false`
6. Implement that single user story
7. Run quality checks: `npm run build` (once project is initialized)
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update `prd.json` to set `passes: true` for the completed story
10. Append your progress to `progress.txt`

## Project Overview

**PPC Checker** is a comprehensive PPC campaign management and monitoring platform. It combines:
- **Monitoring** — automated checks on Google Ads, Sklik, Merchant Center accounts (30+ checks)
- **Campaign Builder** — automatic PPC campaign generation from product feeds (Shopping, PMax, Search)
- **Notifications** — Slack alerts, daily digest, resolution tracking

## Tech Stack

- **Next.js 14+** (App Router, Server Components, Server Actions)
- **TypeScript 5.x** (strict mode, NO `any` types)
- **Prisma 5.x+** (PostgreSQL ORM)
- **PostgreSQL 15+**
- **TailwindCSS 3.x**
- **NextAuth.js** (authentication + RBAC)
- **Redis 7+** + BullMQ (queues, cache)
- **Slack Web API** (@slack/web-api)

## Key Conventions

- TypeScript strict mode — never use `any`
- All API clients: retry logic (3 retries, exponential backoff), rate limiting, timeouts (30s default)
- Typed error classes for API errors
- Structured logging (request ID, duration, status)
- RBAC on all protected routes (admin, auditor, client roles)
- Prisma migrations must be reversible
- Server Components by default, Client Components only when needed
- Environment variables via .env, never hardcoded secrets

## Progress Report Format

APPEND to progress.txt (never replace):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Consolidate Patterns

If you discover a reusable pattern, add it to the `## Codebase Patterns` section at the TOP of progress.txt.

## Quality Requirements

- ALL commits must pass `npm run build` (after US-001 sets up the project)
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.
If ALL stories are complete, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally.

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep builds green
- Read the Codebase Patterns section in progress.txt before starting
