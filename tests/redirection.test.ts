import { describe, expect, test } from "vitest";

import { translateCommand } from "../src/translate";

// Simulate modern PowerShell (supports &&/|| natively)
const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;

describe("translateCommand – redirection operators", () => {
  test("single > redirect", () => {
    expect(translateCommand("ls -l > out.txt", ps7)).toBe(
      "Get-ChildItem > out.txt"
    );
  });

  test("append >> redirect", () => {
    expect(translateCommand("grep foo bar.txt >> log.txt", ps7)).toBe(
      "Select-String foo bar.txt >> log.txt"
    );
  });

  test("stderr redirect 2>", () => {
    expect(translateCommand("grep foo bar.txt 2> err.txt", ps7)).toBe(
      "Select-String foo bar.txt 2> err.txt"
    );
  });

  test("stderr merge 2>&1", () => {
    expect(translateCommand("node script.js 2>&1", ps7)).toBe(
      "node script.js 2>&1"
    );
  });

  test("pipeline with redirects", () => {
    expect(
      translateCommand("grep foo bar.txt 2> err.txt | sort > out.txt", ps7)
    ).toBe(
      "Select-String foo bar.txt 2> err.txt | Sort-Object > out.txt"
    );
  });
}); 