console.log('translate.test.ts LOADED');
import { describe, expect, test } from "vitest";

import {
  __test_splitByConnectors as splitByConnectors,
  translateCommand,
} from "../src/translate";

describe("splitByConnectors", () => {
  console.log('describe splitByConnectors ENTERED');
  test("splits simple connectors", () => {
    console.log('test splits simple connectors ENTERED');
    expect(splitByConnectors("echo a && echo b || echo c")).toEqual([
      "echo a",
      "&&",
      "echo b",
      "||",
      "echo c",
    ]);
    expect(true).toBe(true);
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
    needsUnixTranslation: true,
    targetShell: "powershell",
  } as const;

  test("translates for legacy PowerShell", () => {
    expect(
      translateCommand("echo ok && echo bad || echo fail", legacyPS)
    ).toBe("echo ok; if ($?) { echo bad }; if (-not $?) { echo fail }");
  });
});

describe("translateCommand with Unix commands", () => {
  const ps7 = { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell" } as const;
  const ps5 = { type: "powershell", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "powershell" } as const;

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

  test("translates cp -r for PowerShell 7+", () => {
    expect(translateCommand("cp -r src dist", ps7)).toBe(
      "Copy-Item -Recurse src dist"
    );
  });

  test("translates mv for PowerShell 7+", () => {
    expect(translateCommand("mv a.txt b.txt", ps7)).toBe(
      "Move-Item a.txt b.txt"
    );
  });

  test("translates touch for PowerShell 7+", () => {
    expect(translateCommand("touch new.txt", ps7)).toBe(
      "New-Item -ItemType File new.txt"
    );
  });

  test("translates pipeline with ls and grep", () => {
    expect(translateCommand("ls -la | grep .js", ps7)).toBe(
      "Get-ChildItem -Force | Select-String .js"
    );
  });

  test("translates cat for PowerShell 7+", () => {
    expect(translateCommand("cat file.txt", ps7)).toBe(
      "Get-Content file.txt"
    );
  });

  test("translates head -10", () => {
    expect(translateCommand("head -10 file.txt", ps7)).toBe(
      "Select-Object -First 10 file.txt"
    );
  });

  test("translates tail -n 5", () => {
    expect(translateCommand("tail -n 5 file.txt", ps7)).toBe(
      "Select-Object -Last 5 file.txt"
    );
  });

  test("translates wc -l", () => {
    expect(translateCommand("wc -l", ps7)).toBe(
      "Measure-Object -Line"
    );
  });

  test("translates which", () => {
    expect(translateCommand("which node", ps7)).toBe(
      "Get-Command node"
    );
  });

  test("translates sort", () => {
    expect(translateCommand("sort", ps7)).toBe(
      "Sort-Object"
    );
  });

  test("translates uniq", () => {
    expect(translateCommand("uniq", ps7)).toBe(
      "Select-Object -Unique"
    );
  });

  test("translates find -name pattern", () => {
    expect(translateCommand("find . -name *.ts", ps7)).toBe(
      "Get-ChildItem -Recurse -Filter . *.ts"
    );
  });

  test("translates pwd", () => {
    expect(translateCommand("pwd", ps7)).toBe(
      "Get-Location"
    );
  });

  test("translates date", () => {
    expect(translateCommand("date", ps7)).toBe(
      "Get-Date"
    );
  });

  test("translates clear", () => {
    expect(translateCommand("clear", ps7)).toBe(
      "Clear-Host"
    );
  });

  test("translates sleep 5", () => {
    expect(translateCommand("sleep 5", ps7)).toBe(
      "Start-Sleep 5"
    );
  });

  test("translates ps", () => {
    expect(translateCommand("ps", ps7)).toBe(
      "Get-Process"
    );
  });

  test("translates kill pid", () => {
    expect(translateCommand("kill 1234", ps7)).toBe(
      "Stop-Process 1234"
    );
  });

  test("translates kill -9 pid", () => {
    expect(translateCommand("kill -9 1234", ps7)).toBe(
      "Stop-Process -Force 1234"
    );
  });

  test("translates df -h", () => {
    expect(translateCommand("df -h", ps7)).toBe(
      "Get-PSDrive"
    );
  });

  test("translates hostname", () => {
    expect(translateCommand("hostname", ps7)).toBe(
      "$env:COMPUTERNAME"
    );
  });

  test("translates whoami", () => {
    expect(translateCommand("whoami", ps7)).toBe(
      "$env:USERNAME"
    );
  });

  test("translates dirname", () => {
    expect(translateCommand("dirname /etc/passwd", ps7)).toBe(
      "Split-Path -Parent /etc/passwd"
    );
  });

  test("translates basename", () => {
    expect(translateCommand("basename /etc/passwd", ps7)).toBe(
      "Split-Path -Leaf /etc/passwd"
    );
  });

  test("translates tee -a", () => {
    expect(translateCommand("echo foo | tee -a out.txt", ps7)).toBe(
      "echo foo | Tee-Object -FilePath -Append out.txt"
    );
  });

  test("translates sed substitution", () => {
    expect(translateCommand("sed 's/foo/bar/' file.txt", ps7)).toBe(
      "-replace 'foo','bar' file.txt"
    );
  });

  test("translates pipeline with sed", () => {
    expect(translateCommand("echo foo | sed 's/foo/bar/'", ps7)).toBe(
      "echo foo | -replace 'foo','bar'"
    );
  });

  test("translates sed substitution with g flag", () => {
    expect(translateCommand("sed 's/foo/bar/g' file.txt", ps7)).toBe(
      "-replace 'foo','bar' file.txt"
    );
  });

  test("translates sed substitution with # delimiter", () => {
    expect(translateCommand("sed 's#foo#bar#' file.txt", ps7)).toBe(
      "-replace 'foo','bar' file.txt"
    );
  });

  test("translates head -c N", () => {
    expect(translateCommand("head -c 7 file.txt", ps7)).toBe(
      "Select-Object -First 7 file.txt"
    );
  });

  test("translates awk print $1", () => {
    expect(translateCommand("awk '{print $1}'", ps7)).toBe(
      "ForEach-Object { $_.Split()[0] }"
    );
  });
}); 
