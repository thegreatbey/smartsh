import { describe, expect, test } from "vitest";
import { translateCommand } from "../src/translate";

const ps7 = { type: "powershell", supportsConditionalConnectors: true } as const;

describe("New command mappings", () => {
  test("cut -d , -f 2", () => {
    expect(translateCommand("cut -d , -f 2", ps7)).toBe("ForEach-Object { $_.Split(',')[1] }");
  });

  test("tr a b", () => {
    expect(translateCommand("tr 'a' 'b'", ps7)).toBe("ForEach-Object { $_.Replace('a','b') }");
  });

  test("uniq -c", () => {
    expect(translateCommand("uniq -c", ps7)).toBe("Group-Object | ForEach-Object { \"$($_.Count) $($_.Name)\" }");
  });

  test("grep -v pattern", () => {
    expect(translateCommand("grep -v foo file.txt", ps7)).toBe(
      "Select-String -NotMatch foo file.txt"
    );
  });

  test("grep -E pattern", () => {
    expect(translateCommand("grep -E foo file.txt", ps7)).toBe(
      "Select-String foo file.txt"
    );
  });

  test("grep -F pattern", () => {
    expect(translateCommand("grep -F foo file.txt", ps7)).toBe(
      "Select-String -SimpleMatch foo file.txt"
    );
  });

  test("sort -n", () => {
    expect(translateCommand("sort -n", ps7)).toBe(
      "Sort-Object { [double]$_ }"
    );
  });

  test("find -name *.tmp -delete", () => {
    expect(translateCommand("find . -name '*.tmp' -delete", ps7)).toBe(
      "Get-ChildItem . -Recurse -Filter *.tmp | Remove-Item"
    );
  });

  test("find -type f -exec echo {} ;", () => {
    expect(translateCommand("find . -type f -exec echo {} ;", ps7)).toBe(
      "Get-ChildItem . -Recurse | ForEach-Object { echo $_ }"
    );
  });

  test("xargs -0 rm -f", () => {
    expect(translateCommand("xargs -0 rm -f", ps7)).toBe(
      "ForEach-Object { rm -f $_ }"
    );
  });

  test("sed -n '5p' file", () => {
    expect(translateCommand("sed -n '5p' file.txt", ps7)).toBe(
      "Select-Object -Index 4 file.txt"
    );
  });

  test("grep -q pattern", () => {
    expect(translateCommand("grep -q foo file.txt", ps7)).toBe(
      "Select-String -Quiet foo file.txt"
    );
  });
}); 