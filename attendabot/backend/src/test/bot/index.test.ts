import { describe, it, expect, vi, afterEach } from "vitest";
import { countPrsInMessage, getTopLeaderboard, getCurrentMonthDay } from "../../bot/index.js";

describe("countPrsInMessage", () => {
  it("returns 1 when there is one PR URL", () => {
    const message = "https://github.com/asdf/fractal-chat/pull/26";
    expect(countPrsInMessage(message)).toEqual(1);
  });

  it("returns 2 when there are two PR URLs", () => {
    const message =
      "https://github.com/asdf/fractal-chat/pull/26https://github.com/asdf/fractal-chat/pull/26";
    expect(countPrsInMessage(message)).toEqual(2);
  });

  it("returns 3 when there are three PR URLs", () => {
    const message = `Wins:
      Made significant progress implementing our basic game logic. Good vision of the path forward for tomorrow.


      PRs:
      https://github.com/asdf/rogue-like-uno/pull/10
      https://github.com/asdf/rogue-like-uno/pull/12
      https://github.com/asdf/rogue-like-uno/pull/17`;
    expect(countPrsInMessage(message)).toEqual(3);
  });

  it("returns 5 when there are five PR URLs", () => {
    const message = `maybe tomorrow I can actually do something cool and fun
      PRs (I thought it would be just one today. I have no memory of the others. I must've blacked out):
      https://github.com/asdf/fractal-chat/pull/26
      https://github.com/asdf/fractal-chat/pull/28
      https://github.com/asdf/fractal-chat/pull/33
      https://github.com/asdf/fractal-chat/pull/37
      (got another one in) https://github.com/asdf/fractal-chat/pull/38`;
    expect(countPrsInMessage(message)).toEqual(5);
  });

  it("returns 5 when there are five PR URLs in different repos", () => {
    const message = `PRs:
      https://github.com/asdf/fghj/pull/100
      https://github.com/asdf/vbnm/pull/101
      https://github.com/asdf/zxcv/pull/103
      https://github.com/asdf/qwer/pull/104
      https://github.com/asdf/asdf/pull/1`;
    expect(countPrsInMessage(message)).toEqual(5);
  });
});

describe("getTopLeaderboard", () => {
  it("returns top 3 distinct people with no ties", () => {
    const sorted = [
      { name: "Alice", count: 5 },
      { name: "Bob", count: 4 },
      { name: "Charlie", count: 3 },
      { name: "Dave", count: 2 },
    ];
    const result = getTopLeaderboard(sorted);
    expect(result).toEqual([
      { name: "Alice", count: 5 },
      { name: "Bob", count: 4 },
      { name: "Charlie", count: 3 },
    ]);
  });

  it("includes all tied for 1st place even if more than 3", () => {
    const sorted = [
      { name: "Alice", count: 5 },
      { name: "Bob", count: 5 },
      { name: "Charlie", count: 5 },
      { name: "Dave", count: 5 },
      { name: "Eve", count: 4 },
    ];
    const result = getTopLeaderboard(sorted);
    expect(result).toEqual([
      { name: "Alice", count: 5 },
      { name: "Bob", count: 5 },
      { name: "Charlie", count: 5 },
      { name: "Dave", count: 5 },
    ]);
  });

  it("stops after 1st place tie when 3+ people already included", () => {
    const sorted = [
      { name: "A", count: 5 },
      { name: "B", count: 5 },
      { name: "C", count: 5 },
      { name: "D", count: 5 },
      { name: "E", count: 5 },
      { name: "F", count: 5 },
      { name: "G", count: 5 },
      { name: "H", count: 4 },
      { name: "I", count: 4 },
      { name: "J", count: 4 },
      { name: "K", count: 3 },
    ];
    const result = getTopLeaderboard(sorted);
    expect(result.length).toBe(7);
    expect(result.every((e) => e.count === 5)).toBe(true);
  });

  it("includes 2nd place ties when 1st + 2nd totals under 3", () => {
    const sorted = [
      { name: "Alice", count: 5 },
      { name: "Bob", count: 4 },
      { name: "Charlie", count: 4 },
      { name: "Dave", count: 3 },
    ];
    const result = getTopLeaderboard(sorted);
    expect(result).toEqual([
      { name: "Alice", count: 5 },
      { name: "Bob", count: 4 },
      { name: "Charlie", count: 4 },
    ]);
  });

  it("stops after 2nd place when 1st + 2nd already >= 3", () => {
    const sorted = [
      { name: "Alice", count: 5 },
      { name: "Bob", count: 5 },
      { name: "Charlie", count: 4 },
      { name: "Dave", count: 3 },
    ];
    const result = getTopLeaderboard(sorted);
    expect(result).toEqual([
      { name: "Alice", count: 5 },
      { name: "Bob", count: 5 },
      { name: "Charlie", count: 4 },
    ]);
  });

  it("includes 3rd place when 1st + 2nd totals 2", () => {
    const sorted = [
      { name: "Alice", count: 5 },
      { name: "Bob", count: 4 },
      { name: "Charlie", count: 3 },
      { name: "Dave", count: 3 },
      { name: "Eve", count: 2 },
    ];
    const result = getTopLeaderboard(sorted);
    expect(result).toEqual([
      { name: "Alice", count: 5 },
      { name: "Bob", count: 4 },
      { name: "Charlie", count: 3 },
      { name: "Dave", count: 3 },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(getTopLeaderboard([])).toEqual([]);
  });

  it("returns single entry when only one person", () => {
    const sorted = [{ name: "Alice", count: 3 }];
    expect(getTopLeaderboard(sorted)).toEqual([{ name: "Alice", count: 3 }]);
  });

  it("returns two entries when only two people", () => {
    const sorted = [
      { name: "Alice", count: 5 },
      { name: "Bob", count: 3 },
    ];
    expect(getTopLeaderboard(sorted)).toEqual([
      { name: "Alice", count: 5 },
      { name: "Bob", count: 3 },
    ]);
  });
});

describe("getCurrentMonthDay", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the correct ET date at 11:59 PM ET (which is next day in UTC)", () => {
    // 11:59 PM ET on Feb 13 = 4:59 AM UTC on Feb 14
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T04:59:00.000Z"));
    expect(getCurrentMonthDay()).toBe("02/13");
  });

  it("returns the correct ET date at midnight ET (which is 5 AM UTC)", () => {
    // 12:00 AM ET on Feb 14 = 5:00 AM UTC on Feb 14
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T05:00:00.000Z"));
    expect(getCurrentMonthDay()).toBe("02/14");
  });

  it("returns the correct ET date during normal daytime hours", () => {
    // 2:00 PM ET on Feb 13 = 7:00 PM UTC on Feb 13
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-13T19:00:00.000Z"));
    expect(getCurrentMonthDay()).toBe("02/13");
  });

  it("returns the correct ET date at the start of the day in ET", () => {
    // 12:01 AM ET on Jan 1 = 5:01 AM UTC on Jan 1
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T05:01:00.000Z"));
    expect(getCurrentMonthDay()).toBe("01/01");
  });

  it("handles EDT (daylight saving time) correctly", () => {
    // During EDT (UTC-4), 11:59 PM ET on Jul 15 = 3:59 AM UTC on Jul 16
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T03:59:00.000Z"));
    expect(getCurrentMonthDay()).toBe("07/15");
  });
});
