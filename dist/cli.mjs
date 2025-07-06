#!/usr/bin/env node
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/unixMappings.ts
function tokenize(segment) {
  const tokens = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (quote) {
      current += ch;
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current)
    tokens.push(current);
  return tokens;
}
function translateSingleUnixSegment(segment) {
  const tokens = tokenize(segment);
  if (tokens.length === 0)
    return segment;
  const cmd = tokens[0];
  if (cmd === "head" || cmd === "tail") {
    let count;
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (/^-\d+$/.test(tok)) {
        count = parseInt(tok.slice(1), 10);
        break;
      }
      if (tok === "-n" && i + 1 < tokens.length) {
        count = parseInt(tokens[i + 1], 10);
        break;
      }
    }
    if (!count || isNaN(count)) {
      return segment;
    }
    const flag = cmd === "head" ? "-First" : "-Last";
    const targetArgs = tokens.slice(1).filter((t) => {
      if (t.startsWith("-"))
        return false;
      if (t === String(count))
        return false;
      return true;
    });
    const psCmd = `Select-Object ${flag} ${count}`;
    return [psCmd, ...targetArgs].join(" ");
  }
  if (cmd === "wc" && tokens.length >= 2 && tokens[1] === "-l") {
    const restArgs = tokens.slice(2);
    return ["Measure-Object -Line", ...restArgs].join(" ");
  }
  const mapping = MAPPINGS.find((m) => m.unix === cmd);
  if (!mapping)
    return segment;
  const flagTokens = tokens.slice(1).filter((t) => t.startsWith("-"));
  const argTokens = tokens.slice(1).filter((t) => !t.startsWith("-"));
  let psFlags = "";
  for (const flagTok of flagTokens) {
    const mapped = mapping.flagMap[flagTok];
    if (mapped !== void 0) {
      if (mapped)
        psFlags += " " + mapped;
    } else {
      return segment;
    }
  }
  if (mapping.forceArgs && argTokens.length === 0) {
    return segment;
  }
  const psCommand = `${mapping.ps}${psFlags}`.trim();
  return [psCommand, ...argTokens].join(" ");
}
var RM_MAPPING, MKDIR_MAPPING, LS_MAPPING, CP_MAPPING, MV_MAPPING, TOUCH_MAPPING, GREP_MAPPING, CAT_MAPPING, MAPPINGS;
var init_unixMappings = __esm({
  "src/unixMappings.ts"() {
    "use strict";
    RM_MAPPING = {
      unix: "rm",
      ps: "Remove-Item",
      flagMap: {
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force",
        "-r": "-Recurse",
        "-f": "-Force"
      },
      forceArgs: true
    };
    MKDIR_MAPPING = {
      unix: "mkdir",
      ps: "New-Item -ItemType Directory",
      flagMap: {
        "-p": "-Force"
      }
    };
    LS_MAPPING = {
      unix: "ls",
      ps: "Get-ChildItem",
      flagMap: {
        "-la": "-Force",
        "-al": "-Force",
        "-a": "-Force",
        "-l": ""
      }
    };
    CP_MAPPING = {
      unix: "cp",
      ps: "Copy-Item",
      flagMap: {
        "-r": "-Recurse",
        "-R": "-Recurse",
        "-f": "-Force",
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force"
      },
      forceArgs: true
    };
    MV_MAPPING = {
      unix: "mv",
      ps: "Move-Item",
      flagMap: {},
      forceArgs: true
    };
    TOUCH_MAPPING = {
      unix: "touch",
      ps: "New-Item -ItemType File",
      flagMap: {},
      forceArgs: true
    };
    GREP_MAPPING = {
      unix: "grep",
      ps: "Select-String",
      flagMap: {
        "-i": "-CaseSensitive:$false",
        "-n": "-LineNumber",
        "-in": "-CaseSensitive:$false -LineNumber",
        "-ni": "-CaseSensitive:$false -LineNumber"
      },
      forceArgs: true
    };
    CAT_MAPPING = {
      unix: "cat",
      ps: "Get-Content",
      flagMap: {},
      forceArgs: true
    };
    MAPPINGS = [RM_MAPPING, MKDIR_MAPPING, LS_MAPPING, CP_MAPPING, MV_MAPPING, TOUCH_MAPPING, GREP_MAPPING, CAT_MAPPING];
  }
});

