/**
 * Storage layer for chat conversations.
 *
 * This module defines a `Storage` interface that abstracts how conversations
 * and messages are persisted. By programming against the interface (rather
 * than a concrete class), we can swap implementations without changing the
 * rest of the server code — e.g. switch from in-memory to SQLite to Supabase.
 */

import { v4 as uuidv4 } from "uuid";

// ─── Data Types ──────────────────────────────────────────────────────────────

/** A single message in a conversation (matches the Anthropic API format). */
export interface Message {
  role: "user" | "assistant";
  content: string;
}

/** A conversation with its full message history. */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// ─── Storage Interface ───────────────────────────────────────────────────────

/**
 * Defines the contract for any storage backend. Each method is async so that
 * implementations can perform I/O (database queries, network requests, etc.)
 * without blocking.
 */
export interface Storage {
  /** Create a new empty conversation. Returns the created conversation. */
  createConversation(title: string): Promise<Conversation>;

  /** Retrieve a single conversation by ID. Returns null if not found. */
  getConversation(conversationId: string): Promise<Conversation | null>;

  /** Retrieve all conversations (without full message history for efficiency). */
  getConversations(): Promise<Conversation[]>;

  /** Append a message to an existing conversation. Returns the updated conversation. */
  addMessageToConversation(
    conversationId: string,
    message: Message
  ): Promise<Conversation>;
}

// ─── In-Memory Implementation ────────────────────────────────────────────────

/**
 * Stores conversations in a plain Map. Fast and simple, but all data is lost
 * when the server restarts. Great for development and testing.
 *
 * In the afternoon assignment, you'll implement `SqliteStorage` and
 * `SupabaseStorage` that keep data across restarts.
 */
export class InMemoryStorage implements Storage {
  // A Map gives us O(1) lookups by conversation ID.
  private conversations = new Map<string, Conversation>();

  async createConversation(title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: uuidv4(),
      title,
      messages: [],
      createdAt: new Date(),
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.conversations.get(conversationId) ?? null;
  }

  async getConversations(): Promise<Conversation[]> {
    // JavaScript Maps preserve insertion order, so we reverse to get
    // newest-first. (We avoid sorting by timestamp because two conversations
    // created in the same millisecond would have an unstable order.)
    return Array.from(this.conversations.values()).reverse();
  }

  async addMessageToConversation(
    conversationId: string,
    message: Message
  ): Promise<Conversation> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    conversation.messages.push(message);
    return conversation;
  }
}
