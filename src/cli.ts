import { detectShell, translateCommand } from "./translate";
import path from "node:path";
import { spawn } from "child_process";
import { initConfig } from "./config";

// Determine the actual invoked binary name so that error/help messages
// correctly display either "smartsh" or its alias "sm".
const TOOL_NAME = path.basename(process.argv[1] ?? "smartsh");

function runInShell(shellInfo: ReturnType<typeof detectShell>, command: string): void {
  if (shellInfo.type === "powershell") {
    // Decide executable based on version (pwsh for 7+, powershell for legacy)
    const exe = shellInfo.version && shellInfo.version >= 7 ? "pwsh" : "powershell";
    const child = spawn(exe, ["-NoProfile", "-Command", command], {
      stdio: "inherit",
    });

    child.on("error", (err: Error) => {
      console.error(`${TOOL_NAME}: Failed to start command:`, err);
    });

    child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      if (signal) process.kill(process.pid, signal);
      else process.exit(code ?? 0);
    });
    return;
  }

  // For bash / cmd (with native connector support) we can delegate to their shells via spawn with `shell` option.
  let shellOption: string | true = true;
  if (shellInfo.type === "cmd") {
    shellOption = "cmd.exe";
  }

  const child = spawn(command, {
    shell: shellOption,
    stdio: "inherit",
  });

  child.on("error", (err: Error) => {
    console.error(`${TOOL_NAME}: Failed to start command:`, err);
  });

  child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

function main() {
  // Load user config & plugins
  initConfig();
  const rawArgs = process.argv.slice(2);

  // ---------------------------
  // Flag parsing (very simple)
  // ---------------------------
  let translateOnly = false;
  const cmdParts: string[] = [];

  let i = 0;
  let lintOnly = false;

  for (; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "--translate-only" || arg === "-t") {
      translateOnly = true;
      continue;
    }
    if (arg === "--lint" || arg === "-l") {
      lintOnly = true;
      continue;
    }
    if (arg === "--debug" || arg === "-d") {
      process.env.SMARTSH_DEBUG = "1";
      continue;
    }
    cmdParts.push(arg);
  }

  if (cmdParts.length === 0) {
    console.error(
      `${TOOL_NAME}: No command provided. Usage: ${TOOL_NAME} [--translate-only] [--debug] \"echo hello && echo world\"`
    );
    process.exit(1);
  }

  const originalCommand = cmdParts.join(" ");
  const shellInfo = detectShell();
  if (lintOnly) {
    const { lintCommand } = require("./translate");
    const res = lintCommand(originalCommand);
    if (res.unsupported.length === 0) {
      console.log("✔ All segments are supported.");
      process.exit(0);
    }
    console.error("✖ Unsupported segments detected:");
    for (const seg of res.unsupported) {
      console.error("  -", seg);
    }
    process.exit(1);
  }

  const commandToRun = translateCommand(originalCommand, shellInfo);
  if (translateOnly) {
    console.log(commandToRun);
    return;
  }

  runInShell(shellInfo, commandToRun);
}

if (require.main === module) {
  main();
} 