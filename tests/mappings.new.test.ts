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

describe("tar command", () => {
  test("tar -czf archive.tar.gz files/", () => {
    expect(translateCommand("tar -czf archive.tar.gz files/", ps7)).toBe("tar -czf archive.tar.gz files/");
  });

  test("tar -xzf archive.tar.gz", () => {
    expect(translateCommand("tar -xzf archive.tar.gz", ps7)).toBe("tar -xzf archive.tar.gz");
  });

  test("tar -tvf archive.tar.gz", () => {
    expect(translateCommand("tar -tvf archive.tar.gz", ps7)).toBe("tar -tvf archive.tar.gz");
  });
});

describe("curl command", () => {
  test("curl -o file.txt https://example.com", () => {
    expect(translateCommand("curl -o file.txt https://example.com", ps7)).toBe("Invoke-WebRequest -OutFile file.txt https://example.com");
  });

  test("curl -s -L https://example.com", () => {
    expect(translateCommand("curl -s -L https://example.com", ps7)).toBe("Invoke-WebRequest -UseBasicParsing -MaximumRedirection https://example.com");
  });

  test("curl -X POST -d 'data' https://api.example.com", () => {
    expect(translateCommand("curl -X POST -d 'data' https://api.example.com", ps7)).toBe("Invoke-WebRequest -Method -Body POST data https://api.example.com");
  });
});

describe("wget command", () => {
  test("wget -O file.txt https://example.com", () => {
    expect(translateCommand("wget -O file.txt https://example.com", ps7)).toBe("Invoke-WebRequest -OutFile file.txt https://example.com");
  });

  test("wget -q -c https://example.com/file.zip", () => {
    expect(translateCommand("wget -q -c https://example.com/file.zip", ps7)).toBe("Invoke-WebRequest -UseBasicParsing -Resume https://example.com/file.zip");
  });

  test("wget -r -np https://example.com", () => {
    expect(translateCommand("wget -r -np https://example.com", ps7)).toBe("Invoke-WebRequest -Recurse -NoParent https://example.com");
  });
});

describe("diff command", () => {
  test("diff file1.txt file2.txt", () => {
    expect(translateCommand("diff file1.txt file2.txt", ps7)).toBe("Compare-Object file1.txt file2.txt");
  });

  test("diff -u file1.txt file2.txt", () => {
    expect(translateCommand("diff -u file1.txt file2.txt", ps7)).toBe("Compare-Object -Unified file1.txt file2.txt");
  });

  test("diff -r dir1/ dir2/", () => {
    expect(translateCommand("diff -r dir1/ dir2/", ps7)).toBe("Compare-Object -Recurse dir1/ dir2/");
  });
});

describe("split command", () => {
  test("split -l 1000 largefile.txt", () => {
    expect(translateCommand("split -l 1000 largefile.txt", ps7)).toBe("Split-Content -LineCount 1000 largefile.txt");
  });

  test("split -b 1M largefile.txt", () => {
    expect(translateCommand("split -b 1M largefile.txt", ps7)).toBe("Split-Content -ByteCount 1M largefile.txt");
  });
});

describe("paste command", () => {
  test("paste file1.txt file2.txt", () => {
    expect(translateCommand("paste file1.txt file2.txt", ps7)).toBe("Join-Object file1.txt file2.txt");
  });

  test("paste -d ',' file1.txt file2.txt", () => {
    expect(translateCommand("paste -d ',' file1.txt file2.txt", ps7)).toBe("Join-Object -Delimiter , file1.txt file2.txt");
  });
}); 