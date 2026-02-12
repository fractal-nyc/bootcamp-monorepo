import { describe, it, expect } from "vitest";
import { countPrsInMessage, getTopLeaderboard } from "../../bot/index.js";

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
      { name: "Alice", count: 5, rank: 1 },
      { name: "Bob", count: 4, rank: 2 },
      { name: "Charlie", count: 3, rank: 3 },
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
      { name: "Alice", count: 5, rank: 1 },
      { name: "Bob", count: 5, rank: 1 },
      { name: "Charlie", count: 5, rank: 1 },
      { name: "Dave", count: 5, rank: 1 },
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
    expect(result.every((e) => e.count === 5 && e.rank === 1)).toBe(true);
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
      { name: "Alice", count: 5, rank: 1 },
      { name: "Bob", count: 4, rank: 2 },
      { name: "Charlie", count: 4, rank: 2 },
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
      { name: "Alice", count: 5, rank: 1 },
      { name: "Bob", count: 5, rank: 1 },
      { name: "Charlie", count: 4, rank: 2 },
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
      { name: "Alice", count: 5, rank: 1 },
      { name: "Bob", count: 4, rank: 2 },
      { name: "Charlie", count: 3, rank: 3 },
      { name: "Dave", count: 3, rank: 3 },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(getTopLeaderboard([])).toEqual([]);
  });

  it("returns single entry when only one person", () => {
    const sorted = [{ name: "Alice", count: 3 }];
    expect(getTopLeaderboard(sorted)).toEqual([
      { name: "Alice", count: 3, rank: 1 },
    ]);
  });

  it("returns two entries when only two people", () => {
    const sorted = [
      { name: "Alice", count: 5 },
      { name: "Bob", count: 3 },
    ];
    expect(getTopLeaderboard(sorted)).toEqual([
      { name: "Alice", count: 5, rank: 1 },
      { name: "Bob", count: 3, rank: 2 },
    ]);
  });
});
