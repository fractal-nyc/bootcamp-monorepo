# Data Persistence

## Overview

Today we're going to extend our chatbot by adding data persistence. This allows us to restart the server without losing all of our previous conversations. We'll also go deeper on the topic of interfaces which allow us to provide different implementations of the same functionality but with different performance characteristics.

## Steps (Morning)

- Currently our chatbot only supports one conversation at a time. For the Tic Tac Toe project, we gave each game a UUID to uniquely identify it. Now we want to do the same for our chats.
  - In your server code, in a new file called `storage.ts`, define a new `interface Storage {...}` with the following methods: `createConversation` (creates a new conversation), `getConversation` (gets an existing conversation by its ID), `getConversations` (gets all conversations), and `addMessageToConversation` (adds a message to a conversation).
  - Now define a `class InMemoryStorage implements Storage {...}` that implements the methods in the `Storage` interface using in-memory data structures to store the conversations (similar to how you set up Tic Tac Toe). Modify your server code to use an instance of the `InMemoryStorage` class for all data storage operations.
  - Write a series of unit tests that exercise the functionality of the `InMemoryStorage` class so you know it works as expected.
  - Now modify your UI to be able to support creating new conversations, showing a list of your existing conversations, and continuing existing conversations (like how the Claude/ChatGPT/etc. interfaces look). Consider using the Shadcn [Drawer](https://ui.shadcn.com/docs/components/radix/drawer) component for the sidebar with the conversation list.

## Steps (Afternoon)

- Now that we've got our key `Storage` abstraction in place, let's write a couple implementations that allow us to store data permanently. First we'll use [SQLite](https://en.wikipedia.org/wiki/SQLite) which gives us a SQL interface to query data stored in files.
  - Install the [better-sqlite3](https://www.npmjs.com/package/better-sqlite3) NPM library with `bun install`.
    - [README](https://github.com/WiseLibs/better-sqlite3)
  - Create a `class SqliteStorage implements Storage {...}` and implement the functions of the interface using SQLite.
    - [W3Schools intro to SQL](https://www.w3schools.com/sql/sql_intro.asp)
    - [w3resource intro to SQLite](https://www.w3resource.com/sqlite/snippets/better-sqlite3-library.php)
    - Don't forget to enable [write-ahead logging](https://en.wikipedia.org/wiki/Write-ahead_logging) on your database: `db.pragma('journal_mode = WAL');`
  - Make sure your existing unit tests pass when they're run against the `SqliteStorage` implementation.
  - Make sure your app still works as expected when using `SqliteStorage`.
- SQLite is performant and convenient, but it only works if you have access to a disk where you can read and write files. Serverless hosting services like Render don't provide persistant disk storage, so your data will still get wiped out. 
- Bonus: wrap your Claude calls in a new interface and swap in another LLM provider (ChatGPT, Gemini, etc.). Add a model selector to your UI, send the same prompt to multiple providers in parallel (like what [OpenRouter](https://openrouter.ai/) does), make the models talk to each other, or anything else you can think of.
