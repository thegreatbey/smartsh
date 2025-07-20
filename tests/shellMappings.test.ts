import { describe, test, expect } from "vitest";
import { translateForShell } from "../src/shellMappings";

describe("Shell-specific translations", () => {
  describe("CMD translations", () => {
    test("translates rm -rf to del /s /q", () => {
      expect(translateForShell("rm", "cmd", ["-rf"], ["dist"])).toBe("del /s /q dist");
    });

    test("translates ls -la to dir /a", () => {
      expect(translateForShell("ls", "cmd", ["-la"], [])).toBe("dir /a");
    });

    test("translates cp -r to copy /s", () => {
      expect(translateForShell("cp", "cmd", ["-r"], ["src", "dest"])).toBe("copy /s src dest");
    });

    test("translates mv to move", () => {
      expect(translateForShell("mv", "cmd", [], ["file1", "file2"])).toBe("move file1 file2");
    });

    test("translates mkdir to md", () => {
      expect(translateForShell("mkdir", "cmd", [], ["newdir"])).toBe("md newdir");
    });

    test("translates cat to type", () => {
      expect(translateForShell("cat", "cmd", [], ["file.txt"])).toBe("type file.txt");
    });

    test("translates grep -i to findstr /i", () => {
      expect(translateForShell("grep", "cmd", ["-i"], ["pattern", "file.txt"])).toBe("findstr /i pattern file.txt");
    });

    test("translates pwd to cd", () => {
      expect(translateForShell("pwd", "cmd", [], [])).toBe("cd");
    });

    test("translates clear to cls", () => {
      expect(translateForShell("clear", "cmd", [], [])).toBe("cls");
    });

    test("translates whoami to echo %USERNAME%", () => {
      expect(translateForShell("whoami", "cmd", [], [])).toBe("echo %USERNAME%");
    });

    test("translates hostname to echo %COMPUTERNAME%", () => {
      expect(translateForShell("hostname", "cmd", [], [])).toBe("echo %COMPUTERNAME%");
    });

    test("translates sleep to timeout", () => {
      expect(translateForShell("sleep", "cmd", [], ["5"])).toBe("timeout 5");
    });

    test("translates ps to tasklist", () => {
      expect(translateForShell("ps", "cmd", [], [])).toBe("tasklist");
    });

    test("translates kill -9 to taskkill /f", () => {
      expect(translateForShell("kill", "cmd", ["-9"], ["1234"])).toBe("taskkill /f 1234");
    });
  });

  describe("PowerShell translations", () => {
    test("translates rm -rf to Remove-Item -Recurse -Force", () => {
      expect(translateForShell("rm", "ps", ["-rf"], ["dist"])).toBe("Remove-Item -Recurse -Force dist");
    });

    test("translates ls -la to Get-ChildItem -Force", () => {
      expect(translateForShell("ls", "ps", ["-la"], [])).toBe("Get-ChildItem -Force");
    });

    test("translates cp -r to Copy-Item -Recurse", () => {
      expect(translateForShell("cp", "ps", ["-r"], ["src", "dest"])).toBe("Copy-Item -Recurse src dest");
    });
  });

  describe("Unix shell translations", () => {
    test("preserves original commands for bash", () => {
      expect(translateForShell("rm", "bash", ["-rf"], ["dist"])).toBe("rm -rf dist");
    });

    test("preserves original commands for ash", () => {
      expect(translateForShell("ls", "ash", ["-la"], [])).toBe("ls -la");
    });

    test("preserves original commands for dash", () => {
      expect(translateForShell("cp", "dash", ["-r"], ["src", "dest"])).toBe("cp -r src dest");
    });

    test("preserves original commands for zsh", () => {
      expect(translateForShell("grep", "zsh", ["-i"], ["pattern"])).toBe("grep -i pattern");
    });

    test("preserves original commands for fish", () => {
      expect(translateForShell("echo", "fish", [], ["hello"])).toBe("echo hello");
    });

    test("preserves original commands for ksh", () => {
      expect(translateForShell("pwd", "ksh", [], [])).toBe("pwd");
    });

    test("preserves original commands for tcsh", () => {
      expect(translateForShell("clear", "tcsh", [], [])).toBe("clear");
    });
  });

  describe("Unknown commands", () => {
    test("returns original command for unknown Unix command", () => {
      expect(translateForShell("unknowncmd", "cmd", ["-flag"], ["arg"])).toBe("unknowncmd");
    });
  });

  describe("Unknown flags", () => {
    test("preserves unknown flags", () => {
      expect(translateForShell("rm", "cmd", ["-unknown"], ["file"])).toBe("del -unknown file");
    });
  });
}); 