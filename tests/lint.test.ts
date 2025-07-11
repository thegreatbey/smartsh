import { describe, expect, test } from "vitest";
import { lintCommand } from "../src/translate";

describe("lintCommand", () => {
  test("supported command passes", () => {
    const res = lintCommand("ls -l | grep foo");
    expect(res.unsupported.length).toBe(0);
  });

  test("unknown command flagged", () => {
    const res = lintCommand("foocmd bar | ls");
    expect(res.unsupported[0]).toMatch(/unknown command/);
  });

  test("unknown flag flagged", () => {
    const res = lintCommand("grep --foo bar.txt");
    expect(res.unsupported[0]).toMatch(/unsupported flag/);
  });
}); 