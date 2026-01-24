import { describe, it, expect } from "vitest";
import {
  getCurriculumPosition,
  getNextWorkingDay,
  getTomorrowsAssignment,
  formatAssignmentForDiscord,
} from "../../bot/curriculum.js";
import type { CohortConfig } from "../../bot/constants.js";

/** Test cohort with known dates. */
const TEST_COHORT: CohortConfig = {
  id: "test2026",
  name: "Test 2026",
  startDate: "2026-02-02", // Monday
  breakWeek: 5,
  totalWeeks: 13,
};

describe("getCurriculumPosition", () => {
  it("returns null for dates before cohort starts", () => {
    const date = new Date("2026-01-31");
    expect(getCurriculumPosition(date, TEST_COHORT)).toBeNull();
  });

  it("returns week 1, day 1 for first Monday", () => {
    const date = new Date("2026-02-02");
    expect(getCurriculumPosition(date, TEST_COHORT)).toEqual({
      week: 1,
      dayOfWeek: 1,
    });
  });

  it("returns week 1, day 5 for first Friday", () => {
    const date = new Date("2026-02-06");
    expect(getCurriculumPosition(date, TEST_COHORT)).toEqual({
      week: 1,
      dayOfWeek: 5,
    });
  });

  it("returns week 1, day 6 for first Saturday", () => {
    const date = new Date("2026-02-07");
    expect(getCurriculumPosition(date, TEST_COHORT)).toEqual({
      week: 1,
      dayOfWeek: 6,
    });
  });

  it("returns null for Sunday", () => {
    const date = new Date("2026-02-08"); // Sunday
    expect(getCurriculumPosition(date, TEST_COHORT)).toBeNull();
  });

  it("returns week 2, day 1 for second Monday", () => {
    const date = new Date("2026-02-09");
    expect(getCurriculumPosition(date, TEST_COHORT)).toEqual({
      week: 2,
      dayOfWeek: 1,
    });
  });

  it("returns week 13 for last week", () => {
    const date = new Date("2026-04-27"); // Week 13 Monday
    expect(getCurriculumPosition(date, TEST_COHORT)).toEqual({
      week: 13,
      dayOfWeek: 1,
    });
  });

  it("returns null for dates after cohort ends", () => {
    const date = new Date("2026-05-04"); // Week 14
    expect(getCurriculumPosition(date, TEST_COHORT)).toBeNull();
  });
});

describe("getNextWorkingDay", () => {
  it("returns Tuesday for Monday", () => {
    const monday = new Date("2026-02-02");
    const next = getNextWorkingDay(monday);
    expect(next.getDay()).toBe(2); // Tuesday
  });

  it("returns Saturday for Friday", () => {
    const friday = new Date("2026-02-06");
    const next = getNextWorkingDay(friday);
    expect(next.getDay()).toBe(6); // Saturday
  });

  it("skips Sunday and returns Monday for Saturday", () => {
    const saturday = new Date("2026-02-07");
    const next = getNextWorkingDay(saturday);
    expect(next.getDay()).toBe(1); // Monday
    expect(next.getDate()).toBe(9); // Feb 9
  });
});

describe("getTomorrowsAssignment", () => {
  it("returns assignment for Monday when current day is Sunday (skip to Monday)", () => {
    // This tests that Saturday EOD shows Monday's assignment
    const saturday = new Date("2026-02-07T17:00:00-05:00");
    const assignment = getTomorrowsAssignment(saturday, TEST_COHORT);
    expect(assignment).not.toBeNull();
    expect(assignment?.week).toBe(2);
    expect(assignment?.dayOfWeek).toBe(1); // Monday
    expect(assignment?.title).toBe("Auth Basics");
  });

  it("returns assignment for Tuesday when current day is Monday", () => {
    const monday = new Date("2026-02-02T17:00:00-05:00");
    const assignment = getTomorrowsAssignment(monday, TEST_COHORT);
    expect(assignment).not.toBeNull();
    expect(assignment?.week).toBe(1);
    expect(assignment?.dayOfWeek).toBe(2); // Tuesday
    expect(assignment?.title).toBe("Styling");
  });

  it("returns null for break week", () => {
    // Week 5 starts 2026-03-02
    const beforeBreak = new Date("2026-03-01T17:00:00-05:00"); // Sunday, next day is break week Monday
    const assignment = getTomorrowsAssignment(beforeBreak, TEST_COHORT);
    expect(assignment).toBeNull();
  });

  it("returns null before cohort starts", () => {
    const beforeStart = new Date("2026-01-30T17:00:00-05:00");
    const assignment = getTomorrowsAssignment(beforeStart, TEST_COHORT);
    expect(assignment).toBeNull();
  });

  it("returns null after cohort ends", () => {
    const afterEnd = new Date("2026-05-03T17:00:00-05:00");
    const assignment = getTomorrowsAssignment(afterEnd, TEST_COHORT);
    expect(assignment).toBeNull();
  });
});

describe("formatAssignmentForDiscord", () => {
  it("formats assignment with day name, week number, title, description, and URL", () => {
    const assignment = {
      week: 1,
      dayOfWeek: 4,
      title: "Multi-Game",
      description: "Support multiple game instances.",
      githubPath: "01-intro/assignments/4-multi-game.md",
    };

    const formatted = formatAssignmentForDiscord(assignment);

    expect(formatted).toContain("**Thursday's Assignment (Week 1):** Multi-Game");
    expect(formatted).toContain("Support multiple game instances.");
    expect(formatted).toContain(
      "https://github.com/fractal-bootcamp/bootcamp-monorepo/tree/main/curriculum/weeks/01-intro/assignments/4-multi-game.md"
    );
  });

  it("formats Monday assignment correctly", () => {
    const assignment = {
      week: 2,
      dayOfWeek: 1,
      title: "Auth Basics",
      description: "Implement user authentication.",
      githubPath: "02-chatbot/assignments/1-auth.md",
    };

    const formatted = formatAssignmentForDiscord(assignment);

    expect(formatted).toContain("**Monday's Assignment (Week 2):** Auth Basics");
  });
});
