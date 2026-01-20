# 2026-01-20-001: Student Cohort Management Feature

## Summary

Added a dashboard for managing students by cohort with instructor notes and EOD message history. Includes multi-user authentication, a sidebar for student details, and an interleaved activity feed.

## Problem

Instructors needed a way to track students organized by cohort, add notes about check-ins, and see a student's EOD messages alongside instructor notes in one unified view.

## What We Did

### 1. Database Schema (`backend/src/services/db.ts`)

Added three new tables with auto-seeded cohorts:

```sql
-- Cohorts (Fa2025, Sp2026 auto-seeded)
CREATE TABLE IF NOT EXISTS cohorts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Students linked to Discord users and cohorts
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  discord_user_id TEXT REFERENCES users(author_id),
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated', 'withdrawn')),
  current_internship TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Instructor notes for check-ins
CREATE TABLE IF NOT EXISTS instructor_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Key function for interleaved feed:

```typescript
export function getStudentFeed(studentId: number, limit: number = 50): FeedItem[] {
  // Get instructor notes
  const notes = db.prepare(`
    SELECT 'note' as type, 'note_' || id as id, content, author, created_at
    FROM instructor_notes WHERE student_id = ?
  `).all(studentId);

  // Get EOD messages (exclude #attendance channel)
  const messages = db.prepare(`
    SELECT 'eod' as type, 'eod_' || m.discord_message_id as id, m.content, u.username as author, m.created_at
    FROM messages m
    JOIN users u ON m.author_id = u.author_id
    JOIN channels c ON m.channel_id = c.channel_id
    WHERE m.author_id = ? AND c.channel_name != 'attendance'
  `).all(student.discord_user_id);

  // Combine and sort by created_at DESC
  return [...notes, ...messages].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, limit);
}
```

### 2. Multi-User Authentication (`backend/src/api/middleware/auth.ts`)

Added instructor credentials from environment variables:

```typescript
const INSTRUCTORS: Record<string, string | undefined> = {
  David: process.env.INSTRUCTOR_DAVID_PASSWORD,
  Paris: process.env.INSTRUCTOR_PARIS_PASSWORD,
  Andrew: process.env.INSTRUCTOR_ANDREW_PASSWORD,
};

export function verifyCredentials(username: string, password: string): boolean {
  const instructorPassword = INSTRUCTORS[username];
  if (instructorPassword && password === instructorPassword) {
    return true;
  }
  // Fall back to admin password for backwards compatibility
  return process.env.ADMIN_PASSWORD === password;
}

export function generateToken(username: string): string {
  return jwt.sign({ authenticated: true, username }, JWT_SECRET, { expiresIn: "24h" });
}
```

### 3. Frontend Components

Created 7 new components:

- `Sidebar.tsx` - Generic slide-from-right panel with overlay
- `StudentCohortPanel.tsx` - Main panel with cohort dropdown + table
- `StudentTable.tsx` - Sortable table with clickable names
- `StudentDetail.tsx` - Summary placeholder, note input, activity feed
- `StudentFeed.tsx` - Interleaved EOD/notes with filter checkboxes
- `NoteInput.tsx` - Textarea with Ctrl+Enter submit
- `AddStudentModal.tsx` - Modal with Discord user dropdown

Tab navigation in App.tsx:

```tsx
<nav className="tab-navigation">
  <button className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
    onClick={() => setActiveTab("students")}>Students</button>
  <button className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
    onClick={() => setActiveTab("messages")}>Messages</button>
</nav>

<main>
  {activeTab === "students" ? <StudentCohortPanel /> : (
    <>
      <MessageFeed />
      <UserMessages />
      <StatusPanel />
    </>
  )}
</main>
```

### 4. Timestamp Timezone Fix

SQLite stores UTC timestamps without 'Z' suffix. Fixed parsing in StudentTable:

```typescript
const formatDate = (dateString: string | null) => {
  if (!dateString) return "—";
  // SQLite CURRENT_TIMESTAMP is UTC but without 'Z' suffix, so append it
  const utcString = dateString.endsWith("Z") ? dateString : dateString.replace(" ", "T") + "Z";
  const date = new Date(utcString);
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    hour12: true, timeZone: "America/New_York",
  });
};
```

## Design Decisions

1. **Optional Discord linking**: Students can exist without Discord accounts for tracking non-Discord students
2. **Computed lastCheckIn**: Derived from MAX(instructor_notes.created_at) rather than stored field
3. **Exclude attendance channel**: EOD feed only shows substantive messages, not attendance pings
4. **Username in JWT**: Notes are automatically attributed to logged-in instructor
5. **Lorem ipsum placeholder**: Summary section reserved for future AI-generated summaries

## Environment Variables

```
INSTRUCTOR_DAVID_PASSWORD=changeme1234
INSTRUCTOR_PARIS_PASSWORD=changeme5678
INSTRUCTOR_ANDREW_PASSWORD=changeme9012
```

## Results

- Instructors can track students organized by cohort
- Notes are attributed to the logged-in instructor
- Activity feed shows EODs and notes interleaved chronologically
- Last Check-in column displays timestamp in ET with date and time
- Attendance channel messages filtered from EOD feed
