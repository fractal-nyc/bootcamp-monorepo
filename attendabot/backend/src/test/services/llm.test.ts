/**
 * @fileoverview Tests for the LLM service (services/llm.ts).
 * Mocks fetch to avoid actual API calls.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isLLMConfigured,
  generateStudentSummary,
  generateCohortSentiment,
} from "../../services/llm";

// Store originals for restoration
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

describe("LLM Service", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  describe("isLLMConfigured", () => {
    it("returns false when GEMINI_API_KEY is not set", () => {
      delete process.env.GEMINI_API_KEY;

      expect(isLLMConfigured()).toBe(false);
    });

    it("returns true when GEMINI_API_KEY is set", () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      expect(isLLMConfigured()).toBe(true);
    });
  });

  describe("generateStudentSummary", () => {
    it("throws when LLM not configured", async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(
        generateStudentSummary("Test Student", [])
      ).rejects.toThrow("LLM not configured");
    });

    it("returns default message for empty feed data", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const result = await generateStudentSummary("Test Student", []);

      expect(result).toBe("No data available for analysis.");
    });

    it("calls Gemini API with formatted prompt", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [
            {
              content: {
                parts: [{ text: "Generated summary text" }],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 50,
          },
        }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const feedItems = [
        {
          type: "eod" as const,
          id: "eod_1",
          content: "Worked on authentication today",
          author: "student",
          created_at: "2024-01-15T17:00:00Z",
        },
        {
          type: "note" as const,
          id: "note_1",
          content: "Making good progress",
          author: "instructor",
          created_at: "2024-01-14T10:00:00Z",
        },
      ];

      const result = await generateStudentSummary("John Doe", feedItems);

      expect(result).toBe("Generated summary text");
      expect(fetch).toHaveBeenCalledTimes(1);

      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain("gemini");
      expect(fetchCall[0]).toContain("test-api-key");

      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.contents[0].parts[0].text).toContain("John Doe");
      expect(body.contents[0].parts[0].text).toContain("Worked on authentication today");
    });

    it("handles API errors", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Internal Server Error"),
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const feedItems = [
        {
          type: "eod" as const,
          id: "eod_1",
          content: "Test content",
          author: "student",
          created_at: "2024-01-15T17:00:00Z",
        },
      ];

      await expect(
        generateStudentSummary("Test", feedItems)
      ).rejects.toThrow("Gemini API error");
    });

    it("handles timeout errors", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const abortError = new Error("Aborted");
      abortError.name = "AbortError";

      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const feedItems = [
        {
          type: "eod" as const,
          id: "eod_1",
          content: "Test",
          author: "student",
          created_at: "2024-01-15T17:00:00Z",
        },
      ];

      await expect(
        generateStudentSummary("Test", feedItems)
      ).rejects.toThrow("LLM request timed out");
    });
  });

  describe("generateCohortSentiment", () => {
    it("throws when LLM not configured", async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(generateCohortSentiment([])).rejects.toThrow("LLM not configured");
    });

    it("returns default message for empty EOD messages", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const result = await generateCohortSentiment([]);

      expect(result).toBe("No EOD data available for this day.");
    });

    it("calls Gemini API with formatted EOD messages", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [
            {
              content: {
                parts: [{ text: "Overall positive sentiment" }],
              },
            },
          ],
        }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const eodMessages = [
        {
          author_id: "user-1",
          content: "Had a productive day!",
          created_at: "2024-01-15T17:00:00Z",
        },
        {
          author_id: "user-2",
          content: "Struggled with the assignment",
          created_at: "2024-01-15T17:30:00Z",
        },
      ];

      const result = await generateCohortSentiment(eodMessages);

      expect(result).toBe("Overall positive sentiment");

      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.contents[0].parts[0].text).toContain("Had a productive day!");
      expect(body.contents[0].parts[0].text).toContain("Struggled with the assignment");
    });

    it("handles missing text in response", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [],
        }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const eodMessages = [
        {
          author_id: "user-1",
          content: "Test",
          created_at: "2024-01-15T17:00:00Z",
        },
      ];

      const result = await generateCohortSentiment(eodMessages);

      expect(result).toBe("");
    });
  });

  describe("GeminiProvider configuration", () => {
    it("uses correct API endpoint", async () => {
      process.env.GEMINI_API_KEY = "test-key";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{ content: { parts: [{ text: "test" }] } }],
        }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      await generateCohortSentiment([
        { author_id: "1", content: "test", created_at: "2024-01-15T00:00:00Z" },
      ]);

      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("generativelanguage.googleapis.com");
      expect(url).toContain("gemini");
      expect(url).toContain("generateContent");
    });

    it("sets correct request headers and body format", async () => {
      process.env.GEMINI_API_KEY = "test-key";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{ content: { parts: [{ text: "test" }] } }],
        }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      await generateCohortSentiment([
        { author_id: "1", content: "test", created_at: "2024-01-15T00:00:00Z" },
      ]);

      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
      const options = mockFetch.mock.calls[0][1];
      expect(options?.method).toBe("POST");
      expect(options?.headers).toEqual({ "Content-Type": "application/json" });

      const body = JSON.parse(options?.body as string);
      expect(body.contents).toBeDefined();
      expect(body.generationConfig).toBeDefined();
      expect(body.generationConfig.maxOutputTokens).toBeDefined();
      expect(body.generationConfig.temperature).toBeDefined();
    });
  });
});
