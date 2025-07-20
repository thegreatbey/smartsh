import { describe, test, expect } from "vitest";
import { translateCommand } from "../src/translate";

const ps7 = { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell" } as const;

describe("translateCommand – env var expansion", () => {
  test("ls with default expansion", () => {
    const cmd = "ls ${DIR:-.}";
    expect(translateCommand(cmd, ps7)).toBe(cmd);
  });

  test("echo with pattern replacement", () => {
    const cmd = "echo ${NAME/foo/bar}";
    expect(translateCommand(cmd, ps7)).toBe(cmd);
  });
}); 
