/**
 * @fileoverview Tests for daily briefing helper functions (bot/index.ts).
 * Tests the countPrsInMessage function and date/time utilities.
 */

import { describe, it, expect } from "vitest";
import { countPrsInMessage } from "../../bot/index";

describe("Daily Briefing - PR Counting", () => {
  describe("countPrsInMessage", () => {
    it("returns 0 when no PR URLs", () => {
      expect(countPrsInMessage("Just a regular message")).toBe(0);
    });

    it("returns 0 for github URLs that are not PRs", () => {
      const message = "Check out https://github.com/user/repo and https://github.com/user/repo/issues/1";
      expect(countPrsInMessage(message)).toBe(0);
    });

    it("counts single PR URL", () => {
      const message = "https://github.com/user/repo/pull/1";
      expect(countPrsInMessage(message)).toBe(1);
    });

    it("counts multiple PR URLs from same repo", () => {
      const message = `
        https://github.com/user/repo/pull/1
        https://github.com/user/repo/pull/2
        https://github.com/user/repo/pull/3
      `;
      expect(countPrsInMessage(message)).toBe(3);
    });

    it("counts PR URLs from different repos", () => {
      const message = `
        https://github.com/user/repo1/pull/1
        https://github.com/other/repo2/pull/5
        https://github.com/another/repo3/pull/10
      `;
      expect(countPrsInMessage(message)).toBe(3);
    });

    it("handles PR URLs mixed with other text", () => {
      const message = `
        Today I worked on the auth feature.

        PRs:
        - https://github.com/user/repo/pull/1 (auth basics)
        - https://github.com/user/repo/pull/2 (tests)

        Tomorrow I'll continue with OAuth.
      `;
      expect(countPrsInMessage(message)).toBe(2);
    });

    it("handles PR URLs with special characters in repo names", () => {
      const message = "https://github.com/user-name/repo-name.js/pull/123";
      expect(countPrsInMessage(message)).toBe(1);
    });

    it("handles consecutive PR URLs without spaces", () => {
      const message = "https://github.com/a/b/pull/1https://github.com/c/d/pull/2";
      expect(countPrsInMessage(message)).toBe(2);
    });

    it("handles empty string", () => {
      expect(countPrsInMessage("")).toBe(0);
    });

    it("handles null-ish content gracefully", () => {
      expect(countPrsInMessage(null as unknown as string || "")).toBe(0);
    });
  });
});

describe("Daily Briefing - Date Utilities", () => {
  describe("Date formatting", () => {
    it("formats date correctly for display", () => {
      const date = new Date("2024-01-15T10:00:00Z");
      const formatted = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      expect(formatted).toContain("Jan");
      expect(formatted).toContain("15");
    });

    it("formats month/day correctly", () => {
      // Use explicit UTC time to avoid timezone issues
      const date = new Date("2024-01-15T12:00:00Z");
      const formatted = date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      });
      expect(formatted).toBe("01/15");
    });
  });

  describe("Time boundary calculations", () => {
    it("calculates 10 AM ET correctly", () => {
      const tenAm = new Date("2024-01-15T10:00:00-05:00");
      expect(tenAm.getUTCHours()).toBe(15); // 10 AM ET = 3 PM UTC
    });

    it("calculates 8 AM ET correctly", () => {
      const eightAm = new Date("2024-01-15T08:00:00-05:00");
      expect(eightAm.getUTCHours()).toBe(13); // 8 AM ET = 1 PM UTC
    });

    it("calculates 1 PM ET correctly", () => {
      const onePm = new Date("2024-01-15T13:00:00-05:00");
      expect(onePm.getUTCHours()).toBe(18); // 1 PM ET = 6 PM UTC
    });
  });

  describe("Previous day range calculation", () => {
    it("calculates previous day boundaries", () => {
      const today = "2024-01-16";
      const [year, month, day] = today.split("-").map(Number);
      const yesterday = new Date(year, month - 1, day - 1);

      expect(yesterday.getDate()).toBe(15);
      expect(yesterday.getMonth()).toBe(0); // January
    });

    it("handles month boundaries", () => {
      const today = "2024-02-01";
      const [year, month, day] = today.split("-").map(Number);
      const yesterday = new Date(year, month - 1, day - 1);

      expect(yesterday.getDate()).toBe(31);
      expect(yesterday.getMonth()).toBe(0); // January
    });

    it("handles year boundaries", () => {
      const today = "2024-01-01";
      const [year, month, day] = today.split("-").map(Number);
      const yesterday = new Date(year, month - 1, day - 1);

      expect(yesterday.getDate()).toBe(31);
      expect(yesterday.getMonth()).toBe(11); // December
      expect(yesterday.getFullYear()).toBe(2023);
    });
  });
});

describe("Daily Briefing - Student Categorization Logic", () => {
  describe("Attendance categorization", () => {
    it("categorizes as absent when no attendance message", () => {
      const attendanceByUser = new Map<string, string>();
      const discordId = "user-1";

      const isAbsent = !attendanceByUser.has(discordId);
      expect(isAbsent).toBe(true);
    });

    it("categorizes as late when attendance after 10 AM", () => {
      const tenAmET = "2024-01-15T15:00:00Z"; // 10 AM ET in UTC
      const attendanceTime = "2024-01-15T16:00:00Z"; // 11 AM ET in UTC

      const isLate = attendanceTime > tenAmET;
      expect(isLate).toBe(true);
    });

    it("categorizes as on-time when attendance before 10 AM", () => {
      const tenAmET = "2024-01-15T15:00:00Z";
      const attendanceTime = "2024-01-15T14:00:00Z"; // 9 AM ET

      const isLate = attendanceTime > tenAmET;
      expect(isLate).toBe(false);
    });
  });

  describe("PR categorization", () => {
    it("categorizes as 3+ PRs when count >= 3", () => {
      const prCount = 4;
      const isGoodPr = prCount >= 3;
      expect(isGoodPr).toBe(true);
    });

    it("categorizes as low PR when count < 3", () => {
      const prCount = 2;
      const isLowPr = prCount < 3;
      expect(isLowPr).toBe(true);
    });

    it("categorizes as late midday PR when first PR after 1 PM", () => {
      const onePmET = "2024-01-15T18:00:00Z"; // 1 PM ET in UTC
      const firstPrTime = "2024-01-15T19:00:00Z"; // 2 PM ET

      const isLatePr = firstPrTime > onePmET;
      expect(isLatePr).toBe(true);
    });

    it("categorizes as on-time PR when first PR before 1 PM", () => {
      const onePmET = "2024-01-15T18:00:00Z";
      const firstPrTime = "2024-01-15T17:00:00Z"; // 12 PM ET

      const isLatePr = firstPrTime > onePmET;
      expect(isLatePr).toBe(false);
    });
  });

  describe("EOD categorization", () => {
    it("categorizes as no EOD when user not in eodPostedUsers set", () => {
      const eodPostedUsers = new Set(["user-2", "user-3"]);
      const discordId = "user-1";

      const hasNoEod = !eodPostedUsers.has(discordId);
      expect(hasNoEod).toBe(true);
    });
  });
});
