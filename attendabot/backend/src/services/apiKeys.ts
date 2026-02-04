/**
 * @fileoverview Service for validating API keys.
 * The key is read from the API_KEY environment variable (set via attendabot/env secret).
 */

/** Cached API key from environment. */
let apiKey: string | null = null;

/** Loads the API key from the environment. */
export function initApiKeys(): void {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("API_KEY not set — API key auth disabled");
    return;
  }
  apiKey = key;
  console.log("API key loaded from environment");
}

/** Returns true if the given key is a valid API key. */
export function validateApiKey(key: string): boolean {
  return apiKey !== null && key === apiKey;
}
