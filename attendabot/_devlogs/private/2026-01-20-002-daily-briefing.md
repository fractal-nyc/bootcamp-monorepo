# 2026-01-20-002: Daily Briefing Feature with Testing UI

## Summary

Added a daily briefing that runs at 8 AM ET, summarizing the previous day's cohort activity. Also added a Testing tab in the admin panel to simulate and preview briefings before they go live.

## Problem

Instructors needed a daily summary of cohort activity to quickly identify:
- Students who were late or absent
- Students meeting or not meeting PR quotas
- Students who haven't been checked in on recently

Additionally, testing the briefing required waiting for the cron job to run or manually triggering it.

## What We Did

### 1. Database Queries (`backend/src/services/db.ts`)

Added queries for briefing data:

```typescript
// Get messages by channel and date range
export function getMessagesByChannelAndDateRange(
  channelName: string,
  startDate: string,
  endDate: string
): BriefingMessageRecord[] {
  const stmt = db.prepare(`
    SELECT m.author_id, m.content, m.created_at
    FROM messages m
    JOIN channels c ON m.channel_id = c.channel_id
    WHERE c.channel_name = ?
      AND m.created_at >= ?
      AND m.created_at < ?
    ORDER BY m.created_at ASC
  `);
  return stmt.all(channelName, startDate, endDate);
}

// Get students sorted by last check-in (oldest first)
export function getStudentsByLastCheckIn(cohortId: number): StudentRecord[] { ... }

// Get active students with Discord linked
export function getActiveStudentsWithDiscord(cohortId: number): StudentRecord[] { ... }

// Get default cohort (supports CURRENT_COHORT_ID env var)
export function getDefaultCohortId(): number | null {
  const envCohortId = process.env.CURRENT_COHORT_ID;
  if (envCohortId) {
    const parsed = parseInt(envCohortId, 10);
    if (!isNaN(parsed)) return parsed;
  }
  // Fallback to first cohort
  const stmt = db.prepare(`SELECT id FROM cohorts ORDER BY id ASC LIMIT 1`);
  const result = stmt.get();
  return result?.id ?? null;
}
```

### 2. Briefing Generation (`backend/src/bot/index.ts`)

Separated briefing generation from sending for testability:

```typescript
// Date range helper with optional simulated date
function getPreviousDayRangeET(simulatedToday?: string): { start: string; end: string } {
  let targetDate: Date;
  if (simulatedToday) {
    const [year, month, day] = simulatedToday.split("-").map(Number);
    targetDate = new Date(year, month - 1, day - 1);
  } else {
    // Get yesterday in ET timezone
    const now = new Date();
    const etFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [month, day, year] = etFormatter.format(yesterday).split("/");
    targetDate = new Date(Number(year), Number(month) - 1, Number(day));
  }
  // Create ET midnight boundaries
  const startET = new Date(`${year}-${month}-${day}T00:00:00-05:00`);
  const endET = new Date(`${year}-${month}-${day}T23:59:59-05:00`);
  return { start: startET.toISOString(), end: endET.toISOString() };
}

// Exported for testing endpoint
export function generateDailyBriefing(cohortId: number, simulatedToday?: string): string | null {
  const students = getActiveStudentsWithDiscord(cohortId);
  if (students.length === 0) return null;

  const { start, end } = getPreviousDayRangeET(simulatedToday);
  const tenAm = getTenAmET(start.split("T")[0]);

  const attendanceMessages = getMessagesByChannelAndDateRange("attendance", start, end);
  const eodMessages = getMessagesByChannelAndDateRange("eod", start, end);

  // Categorize students into: late, absent, 3+ PRs, <3 PRs, no EOD
  // Build briefing message with all sections
  return briefing;
}

// Cron job handler
async function sendDailyBriefing(): Promise<void> {
  const cohortId = getDefaultCohortId();
  if (!cohortId) return;

  const briefing = generateDailyBriefing(cohortId);
  if (!briefing) return;

  const channel = await fetchTextChannel(DAILY_BRIEFING_CHANNEL_ID);
  await channel.send({ content: briefing });
}
```

### 3. Testing Endpoint (`backend/src/api/routes/testing.ts`)

```typescript
testingRouter.post("/briefing", authenticateToken, async (req, res) => {
  const { cohortId, simulatedDate } = req.body;

  // Validate inputs...

  const briefing = generateDailyBriefing(cohortId, simulatedDate);
  if (!briefing) {
    res.status(400).json({ error: "No active students with Discord in this cohort" });
    return;
  }

  const davidUserId = process.env.DAVID_USER_ID;
  const testMessage = `**[TEST BRIEFING]**\nSimulated date: ${simulatedDate}\n\n${briefing}`;
  const sent = await sendDirectMessage(davidUserId, testMessage);

  if (!sent) {
    res.status(500).json({ error: "Failed to send DM to David" });
    return;
  }

  res.json({ message: "Test briefing sent to David via DM" });
});
```

### 4. Frontend Testing Panel (`frontend/src/components/TestingPanel.tsx`)

```typescript
export function TestingPanel() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const [simulatedDate, setSimulatedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // Today's date
  });

  const handleSendBriefing = async () => {
    const res = await sendTestBriefing(selectedCohortId, simulatedDate);
    setResult(res);
  };

  return (
    <div className="testing-panel">
      <section className="panel">
        <h2>Morning Briefing Test</h2>
        {/* Cohort dropdown, date picker, send button */}
      </section>
    </div>
  );
}
```

## Design Decisions

1. **Separated generation from sending**: `generateDailyBriefing()` returns the message content, allowing reuse for testing without side effects
2. **Simulated date support**: Testing can generate briefings for any historical date
3. **DM for test output**: Test briefings go to David via DM, not the actual channel
4. **CURRENT_COHORT_ID env var**: Allows configuring which cohort without code changes
5. **ET timezone handling**: All date calculations use America/New_York timezone

## Constants Added

```typescript
export const DAILY_BRIEFING_CRON = "0 8 * * *";  // 8 AM ET
export const DAILY_BRIEFING_CHANNEL_ID = "1463280393888333884";
```

## Results

- Daily briefing automatically sent at 8 AM ET
- Briefing sections: Late, Absent, 3+ PRs, <3 PRs, No EOD, Sentiment, Last Check-in
- Instructors can preview briefings for any date via the Testing tab
- Clean separation allows easy testing and future modifications
- Configurable cohort via environment variable
