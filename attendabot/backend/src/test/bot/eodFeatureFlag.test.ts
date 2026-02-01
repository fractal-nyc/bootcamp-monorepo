import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module to control isFeatureFlagEnabled
vi.mock("../../services/db", () => ({
  isFeatureFlagEnabled: vi.fn(),
  getMessagesByChannelAndDateRange: vi.fn().mockReturnValue([]),
  getStudentsByLastCheckIn: vi.fn().mockReturnValue([]),
  getActiveStudentsWithDiscord: vi.fn().mockReturnValue([]),
  getDefaultCohortId: vi.fn().mockReturnValue(null),
  getCohortSentiment: vi.fn().mockReturnValue(null),
  saveCohortSentiment: vi.fn(),
}));

// Mock curriculum to return a predictable assignment
vi.mock("../../bot/curriculum", () => ({
  getTomorrowsAssignment: vi.fn().mockReturnValue({
    week: 2,
    dayOfWeek: "Monday",
    title: "Auth Basics",
    description: "Learn authentication fundamentals",
    githubPath: "weeks/02-auth/assignments/1-auth-basics.md",
  }),
  formatAssignmentForDiscord: vi.fn().mockReturnValue(
    "**Monday's Assignment (Week 2):** Auth Basics\nLearn authentication fundamentals"
  ),
}));

// Mock discord service (imported transitively by bot/index)
vi.mock("../../services/discord", () => ({
  fetchTextChannel: vi.fn(),
  fetchMessagesSince: vi.fn(),
  sendDirectMessage: vi.fn(),
}));

// Mock stats service
vi.mock("../../services/stats", () => ({
  incrementMessagesSent: vi.fn(),
  incrementRemindersTriggered: vi.fn(),
  incrementVerificationsRun: vi.fn(),
  incrementErrors: vi.fn(),
}));

// Mock LLM service
vi.mock("../../services/llm", () => ({
  isLLMConfigured: vi.fn().mockReturnValue(false),
  generateCohortSentiment: vi.fn(),
}));

import { buildEodMessage } from "../../bot/index.js";
import { isFeatureFlagEnabled } from "../../services/db";
import { formatAssignmentForDiscord } from "../../bot/curriculum";

const mockedIsFeatureFlagEnabled = vi.mocked(isFeatureFlagEnabled);
const mockedFormatAssignment = vi.mocked(formatAssignmentForDiscord);

describe("buildEodMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes next day assignment when eod_next_day_content flag is enabled", () => {
    mockedIsFeatureFlagEnabled.mockReturnValue(true);

    const message = buildEodMessage();

    expect(mockedIsFeatureFlagEnabled).toHaveBeenCalledWith("eod_next_day_content");
    expect(mockedFormatAssignment).toHaveBeenCalled();
    expect(message).toContain("Auth Basics");
    expect(message).toContain("Monday's Assignment (Week 2)");
  });

  it("does not include next day assignment when eod_next_day_content flag is disabled", () => {
    mockedIsFeatureFlagEnabled.mockReturnValue(false);

    const message = buildEodMessage();

    expect(mockedIsFeatureFlagEnabled).toHaveBeenCalledWith("eod_next_day_content");
    expect(mockedFormatAssignment).not.toHaveBeenCalled();
    expect(message).not.toContain("Auth Basics");
    expect(message).not.toContain("Assignment");
  });

  it("still contains the base EOD reminder text regardless of flag state", () => {
    mockedIsFeatureFlagEnabled.mockReturnValue(false);
    const messageOff = buildEodMessage();

    mockedIsFeatureFlagEnabled.mockReturnValue(true);
    const messageOn = buildEodMessage();

    // Both should contain the core EOD reminder
    expect(messageOff).toContain("EOD update");
    expect(messageOn).toContain("EOD update");
  });
});
