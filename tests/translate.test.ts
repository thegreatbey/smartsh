import { describe, expect, test } from "vitest";

import {
  __test_splitByConnectors as splitByConnectors,
  translateCommand,
} from "../src/translate";

describe("splitByConnectors", () => {
  test("splits simple connectors", () => {
    expect(splitByConnectors("echo a && echo b || echo c")).toEqual([
      "echo a",
      "&&",
      "echo b",
      "||",
      "echo c",
    ]);
  });

  test("ignores connectors inside quotes", () => {
    expect(
      splitByConnectors(
        "node -e \"console.log('a && b')\" && echo after"
      )
    ).toEqual([
      "node -e \"console.log('a && b')\"",
      "&&",
      "echo after",
    ]);
  });

  test("filters empty tokens", () => {
    expect(splitByConnectors("&& echo hi ||")).toEqual(["&&", "echo hi", "||"]);
  });

  test("handles nested quotes", () => {
    expect(
      splitByConnectors("echo \"outer 'inner && hidden'\" && echo after")
    ).toEqual([
      "echo \"outer 'inner && hidden'\"",
      "&&",
      "echo after",
    ]);
  });

  test("ignores backtick-escaped connectors in PowerShell style", () => {
    expect(splitByConnectors("echo a `&`& echo b || echo c")).toEqual([
      "echo a `&`& echo b",
      "||",
      "echo c",
    ]);
  });
});

describe("translateCommand", () => {
  const legacyPS = {
    type: "powershell",
    supportsConditionalConnectors: false,
  } as const;

  test("translates for legacy PowerShell", () => {
    expect(
      translateCommand("echo ok && echo bad || echo fail", legacyPS)
    ).toBe("echo ok; if ($?) { echo bad }; if (-not $?) { echo fail }");
  });
});

describe("translateCommand with Unix commands", () => {
  const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;
  const ps5 = { type: "powershell", supportsConditionalConnectors: false } as const;

  test("translates rm -rf for PowerShell 7+", () => {
    expect(translateCommand("rm -rf dist", ps7)).toBe(
      "Remove-Item -Recurse -Force dist"
    );
  });

  test("translates chain with connectors for legacy PowerShell", () => {
    expect(
      translateCommand("rm -rf dist && mkdir -p dist", ps5)
    ).toBe(
      "Remove-Item -Recurse -Force dist; if ($?) { New-Item -ItemType Directory -Force dist }"
    );
  });
}); 