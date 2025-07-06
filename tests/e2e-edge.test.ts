import { describe, expect, test } from "vitest";
import { translateCommand } from "../src/translate";

describe("Edge-case E2E scenarios", () => {
  const ps5 = { type: "powershell", supportsConditionalConnectors: false } as const;
  const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;

  test("failure branch triggers ||", () => {
    const input = "node -e \"process.exit(1)\" && echo ok || echo fail";
    const output = translateCommand(input, ps5);
    expect(output).toBe(
      "node -e \"process.exit(1)\"; if ($?) { echo ok }; if (-not $?) { echo fail }"
    );
  });

  test("cp -rf combined flags", () => {
    expect(translateCommand("cp -rf src dist", ps7)).toBe(
      "Copy-Item -Recurse -Force src dist"
    );
  });

  test("grep -in combined flags", () => {
    expect(translateCommand("grep -in foo file.txt", ps7)).toBe(
      "Select-String -CaseSensitive:$false -LineNumber foo file.txt"
    );
  });

  test("escaped && is literal", () => {
    expect(translateCommand("echo \\&& echo lit", ps7)).toBe(
      "echo \\&& echo lit"
    );
  });
}); 