/**
 * @fileoverview Frontend feature flags.
 *
 * Flags are evaluated at build time via Vite's import.meta.env.
 * Add new flags here as named exports.
 */

/**
 * When true, BetterAuth (Discord OAuth) login is required to access the app.
 * Automatically disabled on the local Vite dev server so you can develop
 * without setting up OAuth. Enabled in all production builds.
 */
export const REQUIRE_LOGIN = !import.meta.env.DEV;
