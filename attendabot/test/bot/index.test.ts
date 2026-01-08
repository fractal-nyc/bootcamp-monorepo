import { describe, it, expect } from "vitest";
import { countPrsInMessage } from "../../src/bot/index.ts";

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
