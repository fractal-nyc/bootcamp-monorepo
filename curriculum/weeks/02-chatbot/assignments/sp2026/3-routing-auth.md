# Routing and Auth

## Overview

Today we're going to add authentication to our chatbot so we can support multiple users without letting them read each other's converations. We'll also add routing so the browser back/forward buttons work to move between conversations.

## Steps (Morning)

- Install React Router in your project: https://reactrouter.com/start/declarative/installation
  - We'll be using it in Declarative Mode since it introduces the fewest new concepts but still works for our use case.
- Our first goal is to be able to use the browser's back and forward buttons to navigate between conversations.
  - Wrap your `<App />` component in a `<BrowserRouter>`. This embeds your app in a context that gives it access to React Router's power. Verify that it renders the same way as before.
  - Next, move `<App />` to a `<Route>` inside a `<Routes>`: https://reactrouter.com/start/declarative/routing#configuring-routes
  - Next, use [Dynamic Segments](https://reactrouter.com/start/declarative/routing#dynamic-segments) to route between different conversations while keeping the sidebar in place.
    - As a reference, notice the URL structure that Claude Web uses for conversations: https://claude.ai/chat/:chatId
    - An empty chat is just https://claude.ai/new.
    - ...and if you go to https://claude.ai/chat (no :chatId), it takes you to /new.

## Steps (Afternoon)

- Install Better-Auth in your project: https://www.better-auth.com/docs/installation.
  - Set up the required database and tables.
  - If you have a `conversations` table, you'll need to add a `user_id` column if you haven't already. You can do this with the Supabase UI or by running an [ALTER TABLE](https://platform.claude.com/docs/en/build-with-claude/streaming) SQL command.
- Follow the [Basic Usage](https://www.better-auth.com/docs/basic-usage) guide to integrating Better-Auth login into your app. Support logins for at least username+password and one social login.
  - Use React Router to manage navigation between pages at the following URLs:
    - `/`: login page
    - `/new`: empty conversation belonging to the current user. Make sure the corresponding API endpoint is inaccessible to non-logged-in users.
      - When a user sends the first message in a new chat, create the conversation and route them to the appropriate `/chat/:chatId` URL.
    - `/chat/:chatId`: UI for showing a given conversation belonging to the currently logged-in user. Make sure the API endpoint disallows loading conversations belonging to other users.
  - Add a "Logout" button that returns the user to `/` no matter what page they're on.
- Bonus: extend your chatbot's unique capabilities by adding [tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview).
  - Primer on tool use vs. MCP at tool-calling-vs-mcp-primer.md.
