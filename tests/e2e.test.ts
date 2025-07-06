import { describe, expect, test } from "vitest";
import { translateCommand } from "../src/translate";

describe("E2E translation scenarios", () => {
  const ps5 = { type: "powershell", supportsConditionalConnectors: false } as const;

  test("complex pipeline and connectors", () => {
    const input = "ls -la | grep .ts | head -5 && echo done || echo fail";
    const output = translateCommand(input, ps5);
    expect(output).toBe(
      "Get-ChildItem -Force | Select-String .ts | Select-Object -First 5; if ($?) { echo done }; if (-not $?) { echo fail }"
    );
  });
}); 