# 2026-01-20-001: Student Cohort Management Feature

## Summary

Added a dashboard for managing students by cohort with instructor notes and EOD message history. Includes multi-user authentication, a sidebar for student details, and an interleaved activity feed.

## What We Did

### 1. Database Schema

- Added `cohorts` table (Fa2025, Sp2026 auto-seeded)
- Added `students` table with optional Discord user linking
- Added `instructor_notes` table for tracking check-ins
- Computed `lastCheckIn` from most recent instructor note

### 2. API Endpoints

- `GET /api/cohorts` - List all cohorts
- `GET /api/students?cohortId=X` - List students with lastCheckIn
- `GET/POST/PUT/DELETE /api/students/:id` - CRUD operations
- `GET /api/students/:id/feed` - Interleaved EODs + notes
- `POST /api/students/:id/notes` - Add instructor note

### 3. Multi-User Authentication

- Added instructor credentials via environment variables
- JWT includes username for note attribution
- Login dropdown with predefined instructor names

### 4. Frontend Components

- Tab navigation (Students | Messages)
- Sortable student table with status badges
- Slide-from-right sidebar for student details
- Activity feed with EOD/note filter toggles
- Add Student modal with Discord user linking

## Files Modified

- `backend/src/services/db.ts` - New tables and functions
- `backend/src/api/routes/students.ts` - New route file
- `backend/src/api/routes/auth.ts` - Multi-user login
- `backend/src/api/middleware/auth.ts` - Username in JWT
- `frontend/src/components/` - 7 new components
- `frontend/src/App.tsx` - Tab navigation
- `frontend/src/App.css` - New styles

## Results

- Instructors can track students by cohort
- Notes are attributed to logged-in instructor
- Activity feed shows EODs and notes interleaved
- Last Check-in column shows most recent note timestamp
