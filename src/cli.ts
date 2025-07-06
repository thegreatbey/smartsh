import { detectShell, translateCommand } from "./translate";
import { spawn } from "child_process";

function runInShell(shellInfo: ReturnType<typeof detectShell>, command: string): void {
  if (shellInfo.type === "powershell") {
    // Decide executable based on version (pwsh for 7+, powershell for legacy)
    const exe = shellInfo.version && shellInfo.version >= 7 ? "pwsh" : "powershell";
    const child = spawn(exe, ["-NoProfile", "-Command", command], {
      stdio: "inherit",
    });

    child.on("error", (err) => {
      console.error("smartsh: Failed to start command:", err);
    });

    child.on("exit", (code, signal) => {
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

  child.on("error", (err) => {
    console.error("smartsh: Failed to start command:", err);
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("smartsh: No command provided. Usage: smartsh \"echo hello && echo world\"");
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