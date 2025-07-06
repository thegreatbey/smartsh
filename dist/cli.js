#!/usr/bin/env node
"use strict";

// src/translate.ts
var _a;
var OVERRIDE_SHELL = (_a = process.env.SMARTSH_SHELL) == null ? void 0 : _a.toLowerCase();
var DEBUG = process.env.SMARTSH_DEBUG === "1" || process.env.SMARTSH_DEBUG === "true";
function debugLog(...args) {
  if (DEBUG) {
    console.log("[smartsh debug]", ...args);
  }
}
function getPowerShellVersionSync() {
  const { execSync } = require("child_process");
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
  if (shell.supportsConditionalConnectors) {
    return command;
  }
  if (shell.type !== "powershell") {
    return command;
  }
  return translateForLegacyPowerShell(command);
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

// src/cli.ts
var import_child_process = require("child_process");
function runInShell(shellInfo, command) {
  if (shellInfo.type === "powershell") {
    const exe = shellInfo.version && shellInfo.version >= 7 ? "pwsh" : "powershell";
    const child2 = (0, import_child_process.spawn)(exe, ["-NoProfile", "-Command", command], {
      stdio: "inherit"
    });
    child2.on("error", (err) => {
      console.error("smartsh: Failed to start command:", err);
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
  const child = (0, import_child_process.spawn)(command, {
    shell: shellOption,
    stdio: "inherit"
  });
  child.on("error", (err) => {
    console.error("smartsh: Failed to start command:", err);
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
    console.error('smartsh: No command provided. Usage: smartsh "echo hello && echo world"');
    process.exit(1);
  }
  const originalCommand = args.join(" ");
  const shellInfo = detectShell();
  const commandToRun = translateCommand(originalCommand, shellInfo);
  runInShell(shellInfo, commandToRun);
}
if (require.main === module) {
  main();
}
