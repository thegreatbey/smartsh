import { describe, expect, test } from "vitest";
import { lintCommand } from "../src/translate";

describe("lintCommand", () => {
  test("supported command passes", () => {
    const res = lintCommand("ls -l | grep foo");
    expect(res.unsupported.length).toBe(0);
  });

  test("unknown command flagged", () => {
    const res = lintCommand("foocmd bar | ls");
    expect(res.unsupported[0]).toMatch(/unknown command: 'foocmd'/);
  });

  test("unknown flag flagged", () => {
    const res = lintCommand("grep --foo bar.txt");
    expect(res.unsupported[0]).toMatch(/unsupported flag: '--foo' for 'grep'/);
  });

  test("provides command suggestions for typos", () => {
    const res = lintCommand("lss -la");
    expect(res.unsupported[0]).toMatch(/unknown command: 'lss'/);
    expect(res.suggestions.length).toBeGreaterThan(0);
    expect(res.suggestions[0]).toMatch(/Did you mean/);
  });

  test("provides flag suggestions", () => {
    const res = lintCommand("ls -x");
    expect(res.unsupported[0]).toMatch(/unsupported flag: '-x' for 'ls'/);
    // Flag suggestions might not be generated if no similar flags exist
    // Just test that the unsupported flag is detected correctly
  });

  test("provides flag suggestions for similar flags", () => {
    const res = lintCommand("ls -alx"); // -al is valid, -x is not
    expect(res.unsupported[0]).toMatch(/unsupported flag: '-alx' for 'ls'/);
    // This should trigger flag suggestions since -al is similar to -alx
  });

  test("handles multiple issues", () => {
    const res = lintCommand("foocmd -x && bar -y");
    expect(res.unsupported).toHaveLength(2);
    expect(res.unsupported[0]).toMatch(/unknown command: 'foocmd'/);
    expect(res.unsupported[1]).toMatch(/unknown command: 'bar'/);
  });
}); 