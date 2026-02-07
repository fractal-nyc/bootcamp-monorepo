# Data Persistence – Lecture Notes

## Core Concepts

- Data persistence: surviving server restarts
- Interfaces: same contract, different implementations
- The power of swapping implementations without changing the rest of your code

## Morning: Interface & In-Memory Implementation

- Define a `Storage` interface in `storage.ts` with methods:
  - `createConversation`
  - `getConversation` (by ID)
  - `getConversations` (all)
  - `addMessageToConversation`
- Design decision: how to handle errors (throw, return null, Result object)
- `InMemoryStorage implements Storage` — same pattern as Tic Tac Toe
- Write unit tests against `InMemoryStorage`
- UI: conversation sidebar (create, list, continue) — timebox the polish, prioritize data flow

## Afternoon: SQLite

- SQLite = SQL interface to a local file
- Install `better-sqlite3`, enable WAL mode
- Schema design: what tables and columns?
  - `Conversations`: id, title, createdAt
  - `Messages`: id, conversationId, role, content, createdAt
- `SqliteStorage implements Storage`
- Existing unit tests should pass with no changes — this is the payoff of the interface pattern
- Swap `InMemoryStorage` → `SqliteStorage` in server code, everything still works

## Afternoon: Supabase (Hosted PostgreSQL)

- Why not just SQLite? No persistent disk on serverless hosts, hard to share across machines
- Supabase: hosted Postgres, free tier, 500 MB
- Connection info goes in `.env` (same pattern as API keys from yesterday)
- `SupabaseStorage implements Storage`
- Running tests against it = integration tests, not unit tests (useful vocabulary distinction)
- Swap again, everything still works

## Key Takeaway

- Three implementations, one interface — server code and UI didn't change
- This is the core value of programming to an interface

## Bonus

- Same pattern applies to LLM providers: wrap Claude in an interface, swap in GPT/Gemini
