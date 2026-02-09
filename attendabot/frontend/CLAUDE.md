# Frontend

React 19 admin dashboard with Vite for bootcamp management.

## Commands

```bash
bun run dev      # Start Vite dev server (port 5173, proxies to backend)
bun run build    # Production build to dist/
bun run preview  # Preview production build
bun run lint     # Run ESLint
```

## Directory Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component with tab navigation and auth
├── App.css               # Main styles
├── api/
│   └── client.ts         # API client (fetch wrapper, cookie auth, all endpoints)
├── lib/
│   └── auth-client.ts    # BetterAuth client for Discord OAuth
├── components/
│   ├── Login.tsx         # Discord OAuth login page
│   ├── StudentTable.tsx  # Sortable student list with observer dropdown
│   ├── StudentDetail.tsx # Individual student view with summary
│   ├── StudentFeed.tsx   # EOD messages + instructor notes feed (with delete)
│   ├── StudentCohortPanel.tsx  # Cohort selector + student list
│   ├── AddStudentModal.tsx     # Modal for creating students
│   ├── NoteInput.tsx     # Instructor note input field
│   ├── ObserversPanel.tsx     # Sortable observers table with Discord sync
│   ├── FeatureRequestsPanel.tsx # Sortable feature requests with boolean status filters
│   ├── MessageFeed.tsx   # Discord messages by channel
│   ├── UserMessages.tsx  # Messages filtered by user
│   ├── ServerLogs.tsx    # Real-time log viewer (WebSocket)
│   ├── StatusPanel.tsx   # Bot status display
│   ├── DiagnosticsPanel.tsx   # Configuration: status, feature flags, feature requests
│   ├── TestingPanel.tsx  # Test briefings and EOD previews
│   └── Sidebar.tsx       # Navigation sidebar
├── hooks/
│   └── useWebSocket.ts   # WebSocket connection hook (cookie auth)
└── utils/
    └── linkify.tsx       # URL detection and linking
```

## Key Components

### App.tsx
- Root component managing auth state and tab navigation
- Tabs: Students, Observers, Messages, Testing, Configuration
- Auth state determined by BetterAuth `getSession()` (Discord OAuth)

### StudentTable.tsx
- Displays students in selected cohort with sortable columns
- Columns: Name, Discord, Status, Last Check-in, Internship, Observer
- Observer column has dropdown to assign an observer (instructor) per student
- Click row to view StudentDetail
- Two-click delete confirmation pattern (click → "Confirm?" → click again, blur resets)

### StudentFeed.tsx
- Interleaved feed of EOD messages and instructor notes
- Delete button on notes with two-click confirmation pattern

### ObserversPanel.tsx
- Sortable table of observers synced from Discord @instructors role
- "Sync from Discord" button to fetch/upsert instructors

### FeatureRequestsPanel.tsx
- Sortable columns (reuses same pattern as StudentTable)
- Boolean status toggle filters: New, In Progress, Done (Done initially off)
- "All" button toggles all filters on

### ServerLogs.tsx
- Connects to WebSocket for real-time logs (cookie-based auth, no token needed)
- Auto-scrolls to latest messages

## Sortable Table Pattern

Multiple tables (StudentTable, ObserversPanel, FeatureRequestsPanel) share this pattern:

```typescript
const [sortField, setSortField] = useState<SortField>("name");
const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

const sortedData = useMemo(() => {
  const sorted = [...data].sort((a, b) => {
    // compare by sortField
    return sortDirection === "asc" ? comparison : -comparison;
  });
  return sorted;
}, [data, sortField, sortDirection]);

const handleSort = (field: SortField) => {
  if (sortField === field) {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
};

// In JSX: <th onClick={() => handleSort("name")} className="sortable">
```

## Authentication

Authentication uses **BetterAuth** with Discord OAuth. There is no JWT or password login.

- **Login**: Discord OAuth via `authClient.signIn.social({ provider: "discord" })`
- **Session check**: `authClient.getSession()` on mount
- **API calls**: `fetchWithAuth()` sends `credentials: "include"` so cookies are attached
- **WebSocket**: `useWebSocket()` connects without a token — cookies sent automatically on upgrade
- **Logout**: `authClient.signOut()` + clear username from localStorage

## State Management

- **Local state**: useState/useEffect throughout
- **Auth**: BetterAuth session cookies (no localStorage tokens)
- **Username display**: Stored in localStorage for display only (not for auth)
- **No global store**: Each component fetches its own data

## API Client (api/client.ts)

All backend communication goes through this file:

```typescript
import { getStudentsByCohort, createStudent, deleteNote } from "../api/client";

// Students
const students = await getStudentsByCohort(cohortId);
await updateStudent(id, { status: "graduated", observerId: 3 });

// Feed & Notes
const feed = await getStudentFeed(studentId);
await createNote(studentId, "Note content");
await deleteNote(studentId, noteId);

// Observers
const observers = await getObservers();
await syncObservers();

// Feature Requests
const requests = await getFeatureRequests();
await createFeatureRequest({ title, description, author, priority });

// LLM
const summary = await getStudentSummary(studentId, "2026-01-25");
```

## WebSocket (hooks/useWebSocket.ts)

```typescript
const { logs, status, clearLogs } = useWebSocket();
// logs: LogEntry[] with id, timestamp, level, message
// status: "connecting" | "connected" | "disconnected" | "error"
// Auto-reconnects with exponential backoff (max 5 attempts)
```

## Development

- Vite dev server at http://localhost:5173
- Proxies `/api/*` and `/ws` to backend at :3001
- Hot module replacement enabled

## Adding a New Component

1. Create file in `src/components/YourComponent.tsx`
2. Use api/client.ts for data fetching:
   ```typescript
   import { getStudents } from "../api/client";

   export function YourComponent() {
     const [data, setData] = useState([]);
     useEffect(() => {
       getStudents().then(setData);
     }, []);
     return <div>...</div>;
   }
   ```
3. Import and add to App.tsx or parent component

## Adding a New API Endpoint

1. Add types and function to `api/client.ts`:
   ```typescript
   export interface NewResponse { ... }

   export async function getNewData(): Promise<NewResponse | null> {
     const res = await fetchWithAuth(`${API_BASE}/new-endpoint`);
     if (!res.ok) return null;
     return res.json();
   }
   ```

## Gotchas

- **Auth redirects**: fetchWithAuth triggers `onAuthFailure` callback on 401/403, which shows session expired warning
- **Vite proxy**: Only works in dev mode; production serves from backend static files
- **No React Router**: Navigation is tab-based within App.tsx, not URL-based
- **Styling**: CSS in App.css, no CSS modules or styled-components
- **Two-click delete pattern**: Used for destructive actions (delete student, delete note). Click shows "Confirm?", click again deletes, blur resets.
- **Role loading race condition**: App.tsx gates on `role` before rendering dashboards. If `role` is `null` (still loading from `getMe()`), a loading screen is shown — NOT the instructor dashboard. Rendering instructor components (e.g., `StudentCohortPanel`) before role is known causes 403s on instructor-only endpoints (`/api/cohorts`, `/api/observers`) which triggers the session expired banner for students.