// src/translate.ts
function debugLog(...args) {
  if (DEBUG) {
    console.log("[smartsh/sm debug]", ...args);
  }
}
function getPowerShellVersionSync() {
  const { execSync } = __require("child_process");
  const candidates = ["pwsh", "powershell"];
  for (const cmd of candidates) {
    try {
      const output = execSync(
        `${cmd} -NoProfile -Command "$PSVersionTable.PSVersion.Major"`,
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          windowsHide: true,
          timeout: 3e3
        }
      ).trim();
      const major = parseInt(output, 10);
      if (!isNaN(major)) {
        debugLog(`Detected PowerShell version ${major} via '${cmd}'.`);
        return major;
      }
    } catch (err) {
      if ((err == null ? void 0 : err.code) !== "ENOENT" && DEBUG) {
        console.error("[smartsh debug]", `Failed to probe '${cmd}':`, err.message ?? err);
      }
    }
  }
  debugLog("Unable to determine PowerShell version.");
  return null;
}
function detectShell() {
  var _a2, _b;
  if (OVERRIDE_SHELL) {
    debugLog(`Using shell override: ${OVERRIDE_SHELL}`);
    if (OVERRIDE_SHELL === "powershell") {
      const version = getPowerShellVersionSync();
      return {
        type: "powershell",
        version,
        supportsConditionalConnectors: version !== null && version >= 7
      };
    }
    return {
      type: OVERRIDE_SHELL,
      supportsConditionalConnectors: true
    };
  }
  if (process.platform === "win32") {
    const isCmd = Boolean(process.env.PROMPT) && !process.env.PSModulePath;
    if (isCmd) {
      debugLog("Detected CMD via PROMPT env.");
      return { type: "cmd", supportsConditionalConnectors: true };
    }
    const comspec = (_a2 = process.env.ComSpec) == null ? void 0 : _a2.toLowerCase();
    if (comspec == null ? void 0 : comspec.includes("cmd.exe")) {
      debugLog("Detected CMD via ComSpec path.");
      return { type: "cmd", supportsConditionalConnectors: true };
    }
    const shellEnv = (_b = process.env.SHELL) == null ? void 0 : _b.toLowerCase();
    if (shellEnv && shellEnv.includes("bash")) {
      debugLog("Detected Bash on Windows via SHELL env:", shellEnv);
      return { type: "bash", supportsConditionalConnectors: true };
    }
    const version = getPowerShellVersionSync();
    return {
      type: "powershell",
      version,
      supportsConditionalConnectors: version !== null && version >= 7
    };
  }
  const shellPath = process.env.SHELL;
  if (shellPath) {
    debugLog(`Detected Unix shell via SHELL env: ${shellPath}`);
  }
  return { type: "bash", supportsConditionalConnectors: true };
}
function translateCommand(command, shell) {
  if (shell.type === "powershell") {
    const parts = splitByConnectors(command).map((part) => {
      if (part === "&&" || part === "||")
        return part;
      const pipeParts = splitByPipe(part);
      const translatedPipeParts = pipeParts.map(translateSingleUnixSegment);
      return translatedPipeParts.join(" | ");
    });
    const unixTranslated = parts.join(" ");
    if (shell.supportsConditionalConnectors) {
      return unixTranslated;
    }
    return translateForLegacyPowerShell(unixTranslated);
  }
  return command;
}
function splitByConnectors(cmd) {
  const parts = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      if (ch === "\\") {
        current += ch;
        if (i + 1 < cmd.length) {
          current += cmd[i + 1];
          i++;
        }
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "\\" || ch === "`") {
      current += ch;
      if (i + 1 < cmd.length) {
        current += cmd[i + 1];
        i++;
      }
      continue;
    }
    const next = cmd[i + 1];
    if (ch === "&" && next === "&") {
      const chunk = current.trim();
      if (chunk) {
        parts.push(chunk);
      }
      parts.push("&&");
      current = "";
      i++;
      continue;
    }
    if (ch === "|" && next === "|") {
      const chunk = current.trim();
      if (chunk) {
        parts.push(chunk);
      }
      parts.push("||");
      current = "";
      i++;
      continue;
    }
    current += ch;
  }
  const finalChunk = current.trim();
  if (finalChunk) {
    parts.push(finalChunk);
  }
  return parts;
}
function splitByPipe(segment) {
  const parts = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (quote) {
      if (ch === "\\") {
        current += ch;
        if (i + 1 < segment.length) {
          current += segment[i + 1];
          i++;
        }
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "\\" || ch === "`") {
      current += ch;
      if (i + 1 < segment.length) {
        current += segment[i + 1];
        i++;
      }
      continue;
    }
    if (ch === "|") {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts;
}
function translateForLegacyPowerShell(command) {
  const tokens = splitByConnectors(command);
  if (tokens.length === 0)
    return command;
  let script = tokens[0];
  for (let i = 1; i < tokens.length; i += 2) {
    const connector = tokens[i];
    const nextCmd = tokens[i + 1];
    if (connector === "&&") {
      script += `; if ($?) { ${nextCmd} }`;
    } else {
      script += `; if (-not $?) { ${nextCmd} }`;
    }
  }
  return script;
}
var _a, OVERRIDE_SHELL, DEBUG;
var init_translate = __esm({
  "src/translate.ts"() {
    "use strict";
    init_unixMappings();
    OVERRIDE_SHELL = (_a = process.env.SMARTSH_SHELL) == null ? void 0 : _a.toLowerCase();
    DEBUG = process.env.SMARTSH_DEBUG === "1" || process.env.SMARTSH_DEBUG === "true";
  }
});

// src/cli.ts
import path from "path";
import { spawn } from "child_process";
var require_cli = __commonJS({
  "src/cli.ts"(exports, module) {
    init_translate();
    var TOOL_NAME = path.basename(process.argv[1] ?? "smartsh");
    function runInShell(shellInfo, command) {
      if (shellInfo.type === "powershell") {
        const exe = shellInfo.version && shellInfo.version >= 7 ? "pwsh" : "powershell";
        const child2 = spawn(exe, ["-NoProfile", "-Command", command], {
          stdio: "inherit"
        });
        child2.on("error", (err) => {
          console.error(`${TOOL_NAME}: Failed to start command:`, err);
        });
        child2.on("exit", (code, signal) => {
          if (signal)
            process.kill(process.pid, signal);
          else
            process.exit(code ?? 0);
        });
        return;
      }
      let shellOption = true;
      if (shellInfo.type === "cmd") {
        shellOption = "cmd.exe";
      }
      const child = spawn(command, {
        shell: shellOption,
        stdio: "inherit"
      });
      child.on("error", (err) => {
        console.error(`${TOOL_NAME}: Failed to start command:`, err);
      });
      child.on("exit", (code, signal) => {
        if (signal)
          process.kill(process.pid, signal);
        else
          process.exit(code ?? 0);
      });
    }
    function main() {
      const args = process.argv.slice(2);
      if (args.length === 0) {
        console.error(`${TOOL_NAME}: No command provided. Usage: ${TOOL_NAME} "echo hello && echo world"`);
        process.exit(1);
      }
      const originalCommand = args.join(" ");
      const shellInfo = detectShell();
      const commandToRun = translateCommand(originalCommand, shellInfo);
      runInShell(shellInfo, commandToRun);
    }
    if (__require.main === module) {
      main();
    }
  }
});
export default require_cli();
