import { describe, expect, test } from "vitest";
import { translateCommand } from "../src/translate";

describe("translateCommand – redirection operators", () => {
  test("single > redirect", () => {
    const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;
    expect(translateCommand("ls -l > out.txt", ps7)).toBe(
      "Get-ChildItem > out.txt"
    );
  });

  test("append >> redirect", () => {
    const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;
    expect(translateCommand("grep foo bar.txt >> log.txt", ps7)).toBe(
      "Select-String foo bar.txt >> log.txt"
    );
  });

  test("stderr redirect 2>", () => {
    const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;
    expect(translateCommand("grep foo bar.txt 2> err.txt", ps7)).toBe(
      "Select-String foo bar.txt 2> err.txt"
    );
  });

  test("stderr merge 2>&1", () => {
    const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;
    expect(translateCommand("node script.js 2>&1", ps7)).toBe(
      "node script.js 2>&1"
    );
  });

  test("pipeline with redirects", () => {
    const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;
    expect(
      translateCommand("grep foo bar.txt 2> err.txt | sort > out.txt", ps7)
    ).toBe(
      "Select-String foo bar.txt 2> err.txt | Sort-Object > out.txt"
    );
  });
}); 