# Week 2 - Chatbot

## Pre-work

- Grokking Simplicity Ch 3
- [Next.js App Router Tutorial](https://nextjs.org/learn/dashboard-app)

## Monday

Your app:

- Uses t3.gg, Next.js, Vercel AI's `useChat`, and `shadcn` components
- Lets users chat with an AI
- Streams responses from the AI
- has unique chats (e.g. I can open a new chat, get redirected to `/chat/abc-123`, and go back to that URL later and continue the work)
  - (this can happen via local files for now)
- Has nice styling using `shadcn`

### Instructions

- Create a Next.js app using the [t3.gg project template](https://create.t3.gg/)
- [Set up the Vercel AI + Next.js integration](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- Run through the first few pages of the [Vercel AI UI Tutorial](https://ai-sdk.dev/docs/ai-sdk-ui/overview)
  - Complete through the part about [message persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
- Learn about [shadcn](https://ui.shadcn.com/) UI components and use them in your own app

### Readings

- (15 min) [Introduction to tRPC](https://www.youtube.com/watch?v=2LYM8gf184U)
- (20 min) Look around at the [tRPC basics](https://trpc.io/docs/concepts)

### Notes

- Inspriation: ![image](https://github.com/user-attachments/assets/df663db2-62fa-48a8-b182-cc07fa3b0dc8)

## Tuesday

Your app:

- has at least one tool the AI can use
- uses tRPC to communicate with the server (when necessary)
- stores all chats in a database

### Instructions

- Add [tool usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage) to your chatbot if not already available
- Replace chat storage from a file system with Supabase/PostgreSQL
- Use tRPC to make requests to your server
- Bonus: allow selecting from a list of multiple AI agents

### Readings

- TODO: something about https://next-auth.js.org/providers/credentials or email provider

## Wednesday

Your app:

- has a login/logout button that takes user/password or email magic links 
  - Bonus: or add login via other providers
- Chats are stored on a per-user basis (make sure security is good!)
- has a screen where a user can see all their chats

### Instructions
  
- Use [NextAuth](https://next-auth.js.org/) to add user creation and login
- Update your database schema to support storing, querying, and filtering chats per-user

### Readings

- TODO: something about full text search and indexes

## Thursday

Your app:

- supports full-text search

### Instructions

- TODO
