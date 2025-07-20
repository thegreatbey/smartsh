import { describe, test, expect } from "vitest";
import { translateCommand } from "../src/translate";

const ps7 = { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell" } as const;

describe("translateCommand – command substitution", () => {
  test("outer command translated, inner $(...) left untouched", () => {
    expect(translateCommand("ls $(pwd)", ps7)).toBe(
      "Get-ChildItem $(pwd)"
    );
  });

  test("no change when only substitution", () => {
    expect(translateCommand("echo $(date)", ps7)).toBe(
      "echo $(date)"
    );
  });
}); 
