/**
 * Unit tests for the InMemoryStorage class.
 *
 * These tests verify that our Storage interface implementation works correctly.
 * When you later implement SqliteStorage or SupabaseStorage, you can run the
 * same tests against those implementations to make sure they behave identically.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryStorage } from "./storage.js";

describe("InMemoryStorage", () => {
  let storage: InMemoryStorage;

  // Create a fresh storage instance before each test so tests don't affect
  // each other. This is a common pattern called "test isolation."
  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  // ─── createConversation ──────────────────────────────────────────────

  it("should create a conversation with an ID and title", async () => {
    const conversation = await storage.createConversation("My Chat");

    expect(conversation.id).toBeDefined();
    expect(conversation.title).toBe("My Chat");
    expect(conversation.messages).toEqual([]);
    expect(conversation.createdAt).toBeInstanceOf(Date);
  });

  it("should create conversations with unique IDs", async () => {
    const first = await storage.createConversation("Chat 1");
    const second = await storage.createConversation("Chat 2");

    expect(first.id).not.toBe(second.id);
  });

  // ─── getConversation ─────────────────────────────────────────────────

  it("should retrieve a conversation by ID", async () => {
    const created = await storage.createConversation("Test");
    const retrieved = await storage.getConversation(created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(created.id);
    expect(retrieved!.title).toBe("Test");
  });

  it("should return null for a non-existent conversation ID", async () => {
    const result = await storage.getConversation("does-not-exist");
    expect(result).toBeNull();
  });

  // ─── getConversations ────────────────────────────────────────────────

  it("should return an empty array when no conversations exist", async () => {
    const conversations = await storage.getConversations();
    expect(conversations).toEqual([]);
  });

  it("should return all conversations sorted newest-first", async () => {
    const first = await storage.createConversation("First");
    const second = await storage.createConversation("Second");

    const conversations = await storage.getConversations();

    expect(conversations).toHaveLength(2);
    // Newest (second) should come first in the list.
    expect(conversations[0].id).toBe(second.id);
    expect(conversations[1].id).toBe(first.id);
  });

  // ─── addMessageToConversation ────────────────────────────────────────

  it("should add a message to an existing conversation", async () => {
    const conversation = await storage.createConversation("Chat");

    const updated = await storage.addMessageToConversation(conversation.id, {
      role: "user",
      content: "Hello!",
    });

    expect(updated.messages).toHaveLength(1);
    expect(updated.messages[0]).toEqual({ role: "user", content: "Hello!" });
  });

  it("should preserve message order across multiple additions", async () => {
    const conversation = await storage.createConversation("Chat");

    await storage.addMessageToConversation(conversation.id, {
      role: "user",
      content: "Hi",
    });
    await storage.addMessageToConversation(conversation.id, {
      role: "assistant",
      content: "Hello! How can I help?",
    });
    await storage.addMessageToConversation(conversation.id, {
      role: "user",
      content: "What is TypeScript?",
    });

    const retrieved = await storage.getConversation(conversation.id);
    expect(retrieved!.messages).toHaveLength(3);
    expect(retrieved!.messages[0].role).toBe("user");
    expect(retrieved!.messages[1].role).toBe("assistant");
    expect(retrieved!.messages[2].role).toBe("user");
  });

  it("should throw an error when adding to a non-existent conversation", async () => {
    await expect(
      storage.addMessageToConversation("bad-id", {
        role: "user",
        content: "Hello",
      })
    ).rejects.toThrow("Conversation not found: bad-id");
  });
});
