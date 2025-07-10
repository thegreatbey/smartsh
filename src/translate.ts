import { translateSingleUnixSegment } from "./unixMappings";
import { tokenizeWithPos } from "./tokenize";

export type ShellType = "bash" | "powershell" | "cmd";

export interface ShellInfo {
  type: "bash" | "powershell" | "cmd";
  /**
   * Whether this shell natively understands Unix-style conditional connectors (&&, ||).
   */
  supportsConditionalConnectors: boolean;
  /** Only set for PowerShell */
  version?: number | null;
}

// Allow users to override shell detection via environment variable.
const OVERRIDE_SHELL = (process.env.SMARTSH_SHELL as ShellInfo["type"] | undefined)?.toLowerCase() as ShellInfo["type"] | undefined;

// Optional debug helper controlled by env var
const DEBUG = process.env.SMARTSH_DEBUG === "1" || process.env.SMARTSH_DEBUG === "true";

function debugLog(...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[smartsh/sm debug]", ...args);
  }
}

/**
 * Attempt to synchronously determine the installed PowerShell major version.
 * Returns `null` if PowerShell is unavailable or version cannot be determined.
 */
function getPowerShellVersionSync(): number | null {
  const { execSync } = require("child_process");
  const candidates = ["pwsh", "powershell"];
  for (const cmd of candidates) {
    try {
      const output: string = execSync(
        `${cmd} -NoProfile -Command "$PSVersionTable.PSVersion.Major"`,
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          windowsHide: true,
          timeout: 3000,
        }
      ).trim();
      const major = parseInt(output, 10);
      if (!isNaN(major)) {
        debugLog(`Detected PowerShell version ${major} via '${cmd}'.`);
        return major;
      }
    } catch (err: any) {
      // If the executable isn't found (ENOENT) just continue; anything else we log in debug mode.
      if (err?.code !== "ENOENT" && DEBUG) {
        console.error("[smartsh debug]", `Failed to probe '${cmd}':`, err.message ?? err);
      }
    }
  }
  debugLog("Unable to determine PowerShell version.");
  return null;
}

/**
 * Best-effort detection of the current interactive shell and its capabilities.
 * Users can override detection by setting SMARTSH_SHELL=cmd|powershell|bash.
 */
export function detectShell(): ShellInfo {
  // 1. Honor explicit override
  if (OVERRIDE_SHELL) {
    debugLog(`Using shell override: ${OVERRIDE_SHELL}`);
    if (OVERRIDE_SHELL === "powershell") {
      const version = getPowerShellVersionSync();
      return {
        type: "powershell",
        version,
        supportsConditionalConnectors: version !== null && version >= 7,
      };
    }
    return {
      type: OVERRIDE_SHELL,
      supportsConditionalConnectors: true,
    };
  }

  // 2. Platform-specific heuristics
  if (process.platform === "win32") {
    const isCmd = Boolean(process.env.PROMPT) && !process.env.PSModulePath;
    if (isCmd) {
      debugLog("Detected CMD via PROMPT env.");
      return { type: "cmd", supportsConditionalConnectors: true };
    }

    // Check parent process executable via process.env.ComSpec or argv[0] heuristically.
    const comspec = process.env.ComSpec?.toLowerCase();
    if (comspec?.includes("cmd.exe")) {
      debugLog("Detected CMD via ComSpec path.");
      return { type: "cmd", supportsConditionalConnectors: true };
    }

    // Detect Git Bash / WSL bash via SHELL env even on Windows
    const shellEnv = process.env.SHELL?.toLowerCase();
    if (shellEnv && shellEnv.includes("bash")) {
      debugLog("Detected Bash on Windows via SHELL env:", shellEnv);
      return { type: "bash", supportsConditionalConnectors: true };
    }

    // Fallback to PowerShell
    const version = getPowerShellVersionSync();
    return {
      type: "powershell",
      version,
      supportsConditionalConnectors: version !== null && version >= 7,
    };
  }

  // 3. Non-Windows: try SHELL env for debug output but all POSIX-like shells support connectors
  const shellPath = process.env.SHELL;
  if (shellPath) {
    debugLog(`Detected Unix shell via SHELL env: ${shellPath}`);
  }
  return { type: "bash", supportsConditionalConnectors: true };
}

/**
 * Translate a Unix-style command string (using && and ||) to something that
 * preserves conditional semantics on shells that *don’t* natively support them
 * (currently: legacy PowerShell < 7).
 */
export function translateCommand(command: string, shell: ShellInfo): string {
  // If PowerShell, we may need to translate Unix commands regardless of version
  if (shell.type === "powershell") {
    // First translate any supported Unix commands inside each segment
    const parts = splitByConnectors(command).map((part) => {
      if (part === "&&" || part === "||") return part;
      // Handle pipe-separated subsegments
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

  // Non-PowerShell shells: just return original
  return command;
}

// Modify splitByConnectors to handle backslash-escaped quotes inside quoted strings.
function splitByConnectors(cmd: string): (string | "&&" | "||")[] {
  const parts: (string | "&&" | "||")[] = [];
  const tokens = tokenizeWithPos(cmd);
  let segmentStart = 0;

  for (const t of tokens) {
    if (t.value === "&&" || t.value === "||") {
      const chunk = cmd.slice(segmentStart, t.start).trim();
      if (chunk) parts.push(chunk);
      parts.push(t.value as "&&" | "||");
      segmentStart = t.end;
    }
  }
  const last = cmd.slice(segmentStart).trim();
  if (last) parts.push(last);
  return parts;
}

// Split a string by unescaped, unquoted | characters.
function splitByPipe(segment: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: "'" | "\"" | null = null;

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

    if (ch === "'" || ch === "\"") {
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

function translateForLegacyPowerShell(command: string): string {
  const tokens = splitByConnectors(command);
  if (tokens.length === 0) return command;

  // Build a script that chains commands while preserving conditional logic.
  let script = tokens[0] as string;
  for (let i = 1; i < tokens.length; i += 2) {
    const connector = tokens[i] as "&&" | "||";
    const nextCmd = tokens[i + 1] as string;

    if (connector === "&&") {
      script += `; if ($?) { ${nextCmd} }`;
    } else {
      script += `; if (-not $?) { ${nextCmd} }`;
    }
  }
  return script;
}

// Re-export for unit tests only (not part of public API)
export { splitByConnectors as __test_splitByConnectors }; 