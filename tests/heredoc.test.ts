import { describe, test, expect } from "vitest";
import { translateCommand } from "../src/translate";

const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;

describe("translateCommand – here-doc preservation", () => {
  test("cat with here-doc is left untouched", () => {
    const cmd = "cat <<EOF hello EOF";
    expect(translateCommand(cmd, ps7)).toBe(cmd);
  });

  test("pipeline before heredoc still translates", () => {
    const cmd = "grep foo file.txt && cat <<EOF hi EOF";
    expect(translateCommand(cmd, ps7)).toBe(
      "Select-String foo file.txt && cat <<EOF hi EOF"
    );
  });
}); 