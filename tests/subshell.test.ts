import { describe, test, expect } from "vitest";
import { translateCommand } from "../src/translate";

const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;

describe("translateCommand – subshell/grouping", () => {
  test("grouping preserved after translated cmd", () => {
    expect(translateCommand("ls -l && (grep foo file.txt)", ps7)).toBe(
      "Get-ChildItem && (grep foo file.txt)"
    );
  });

  test("brace grouping untouched", () => {
    const cmd = "{ echo a; echo b; } || echo fail";
    expect(translateCommand(cmd, ps7)).toBe(cmd);
  });

  test("pipe inside subshell grouping preserved", () => {
    expect(translateCommand("(sort | uniq) | wc -l", ps7)).toBe(
      "(sort | uniq) | Measure-Object -Line"
    );
  });
}); 