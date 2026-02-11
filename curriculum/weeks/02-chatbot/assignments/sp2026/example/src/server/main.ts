/**
 * Express server for the chatbot application.
 *
 * This file sets up the HTTP endpoints that the React frontend calls.
 * It uses the Anthropic SDK to communicate with Claude and the Storage
 * interface to persist conversations.
 */

import "dotenv/config"; // Loads variables from .env into process.env.
import express from "express";
import ViteExpress from "vite-express";
import Anthropic from "@anthropic-ai/sdk";
import { InMemoryStorage } from "./storage.js";

const app = express();
const PORT = 3000;

// Parse JSON request bodies so we can read `req.body` in our POST handlers.
app.use(express.json());

// ─── Anthropic SDK Setup ─────────────────────────────────────────────────────

// The SDK automatically reads ANTHROPIC_API_KEY from the environment.
// We configured that in our .env file and loaded it with dotenv above.
const anthropic = new Anthropic();

// Use Haiku — it's fast and cheap, perfect for development.
const MODEL = "claude-haiku-4-5-20251001";

// ─── Storage Setup ───────────────────────────────────────────────────────────

// InMemoryStorage is fine for development. In the afternoon assignment, you'll
// swap this out for SqliteStorage or SupabaseStorage — and nothing else in
// this file needs to change. That's the power of programming to an interface!
const storage = new InMemoryStorage();

// ─── API Endpoints ───────────────────────────────────────────────────────────

/**
 * GET /api/conversations
 * Returns all conversations (metadata only, no full message history).
 */
app.get("/api/conversations", async (_req, res) => {
  const conversations = await storage.getConversations();
  res.json(conversations);
});

/**
 * POST /api/conversations
 * Creates a new conversation. Optionally accepts a `title` in the body.
 */
app.post("/api/conversations", async (req, res) => {
  const title = req.body.title || "New Chat";
  const conversation = await storage.createConversation(title);
  res.json(conversation);
});

/**
 * GET /api/conversations/:id
 * Returns a single conversation with its full message history.
 */
app.get("/api/conversations/:id", async (req, res) => {
  const conversation = await storage.getConversation(req.params.id);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(conversation);
});

/**
 * POST /api/chat
 * The main chat endpoint. Accepts a conversationId and a user message,
 * sends the full conversation history to Claude, and returns the response.
 *
 * Request body: { conversationId: string, message: string }
 * Response:     { response: string, conversation: Conversation }
 */
app.post("/api/chat", async (req, res) => {
  const { conversationId, message } = req.body;

  if (!conversationId || !message) {
    res.status(400).json({ error: "conversationId and message are required" });
    return;
  }

  // Look up the conversation so we can include its history.
  const conversation = await storage.getConversation(conversationId);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save the user's message first.
  await storage.addMessageToConversation(conversationId, {
    role: "user",
    content: message,
  });

  // ── Call the Claude API ──
  // IMPORTANT: The Messages API is **stateless**. It doesn't remember previous
  // turns — we have to send the entire message history every time. That's why
  // we store messages in our Storage and pass them all here.
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: conversation.messages, // Already includes the user message we just added.
    });

    // Extract the text from Claude's response. The API returns an array of
    // content blocks; we grab the first text block.
    const assistantMessage =
      response.content[0].type === "text"
        ? response.content[0].text
        : "Sorry, I received a non-text response.";

    // Save Claude's response to the conversation history.
    const updatedConversation = await storage.addMessageToConversation(
      conversationId,
      { role: "assistant", content: assistantMessage }
    );

    res.json({ response: assistantMessage, conversation: updatedConversation });
  } catch (error) {
    console.error("Claude API error:", error);
    res.status(500).json({ error: "Failed to get response from Claude" });
  }
});

/**
 * POST /api/conversations/:id/reset
 * Clears all messages in a conversation so the user can start fresh
 * without creating a whole new conversation.
 */
app.post("/api/conversations/:id/reset", async (req, res) => {
  const conversation = await storage.getConversation(req.params.id);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  // Clear the message history in-place.
  conversation.messages = [];
  res.json({ message: "Conversation reset", conversation });
});

// ─── Start the Server ────────────────────────────────────────────────────────

// ViteExpress wires up Vite's dev server (for hot-reload) alongside Express.
// In production, it serves the built static files from dist/.
ViteExpress.listen(app, PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
