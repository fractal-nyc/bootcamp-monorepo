/**
 * @fileoverview Service for loading and validating API keys from AWS Secrets Manager.
 * Keys are cached in memory at startup.
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const SECRET_ID = "attendabot/api-keys";

/** Cached set of valid API keys. */
let validKeys: Set<string> = new Set();

/** Loads API keys from AWS Secrets Manager into memory. */
export async function initApiKeys(): Promise<void> {
  const region = process.env.AWS_REGION || "us-east-1";
  const client = new SecretsManagerClient({ region });

  try {
    const result = await client.send(
      new GetSecretValueCommand({ SecretId: SECRET_ID }),
    );

    if (!result.SecretString) {
      console.warn("API keys secret is empty — API key auth disabled");
      return;
    }

    const parsed = JSON.parse(result.SecretString);
    const keys: string[] = parsed.keys;

    if (!Array.isArray(keys) || keys.length === 0) {
      console.warn("No API keys found in secret — API key auth disabled");
      return;
    }

    validKeys = new Set(keys);
    console.log(`Loaded ${validKeys.size} API key(s) from Secrets Manager`);
  } catch (error) {
    console.warn("Failed to load API keys from Secrets Manager — API key auth disabled:", error);
  }
}

/** Returns true if the given key is a valid API key. */
export function validateApiKey(key: string): boolean {
  return validKeys.has(key);
}
