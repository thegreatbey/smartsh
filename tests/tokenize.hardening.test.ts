import { describe, it, expect } from "vitest";
import { tokenizeWithPos } from "../src/tokenize";

// Helper to extract raw token values for easier assertions
function vals(cmd: string) {
  return tokenizeWithPos(cmd).map((t) => t.value);
}

describe("tokenizeWithPos hardening – tricky quoting", () => {
  it("handles double-quoted string containing single quotes", () => {
    const cmd = `echo "He said, 'hello'"`;
    const tokVals = vals(cmd);
    expect(tokVals).toEqual(["echo", '"He said, \'hello\'"']);
  });

  it("handles single-quoted string containing double quotes", () => {
    const cmd = `echo 'Nested "double" quotes'`;
    const tokVals = vals(cmd);
    expect(tokVals).toEqual(["echo", "'Nested \"double\" quotes'"]);
  });

  it("keeps Windows path with spaces as single token when quoted", () => {
    const cmd = `cat "C:\\Program Files\\Smart App\\file.txt"`;
    const tokVals = vals(cmd);
    expect(tokVals).toEqual(["cat", '"C:\\Program Files\\Smart App\\file.txt"']);
  });
});

describe("tokenizeWithPos hardening – fuzz does not throw", () => {
  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const sampleCmds = [
    "ls",
    "cat",
    "grep",
    "echo",
    "awk",
    "sed",
  ];
  const sampleArgs = [
    "foo.txt",
    "bar.log",
    "'some value'",
    "\"other value\"",
    "*.ts",
    "C:/Temp/file.txt",
    "\"C:/Program Files/App/app.exe\"",
  ];
  const connectors = ["|", "&&", "||"];

  it("random pipelines should never throw", () => {
    for (let i = 0; i < 300; i++) {
      const parts = [] as string[];
      const segments = randInt(1, 4);
      for (let s = 0; s < segments; s++) {
        const cmd = sampleCmds[randInt(0, sampleCmds.length - 1)];
        const argCount = randInt(0, 3);
        const args = [] as string[];
        for (let a = 0; a < argCount; a++) {
          args.push(sampleArgs[randInt(0, sampleArgs.length - 1)]);
        }
        parts.push([cmd, ...args].join(" "));
        if (s < segments - 1) {
          parts.push(connectors[randInt(0, connectors.length - 1)]);
        }
      }
      const pipeline = parts.join(" ");
      expect(() => tokenizeWithPos(pipeline)).not.toThrow();
    }
  });
}); 