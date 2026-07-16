# BRO.chat

Your God-tier digital bro & AI co-pilot. A neon cyberpunk AI chat app with real-time streaming, conversation history, and high-energy vibes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/bro-chat run dev` — run the frontend (port 20480)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI API key for AI chat

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS v4, wouter, framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (conversations + messages tables)
- AI: OpenAI SDK (gpt-4o-mini, SSE streaming)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bro-chat/src/` — React frontend
- `artifacts/api-server/src/routes/openai/` — chat API routes (SSE streaming)
- `lib/db/src/schema/conversations.ts` + `messages.ts` — DB schema
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)

## Architecture decisions

- AI chat uses SSE (server-sent events) for real-time token streaming — client reads via ReadableStream, not EventSource (EventSource doesn't support POST)
- Conversations and messages are persisted to PostgreSQL via Drizzle ORM
- OpenAI SDK used directly with OPENAI_API_KEY (not via Replit AI integration proxy)
- System prompt enforces the "God-tier digital bro" persona
- Frontend uses wouter for lightweight routing

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- SSE endpoint (`POST /api/openai/conversations/:id/messages`) streams tokens — do NOT use the generated React Query hook for this endpoint, use fetch + ReadableStream directly
- After OpenAPI spec changes, always run codegen before building the frontend
