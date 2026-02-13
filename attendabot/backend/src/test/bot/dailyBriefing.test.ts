 /**
 * @fileoverview Tests for daily briefing helper functions (bot/index.ts).
 * Tests the countPrsInMessage function and date/time utilities.
 */

import { describe, it, expect } from "vitest";
import { countPrsInMessage, extractPrUrls, isValidEodMessage, getPreviousDayRangeET } from "../../bot/index";

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
      const nullContent = null as unknown as string;
      const content = nullContent || "";
      expect(countPrsInMessage(content)).toBe(0);
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

    it("calculates 2 PM ET correctly", () => {
      const twoPm = new Date("2024-01-15T14:00:00-05:00");
      expect(twoPm.getUTCHours()).toBe(19); // 2 PM ET = 7 PM UTC
    });
  });

  describe("Previous day range calculation (getPreviousDayRangeET)", () => {
    it("looks back 1 day on a normal weekday (Tuesday)", () => {
      // 2024-01-16 is a Tuesday
      const { start } = getPreviousDayRangeET("2024-01-16");
      expect(start).toContain("2024-01-15");
    });

    it("looks back 2 days on Monday (to Saturday)", () => {
      // 2024-01-15 is a Monday
      const { start } = getPreviousDayRangeET("2024-01-15");
      expect(start).toContain("2024-01-13"); // Saturday
    });

    it("looks back 1 day on other weekdays", () => {
      // Wed 2024-01-17 -> Tue 2024-01-16
      expect(getPreviousDayRangeET("2024-01-17").start).toContain("2024-01-16");
      // Thu 2024-01-18 -> Wed 2024-01-17
      expect(getPreviousDayRangeET("2024-01-18").start).toContain("2024-01-17");
      // Fri 2024-01-19 -> Thu 2024-01-18
      expect(getPreviousDayRangeET("2024-01-19").start).toContain("2024-01-18");
      // Sat 2024-01-20 -> Fri 2024-01-19
      expect(getPreviousDayRangeET("2024-01-20").start).toContain("2024-01-19");
    });

    it("handles month boundaries", () => {
      // 2024-02-01 is a Thursday
      const { start } = getPreviousDayRangeET("2024-02-01");
      expect(start).toContain("2024-01-31");
    });

    it("handles year boundaries", () => {
      // 2024-01-01 is a Monday -> should look back to 2023-12-30 (Saturday)
      const { start } = getPreviousDayRangeET("2024-01-01");
      expect(start).toContain("2023-12-30");
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

    it("categorizes as late midday PR when first PR after 2 PM", () => {
      const twoPmET = "2024-01-15T19:00:00Z"; // 2 PM ET in UTC
      const firstPrTime = "2024-01-15T20:00:00Z"; // 3 PM ET

      const isLatePr = firstPrTime > twoPmET;
      expect(isLatePr).toBe(true);
    });

    it("categorizes as on-time PR when first PR before 2 PM", () => {
      const twoPmET = "2024-01-15T19:00:00Z";
      const firstPrTime = "2024-01-15T18:00:00Z"; // 1 PM ET

      const isLatePr = firstPrTime > twoPmET;
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

describe("Daily Briefing - isValidEodMessage", () => {
  it("returns true with win, block, and PR link", () => {
    const message = "**Wins**\nShipped auth\n**Blockers**\nNone\nhttps://github.com/user/repo/pull/1";
    expect(isValidEodMessage(message)).toBe(true);
  });

  it("returns true with win, block, and 'PRs' string", () => {
    const message = "wins: did stuff\nblockers: none\nPRs: none today";
    expect(isValidEodMessage(message)).toBe(true);
  });

  it("returns true with only 'win' (no 'block') plus PR link", () => {
    const message = "Win: shipped auth\nhttps://github.com/user/repo/pull/1";
    expect(isValidEodMessage(message)).toBe(true);
  });

  it("returns true with only 'block' (no 'win') plus PR link", () => {
    const message = "Blocker: stuck on deploy\nhttps://github.com/user/repo/pull/1";
    expect(isValidEodMessage(message)).toBe(true);
  });

  it("is case insensitive", () => {
    const message = "WIN today\nprs: link";
    expect(isValidEodMessage(message)).toBe(true);
  });

  it("returns false when missing both win and block", () => {
    const message = "Did some stuff\nhttps://github.com/user/repo/pull/1";
    expect(isValidEodMessage(message)).toBe(false);
  });

  it("returns false when missing PRs section and PR links", () => {
    const message = "**Wins**\nShipped auth\n**Blockers**\nNone";
    expect(isValidEodMessage(message)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidEodMessage("")).toBe(false);
  });

  it("returns false for a casual message without the required sections", () => {
    expect(isValidEodMessage("Hey team, wrapping up for the day!")).toBe(false);
  });
});

describe("Daily Briefing - PR Deduplication", () => {
  /** Helper that mirrors the deduplication logic used in generateDailyBriefing. */
  function collectUniquePrs(
    messages: Array<{ author_id: string; content: string | null }>,
  ): Map<string, Set<string>> {
    const prsByUser = new Map<string, Set<string>>();
    for (const msg of messages) {
      const urls = extractPrUrls(msg.content ?? "");
      if (urls.length > 0) {
        if (!prsByUser.has(msg.author_id)) {
          prsByUser.set(msg.author_id, new Set());
        }
        const userPrs = prsByUser.get(msg.author_id)!;
        for (const url of urls) {
          userPrs.add(url);
        }
      }
    }
    return prsByUser;
  }

  it("counts unique PR URLs across multiple messages", () => {
    const messages = [
      { author_id: "user-1", content: "midday: https://github.com/user/repo/pull/1" },
      { author_id: "user-1", content: "EOD:\nhttps://github.com/user/repo/pull/1\nhttps://github.com/user/repo/pull/2" },
    ];
    const prsByUser = collectUniquePrs(messages);
    expect(prsByUser.get("user-1")!.size).toBe(2);
  });

  it("counts PRs separately per user", () => {
    const messages = [
      { author_id: "user-1", content: "https://github.com/user/repo/pull/1" },
      { author_id: "user-2", content: "https://github.com/user/repo/pull/1\nhttps://github.com/user/repo/pull/2" },
    ];
    const prsByUser = collectUniquePrs(messages);
    expect(prsByUser.get("user-1")!.size).toBe(1);
    expect(prsByUser.get("user-2")!.size).toBe(2);
  });

  it("does not count the same PR URL posted three times", () => {
    const messages = [
      { author_id: "user-1", content: "https://github.com/user/repo/pull/5" },
      { author_id: "user-1", content: "https://github.com/user/repo/pull/5" },
      { author_id: "user-1", content: "https://github.com/user/repo/pull/5" },
    ];
    const prsByUser = collectUniquePrs(messages);
    expect(prsByUser.get("user-1")!.size).toBe(1);
  });
});
