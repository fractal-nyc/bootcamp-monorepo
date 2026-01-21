/**
 * @fileoverview API routes for LLM-powered summaries and sentiment analysis.
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  getStudent,
  getStudentFeed,
  getStudentSummary,
  saveStudentSummary,
  getCohortSentiment,
  saveCohortSentiment,
  getMessagesByChannelAndDateRange,
  getCohorts,
} from "../../services/db";
import {
  isLLMConfigured,
  generateStudentSummary,
  generateCohortSentiment,
} from "../../services/llm";

/** Router for LLM endpoints. */
export const llmRouter = Router();

// Disable browser caching for LLM routes (especially important for force regeneration)
llmRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// All routes require authentication
llmRouter.use(authenticateToken);

/**
 * GET /api/llm/student/:id/summary/:date
 * Generates or retrieves a cached AI summary for a student.
 * Date format: YYYY-MM-DD (cumulative - analyzes all data up to and including that date)
 */
llmRouter.get("/student/:id/summary/:date", async (req: AuthRequest, res: Response) => {
  try {
    // Validate LLM configuration
    if (!isLLMConfigured()) {
      res.status(503).json({ error: "LLM not configured", code: "NOT_CONFIGURED" });
      return;
    }

    // Validate student ID
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    // Validate date format
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      return;
    }

    // Check if student exists
    const student = getStudent(studentId);
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Check for force regeneration flag
    const forceRegenerate = req.query.force === "true";

    // Check for cached summary (unless force regenerate)
    if (!forceRegenerate) {
      const cached = getStudentSummary(studentId, date);
      if (cached) {
        res.json({
          summary: cached.summary,
          cached: true,
          generatedAt: cached.createdAt,
        });
        return;
      }
    }

    // Generate new summary
    // Get feed items up to and including the specified date
    const allFeed = getStudentFeed(studentId, 500); // Get a larger set to filter
    const cutoffDate = new Date(date + "T23:59:59.999Z");
    const filteredFeed = allFeed.filter(
      (item) => new Date(item.created_at) <= cutoffDate
    );

    if (filteredFeed.length === 0) {
      res.json({
        summary: "No data available for analysis.",
        cached: false,
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    const summary = await generateStudentSummary(student.name, filteredFeed);

    // Cache the summary
    saveStudentSummary(studentId, date, summary);

    res.json({
      summary,
      cached: false,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating student summary:", error);
    if (error instanceof Error && error.message === "LLM request timed out") {
      res.status(504).json({ error: "Request timed out" });
      return;
    }
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

/**
 * GET /api/llm/cohort/:id/sentiment/:date
 * Generates or retrieves a cached sentiment analysis for a cohort.
 * Date format: YYYY-MM-DD (single day - analyzes only EOD messages from that specific date)
 */
llmRouter.get("/cohort/:id/sentiment/:date", async (req: AuthRequest, res: Response) => {
  try {
    // Validate LLM configuration
    if (!isLLMConfigured()) {
      res.status(503).json({ error: "LLM not configured", code: "NOT_CONFIGURED" });
      return;
    }

    // Validate cohort ID
    const cohortId = parseInt(req.params.id, 10);
    if (isNaN(cohortId)) {
      res.status(400).json({ error: "Invalid cohort ID" });
      return;
    }

    // Validate date format
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      return;
    }

    // Check if cohort exists
    const cohorts = getCohorts();
    const cohortExists = cohorts.some((c) => c.id === cohortId);
    if (!cohortExists) {
      res.status(404).json({ error: "Cohort not found" });
      return;
    }

    // Check for cached sentiment
    const cached = getCohortSentiment(cohortId, date);
    if (cached) {
      res.json({
        sentiment: cached.sentiment,
        cached: true,
        generatedAt: cached.createdAt,
      });
      return;
    }

    // Generate new sentiment analysis
    // Get EOD messages for the specific date in ET timezone
    const startET = new Date(`${date}T00:00:00-05:00`).toISOString();
    const endET = new Date(`${date}T23:59:59-05:00`).toISOString();
    const eodMessages = getMessagesByChannelAndDateRange("eod", startET, endET);

    if (eodMessages.length === 0) {
      res.json({
        sentiment: "No EOD data available for this day.",
        cached: false,
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    const sentiment = await generateCohortSentiment(eodMessages);

    // Cache the sentiment
    saveCohortSentiment(cohortId, date, sentiment);

    res.json({
      sentiment,
      cached: false,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating cohort sentiment:", error);
    if (error instanceof Error && error.message === "LLM request timed out") {
      res.status(504).json({ error: "Request timed out" });
      return;
    }
    res.status(500).json({ error: "Failed to generate sentiment analysis" });
  }
});
