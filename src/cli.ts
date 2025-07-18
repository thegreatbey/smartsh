import { detectShell, translateCommand } from "./translate";
import path from "node:path";
import { spawn } from "node:child_process";
import { initConfig } from "./config";

// Use consistent branding in error messages
const TOOL_NAME = "smartsh";

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
  let completionShell: string | null = null;

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
    if (arg.startsWith("--completion")) {
      if (arg.includes("=")) {
        completionShell = arg.split("=")[1];
      } else if (i + 1 < rawArgs.length) {
        completionShell = rawArgs[i + 1];
        i++;
      }
      continue;
    }
    cmdParts.push(arg);
  }

  // ---------------------------
  // Completion script generation
  // ---------------------------
  if (completionShell) {
    const script = generateCompletionScript(completionShell);
    if (!script) {
      console.error(`${TOOL_NAME}: Unknown shell '${completionShell}'. Supported shells: bash, zsh, powershell`);
      process.exit(1);
    }
    console.log(script);
    process.exit(0);
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

function generateCompletionScript(shell: string): string | null {
  const flags = [
    "--translate-only", "-t",
    "--lint", "-l",
    "--debug", "-d",
    "--completion"
  ];

  switch (shell) {
    case "bash":
      return `# bash completion for smartsh\n_smartsh_complete() {\n  local cur="\${COMP_WORDS[COMP_CWORD]}"\n  local opts="${flags.join(" ")}"\n  COMPREPLY=( $(compgen -W \"$opts\" -- \$cur) )\n  return 0\n}\ncomplete -F _smartsh_complete smartsh sm`;
    case "zsh":
      return `#compdef smartsh sm\n_arguments \'*::options:->options\'\ncase $state in\n  options)\n    local opts=(\n      '--translate-only[Translate but do not execute]'\n      '-t[Translate but do not execute]'\n      '--lint[Lint command for unsupported segments]'\n      '-l[Lint command]'\n      '--debug[Enable debug output]'\n      '-d[Enable debug output]'\n      '--completion=[Generate completion script]:shell:(bash zsh powershell)'\n    )\n    _describe 'options' opts\n  ;;\nesac`;
    case "powershell":
    case "pwsh":
      return `# PowerShell completion for smartsh\nRegister-ArgumentCompleter -CommandName smartsh, sm -ScriptBlock {\n    param($wordToComplete, $commandAst, $cursorPosition)\n    $opts = ${flags.map(f => `'${f}'`).join(", ")}\n    $opts | Where-Object { $_ -like \"$wordToComplete*\" } | ForEach-Object {\n        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)\n    }\n}`;
    default:
      return null;
  }
}

if (require.main === module) {
  main();
} 