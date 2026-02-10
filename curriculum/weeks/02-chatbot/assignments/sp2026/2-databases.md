# Data Persistence

## Overview

Today we're going to extend our chatbot by adding data persistence. This allows us to restart the server without losing all of our previous conversations. We'll also go deeper on the topic of interfaces which allow us to provide different implementations of the same functionality but with different performance characteristics.

## Steps (Morning)

- Currently our chatbot only supports one conversation at a time. For the Tic Tac Toe project, we gave each game a UUID to uniquely identify it. Now we want to do the same for our chats.
  - In your server code, in a new file called `storage.ts`, define a new `interface Storage {...}` with the following methods: `createConversation` (creates a new conversation), `getConversation` (gets an existing conversation by its ID), `getConversations` (gets all conversations), and `addMessageToConversation` (adds a message to a conversation).
    - Consider what parameters these methods should take (probably `conversationId` for a few of them)
    - Consider how you want to handle errors (e.g. `getConversation` called with a conversation ID that doesn't exist). Throw an error, return null, return a `Result` object, something else?
  - Now define a `class InMemoryStorage implements Storage {...}` that implements the methods in the `Storage` interface using in-memory data structures to store the conversations (similar to how you set up Tic Tac Toe). Modify your server code to use an instance of the `InMemoryStorage` class for all data storage operations.
  - Write unit tests that cover the functionality of the `InMemoryStorage` class so you know it works as expected.
  - Now modify your UI to be able to support creating new conversations, showing a list of your existing conversations, and continuing existing conversations (like how the Claude/ChatGPT/etc. interfaces look). Consider using the Shadcn [Drawer](https://ui.shadcn.com/docs/components/radix/drawer) component for the sidebar with the conversation list.
    - Don't spend too long on making it pretty. It's more important to get the key data flows working. Timebox your work if necessary.

## Steps (Afternoon)

- Now that we've got our key `Storage` abstraction in place, let's write a couple implementations that allow us to store data permanently. First we'll use [SQLite](https://en.wikipedia.org/wiki/SQLite) which gives us a SQL interface to query data stored in files.
  - Install the [better-sqlite3](https://www.npmjs.com/package/better-sqlite3) NPM library with `bun install`.
    - [README](https://github.com/WiseLibs/better-sqlite3)
  - Create a `class SqliteStorage implements Storage {...}` and implement the functions of the interface using SQLite.
    - [W3Schools intro to SQL](https://www.w3schools.com/sql/sql_intro.asp)
    - [w3resource intro to SQLite](https://www.w3resource.com/sqlite/snippets/better-sqlite3-library.php)
    - Don't forget to enable [write-ahead logging](https://en.wikipedia.org/wiki/Write-ahead_logging) on your database: `db.pragma('journal_mode = WAL');`
  - Consider what [database tables](<https://en.wikipedia.org/wiki/Table_(database)>) you'll need to set up (probably `Conversations` and `Messages`) and what [columns](<https://en.wikipedia.org/wiki/Column_(database)>) will go in the tables.
    - For `Conversations`, probably `id` and `title`. Maybe `createdAt` timestamp.
    - For `Messages`, probably `id`, `conversationId`, `role`, and `content`. Maybe `createdAt` timestamp.
  - Make sure your existing unit tests pass when they're run against the `SqliteStorage` implementation.
  - In your server code, replace the `InMemoryStorage` instance with a `SqliteStorage` instance and make sure your app still works as expected. Notice how we didn't have to redefine the interface, only swap out the underlying implementation. This is the power of abstraction!
- SQLite is performant and convenient, but it only works if you have access to a disk where you can read and write files. Serverless hosting services like Render don't provide persistent disk storage, so your data will still get wiped out. Also, it's difficult to allow other computers to be able to read/write a specific file on your computer. So now we're going to do the same exercise using a [hosted](https://en.wikipedia.org/wiki/Infrastructure_as_a_service) [PostgreSQL](https://en.wikipedia.org/wiki/PostgreSQL) service called [Supabase](https://supabase.com/) which provides a free tier with 500 MB of persistent storage, enough for our purposes.
  - Sign up for a Supabase account and create a new project.
  - Install the [@supabase/supabase-js](https://www.npmjs.com/package/@supabase/supabase-js) NPM package.
  - Make sure your `.env` contains all the connection information necessary to talk to Supabase.
  - Create a `class SupabaseStorage implements Storage {...}` and implement the functions of the interface using Supabase.
  - You could run your unit test suite against `SupabaseStorage`, though you wouldn't normally do this in a real system because "unit tests" should not invoke dependencies like a networked database. Instead, we would call these "integration tests."
  - In your server code, replace the `SqliteStorage` instance with a `SupabaseStorage` instance and make sure your app still works as expected.
- Bonus: wrap your Claude calls in a new interface and swap in another LLM provider (ChatGPT, Gemini, etc.). Add a model selector to your UI, send the same prompt to multiple providers in parallel (like what [OpenRouter](https://openrouter.ai/) does), make the models talk to each other, or anything else you can think of.
