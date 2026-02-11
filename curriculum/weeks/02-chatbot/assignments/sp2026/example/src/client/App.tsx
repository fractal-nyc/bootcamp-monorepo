/**
 * Main chat application component.
 *
 * This is a single-page app with two panels:
 *   1. A sidebar listing all conversations (with a "New Chat" button).
 *   2. A main area showing the selected conversation's messages and an input.
 *
 * State management is done with React's built-in useState and useEffect hooks.
 * Data flows like this:
 *
 *   [React State] --fetch--> [Express Server] --SDK--> [Claude API]
 *       ^                          |
 *       └──── JSON response ───────┘
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "./components/ui/button.js";
import { Card, CardContent } from "./components/ui/card.js";
import { ScrollArea } from "./components/ui/scroll_area.js";
import { Textarea } from "./components/ui/textarea.js";

// ─── Types ───────────────────────────────────────────────────────────────────

// These mirror the types defined on the server in storage.ts.
// In a larger app you'd share types via a shared package, but for now
// duplicating them keeps things simple.

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string; // JSON serializes Date as a string.
}

// ─── App Component ───────────────────────────────────────────────────────────

export function App() {
  // ── State ──
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ref to the bottom of the message list so we can auto-scroll.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load conversations on mount ──
  useEffect(() => {
    fetchConversations();
  }, []);

  // ── Auto-scroll when messages change ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Data Fetching Helpers ──

  async function fetchConversations() {
    const response = await fetch("/api/conversations");
    const data: Conversation[] = await response.json();
    setConversations(data);
  }

  /** Load a conversation's messages and set it as active. */
  async function selectConversation(id: string) {
    const response = await fetch(`/api/conversations/${id}`);
    const data: Conversation = await response.json();
    setActiveConversationId(data.id);
    setMessages(data.messages);
  }

  /** Create a new conversation, then select it. */
  async function createConversation() {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const data: Conversation = await response.json();
    // Refresh the sidebar list and switch to the new conversation.
    await fetchConversations();
    setActiveConversationId(data.id);
    setMessages([]);
  }

  /** Send a message to the /api/chat endpoint. */
  async function sendMessage() {
    if (!input.trim() || !activeConversationId) return;

    const userMessage = input.trim();
    setInput(""); // Clear the input immediately for better UX.
    setIsLoading(true);

    // Optimistically show the user's message before waiting for Claude.
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Replace messages with the full server-side history (source of truth).
        setMessages(data.conversation.messages);
      } else {
        // Show the error as an assistant message so the user sees it inline.
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to reach the server." },
      ]);
    } finally {
      setIsLoading(false);
      // Refresh sidebar in case the conversation title was updated.
      fetchConversations();
    }
  }

  /** Handle Enter key to send (Shift+Enter for newline). */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Render ──

  return (
    <div className="flex h-screen bg-background">
      {/* ── Sidebar: Conversation List ── */}
      <div className="w-64 border-r bg-muted/40 flex flex-col">
        <div className="p-4">
          <Button onClick={createConversation} className="w-full">
            + New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2 pb-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                  conv.id === activeConversationId
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <>
            {/* Message display */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground mt-8">
                    Send a message to start the conversation.
                  </p>
                )}

                {messages.map((msg, index) => (
                  <Card
                    key={index}
                    className={
                      msg.role === "user" ? "ml-12 bg-primary/5" : "mr-12"
                    }
                  >
                    <CardContent>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {msg.role === "user" ? "You" : "Claude"}
                      </p>
                      {/* Preserve whitespace and line breaks in messages. */}
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {/* Invisible div that we scroll into view. */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t p-4">
              <div className="max-w-2xl mx-auto flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                  disabled={isLoading}
                  className="resize-none"
                  rows={2}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="lg"
                >
                  {isLoading ? "..." : "Send"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          // No conversation selected — show a welcome prompt.
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <h2 className="text-2xl font-semibold mb-2">Chatbot</h2>
              <p>Create a new chat or select an existing one to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
