/**
 * @fileoverview LLM service with provider abstraction for generating AI summaries
 * and sentiment analysis. Currently supports Google Gemini.
 */

import type { FeedItem, BriefingMessageRecord } from "./db";

// ============================================================================
// Types
// ============================================================================

/** Options for an LLM completion request. */
export interface CompletionOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

/** Response from an LLM completion request. */
export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/** Interface for LLM providers. */
export interface LLMProvider {
  complete(options: CompletionOptions): Promise<LLMResponse>;
}

// ============================================================================
// Prompts
// ============================================================================

const STUDENT_SUMMARY_PROMPT = `You are an assistant helping bootcamp instructors understand their students' progress.

Analyze the following data about a student (their EOD messages and instructor notes) and provide a brief summary covering:
1. Overall sentiment and morale
2. Skills being developed (based on what they're working on)
3. Areas that might need attention or support

Keep the summary concise (2-3 short paragraphs). Focus on actionable insights for instructors.
Be supportive but honest in your assessment.

Student: {studentName}

Activity data (EOD messages and instructor notes, most recent first):
{feedData}

Provide your summary:`;

const COHORT_SENTIMENT_PROMPT = `You are an assistant helping bootcamp instructors understand the overall mood and progress of their cohort.

Analyze the following EOD (end-of-day) messages from students and provide a brief sentiment analysis covering:
1. Overall mood and morale of the cohort
2. Common themes or challenges being faced
3. Any concerns that might need instructor attention

Keep the analysis concise (2-3 short sentences). Focus on patterns across students rather than individual issues.

EOD messages from the cohort for this day:
{eodMessages}

Provide your sentiment analysis:`;

// ============================================================================
// Gemini Provider
// ============================================================================

const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_DEFAULT_MODEL = "gemini-3-flash-preview";
const GEMINI_TIMEOUT_MS = 30000;

/** Gemini LLM provider using the REST API. */
class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = GEMINI_DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(options: CompletionOptions): Promise<LLMResponse> {
    const url = `${GEMINI_API_ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: options.prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: options.maxTokens ?? 1024,
            temperature: options.temperature ?? 0.7,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorBody);
        console.error("Request URL:", url.replace(this.apiKey, "***"));
        throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();

      // Extract text from Gemini response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Extract usage if available
      const usage = data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount ?? 0,
            completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
          }
        : undefined;

      return { text, usage };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("LLM request timed out");
      }
      throw error;
    }
  }
}

// ============================================================================
// Provider Management
// ============================================================================

/** Returns the configured LLM provider, or null if not configured. */
function getProvider(): LLMProvider | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GeminiProvider(apiKey);
}

/** Returns whether an LLM provider is configured. */
export function isLLMConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// ============================================================================
// High-Level Functions
// ============================================================================

/**
 * Generates an AI summary for a student based on their feed items.
 * @param studentName - The student's name.
 * @param feedItems - The student's EOD messages and instructor notes.
 * @returns The generated summary or an error message.
 */
export async function generateStudentSummary(
  studentName: string,
  feedItems: FeedItem[],
): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    throw new Error("LLM not configured");
  }

  if (feedItems.length === 0) {
    return "No data available for analysis.";
  }

  // Format feed data for the prompt
  const feedData = feedItems
    .map((item) => {
      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const typeLabel = item.type === "eod" ? "EOD" : "Note";
      return `[${date}] ${typeLabel}: ${item.content}`;
    })
    .join("\n\n");

  const prompt = STUDENT_SUMMARY_PROMPT.replace(
    "{studentName}",
    studentName,
  ).replace("{feedData}", feedData);

  try {
    const response = await provider.complete({ prompt, maxTokens: 4096 });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating student summary:", error);
    throw error;
  }
}

/**
 * Generates a cohort sentiment analysis based on EOD messages.
 * @param eodMessages - The EOD messages from the cohort for a specific day.
 * @returns The generated sentiment analysis or an error message.
 */
export async function generateCohortSentiment(
  eodMessages: BriefingMessageRecord[],
): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    throw new Error("LLM not configured");
  }

  if (eodMessages.length === 0) {
    return "No EOD data available for this day.";
  }

  // Format EOD messages for the prompt
  const messagesText = eodMessages.map((msg) => `- ${msg.content}`).join("\n");

  const prompt = COHORT_SENTIMENT_PROMPT.replace("{eodMessages}", messagesText);

  try {
    const response = await provider.complete({ prompt, maxTokens: 2048 });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating cohort sentiment:", error);
    throw error;
  }
}
