/**
 * @fileoverview Entry point for attendabot. Initializes Discord client,
 * starts the bot scheduler, and launches the API server.
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { initializeDiscord } from "./services/discord";
import { startApiServer } from "./api";
import { startBot } from "./bot";

const API_PORT = parseInt(process.env.API_PORT || "3001", 10);

/** Initializes all services and starts the application. */
async function main(): Promise<void> {
  console.log("Starting attendabot...");

  try {
    // Initialize Discord client first
    await initializeDiscord();

    // Start the bot (schedules cron jobs)
    startBot();

    // Start API server
    startApiServer(API_PORT);

    console.log("Attendabot fully initialized");
  } catch (error) {
    console.error("Failed to start attendabot:", error);
    process.exit(1);
  }
}

main();
