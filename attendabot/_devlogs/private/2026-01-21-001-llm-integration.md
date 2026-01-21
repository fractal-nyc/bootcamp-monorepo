# 2026-01-21-001: LLM Integration for AI Summaries

## Summary

Added LLM support with Google Gemini for AI-generated student summaries and cohort sentiment analysis. Includes provider abstraction layer, caching, and UI improvements.

## What We Did

### 1. LLM Service with Provider Abstraction
- Created `backend/src/services/llm.ts` with `LLMProvider` interface
- Implemented `GeminiProvider` using REST API (no SDK needed)
- Model: `gemini-3-flash-preview`
- 30-second timeout on API calls

### 2. API Endpoints
- `GET /api/llm/student/:id/summary/:date` - Cumulative student summary
- `GET /api/llm/cohort/:id/sentiment/:date` - Single-day cohort sentiment
- Both endpoints cache results in SQLite and support `?force=true` to regenerate
- Added `Cache-Control: no-store` headers to prevent browser caching

### 3. Database Schema
- Added `student_summaries` table for caching student AI summaries
- Added `cohort_sentiments` table for caching cohort sentiment analysis
- Both use (id, date) as unique keys

### 4. Daily Briefing Integration
- Made `generateDailyBriefing()` async
- Replaced placeholder sentiment with LLM-generated analysis
- Sentiment is cached and reused

### 5. Frontend Updates
- Student detail sidebar shows AI-generated summary with markdown rendering
- Added `react-markdown` for rendering formatted summaries
- "Regenerate" button to force new summary generation
- Made sidebar resizable via drag handle (350px-900px, persisted to localStorage)

### 6. Shared Link Utility
- Created `utils/linkify.tsx` with `renderWithLinks()` function
- Refactored `MessageFeed`, `UserMessages`, and `StudentFeed` to use shared utility
- Links in student feed now clickable

## Files Created
- `backend/src/services/llm.ts` - LLM service with Gemini provider
- `backend/src/api/routes/llm.ts` - API endpoints for summaries
- `frontend/src/utils/linkify.tsx` - Shared link rendering utility

## Files Modified
- `backend/src/services/db.ts` - New tables and cache functions
- `backend/src/api/index.ts` - Mount LLM router
- `backend/src/bot/index.ts` - Async sentiment in daily briefing
- `backend/src/api/routes/testing.ts` - Await async briefing
- `frontend/src/api/client.ts` - New `getStudentSummary()` function
- `frontend/src/components/StudentDetail.tsx` - AI summary UI
- `frontend/src/components/Sidebar.tsx` - Resizable sidebar
- `frontend/src/components/StudentFeed.tsx` - Use shared linkify
- `frontend/src/components/MessageFeed.tsx` - Use shared linkify
- `frontend/src/components/UserMessages.tsx` - Use shared linkify
- `frontend/src/App.css` - Styles for summary, sidebar resize handle, feed links

## Environment Variables
- `GEMINI_API_KEY` - Required for LLM features (must be set on server)

## Deployment Notes

Deploy with update script:
```bash
ssh attendabot
cd ~/attendabot && ./update-bot.sh
```

Make sure `GEMINI_API_KEY` is set in the server's `.env` file for LLM features to work.

The new database tables will be created automatically on first run.
