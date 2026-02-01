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
│   └── client.ts         # API client (fetch wrapper, JWT handling, all endpoints)
├── components/
│   ├── Login.tsx         # Authentication form
│   ├── StudentTable.tsx  # Main student list with filtering
│   ├── StudentDetail.tsx # Individual student view with summary
│   ├── StudentFeed.tsx   # EOD messages + instructor notes feed
│   ├── StudentCohortPanel.tsx  # Cohort selector + student list
│   ├── AddStudentModal.tsx     # Modal for creating students
│   ├── NoteInput.tsx     # Instructor note input field
│   ├── MessageFeed.tsx   # Discord messages by channel
│   ├── UserMessages.tsx  # Messages filtered by user
│   ├── ServerLogs.tsx    # Real-time log viewer (WebSocket)
│   ├── StatusPanel.tsx   # Bot status display
│   ├── DiagnosticsPanel.tsx   # System diagnostics
│   ├── TestingPanel.tsx  # Test briefings and EOD previews
│   └── Sidebar.tsx       # Navigation sidebar
├── hooks/
│   └── useWebSocket.ts   # WebSocket connection hook
└── utils/
    └── linkify.tsx       # URL detection and linking
```

## Key Components

### App.tsx
- Root component managing auth state and tab navigation
- Tabs: Students, Messages, Testing, Diagnostics
- Stores JWT in localStorage via api/client.ts

### StudentTable.tsx
- Displays students in selected cohort
- Columns: Name, Discord, Status, Last Check-in, Internship
- Click row to view StudentDetail

### StudentDetail.tsx
- Shows student info, AI summary, and feed
- Generates summary via LLM endpoint (cached by date)

### ServerLogs.tsx
- Connects to WebSocket for real-time logs
- Auto-scrolls to latest messages

## State Management

- **Local state**: useState/useEffect throughout
- **Auth**: JWT token in localStorage (`api/client.ts`)
- **No global store**: Each component fetches its own data

## API Client (api/client.ts)

All backend communication goes through this file:

```typescript
import { getStudentsByCohort, createStudent, login } from "../api/client";

// Auth
await login(password, username);  // Stores JWT in localStorage
isLoggedIn();                     // Check if token exists
clearToken();                     // Logout

// Students
const students = await getStudentsByCohort(cohortId);
const student = await getStudent(id);
await createStudent({ name, cohortId, discordUserId });
await updateStudent(id, { status: "graduated" });

// Feed
const feed = await getStudentFeed(studentId);
await createNote(studentId, "Note content");

// LLM
const summary = await getStudentSummary(studentId, "2026-01-25");
```

## WebSocket (hooks/useWebSocket.ts)

```typescript
const { messages, isConnected } = useWebSocket("ws://localhost:3001/ws");
// messages: LogMessage[] with timestamp, level, content
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

- **Auth redirects**: fetchWithAuth clears token on 401/403 - app will show login
- **Vite proxy**: Only works in dev mode; production serves from backend static files
- **No React Router**: Navigation is tab-based within App.tsx, not URL-based
- **Styling**: CSS in App.css, no CSS modules or styled-components
