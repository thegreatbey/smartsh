import { describe, test, expect } from "vitest";
import { detectInputFormat, parseInput } from "../src/translate";
import { translateBidirectional } from "../src/bidirectionalMappings";

describe("Bidirectional translation", () => {
  describe("Input format detection", () => {
    test("detects PowerShell commands", () => {
      expect(detectInputFormat("Remove-Item -Recurse -Force test")).toBe("powershell");
      expect(detectInputFormat("Get-ChildItem -Force")).toBe("powershell");
      expect(detectInputFormat("Copy-Item -Recurse src dest")).toBe("powershell");
    });

    test("detects CMD commands", () => {
      expect(detectInputFormat("del /s /q test")).toBe("cmd");
      expect(detectInputFormat("dir /a")).toBe("cmd");
      expect(detectInputFormat("copy /s src dest")).toBe("cmd");
    });

    test("detects Unix commands", () => {
      expect(detectInputFormat("rm -rf test")).toBe("unix");
      expect(detectInputFormat("ls -la")).toBe("unix");
      expect(detectInputFormat("cp -r src dest")).toBe("unix");
    });
  });

  describe("PowerShell to Unix translation", () => {
    test("translates Remove-Item to rm", () => {
      expect(translateBidirectional("Remove-Item", "powershell", "unix", ["-Recurse", "-Force"], ["test"])).toBe("rm -r -f test");
    });

    test("translates Get-ChildItem to ls", () => {
      expect(translateBidirectional("Get-ChildItem", "powershell", "unix", ["-Force"], [])).toBe("ls -la");
    });

    test("translates Copy-Item to cp", () => {
      expect(translateBidirectional("Copy-Item", "powershell", "unix", ["-Recurse"], ["src", "dest"])).toBe("cp -r src dest");
    });
  });

  describe("CMD to Unix translation", () => {
    test("translates del to rm", () => {
      expect(translateBidirectional("del", "cmd", "unix", ["/s", "/q"], ["test"])).toBe("rm -r -f test");
    });

    test("translates dir to ls", () => {
      expect(translateBidirectional("dir", "cmd", "unix", ["/a"], [])).toBe("ls -la");
    });

    test("translates copy to cp", () => {
      expect(translateBidirectional("copy", "cmd", "unix", ["/s"], ["src", "dest"])).toBe("cp -r src dest");
    });
  });
}); 