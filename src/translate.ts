import { translateSingleUnixSegment } from "./unixMappings";
import { tokenizeWithPos, tagTokenRoles } from "./tokenize";

// -----------------------------
// Lint support helpers
// -----------------------------
import { MAPPINGS } from "./unixMappings";

const DYNAMIC_CMDS = [
  "head",
  "tail",
  "wc",
  "sleep",
  "whoami",
  "sed",
  "awk",
  "cut",
  "tr",
  "uniq",
  "sort",
  "find",
  "xargs",
  "echo"
];

const SUPPORTED_COMMANDS = new Set<string>([...MAPPINGS.map((m) => m.unix), ...DYNAMIC_CMDS]);

export function lintCommand(cmd: string): { unsupported: string[] } {
  const unsupported: string[] = [];

  const connectorParts = splitByConnectors(cmd).filter((p) => p !== "&&" && p !== "||");

  for (const part of connectorParts) {
    const pipeParts = splitByPipe(part);
    for (const seg of pipeParts) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("(") || trimmed.startsWith("{")) continue; // skip subshell/grouping

      const tokens = tagTokenRoles(tokenizeWithPos(trimmed));
      const cmdTok = tokens.find((t) => t.role === "cmd");
      if (!cmdTok) continue;
      const c = cmdTok.value;
      if (!SUPPORTED_COMMANDS.has(c)) {
        unsupported.push(trimmed);
      }
    }
  }

  return { unsupported };
}

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

    // If PSModulePath is set we are likely in PowerShell (cmd.exe doesn't set it)
    if (process.env.PSModulePath) {
      const version = getPowerShellVersionSync();
      return {
        type: "powershell",
        version,
        supportsConditionalConnectors: version !== null && version >= 7,
      };
    }

    // Check parent process executable via ComSpec; still could be CMD if user launched from there.
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

  let parenDepth = 0;
  let braceDepth = 0;
  for (const t of tokens) {
    if (t.value === "(") parenDepth++;
    else if (t.value === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (t.value === "{") braceDepth++;
    else if (t.value === "}") braceDepth = Math.max(0, braceDepth - 1);

    if (parenDepth === 0 && braceDepth === 0 && (t.value === "&&" || t.value === "||")) {
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

// Split a segment by top-level pipe (|) operators while preserving subshell/grouped
// expressions like ( ... | ... ) or { ... | ... }. We scan the token stream and
// keep track of parentheses/brace depth; a pipe only acts as a delimiter when
// we are *not* inside any grouping depth. This mirrors the logic in
// splitByConnectors above and prevents accidental splitting inside subshells.
function splitByPipe(segment: string): string[] {
  const tokens = tokenizeWithPos(segment); // we only need raw tokens/positions

  const parts: string[] = [];
  let lastPos = 0;
  let parenDepth = 0;
  let braceDepth = 0;

  for (const t of tokens) {
    // Track grouping depth
    if (t.value === "(") {
      parenDepth++;
    } else if (t.value === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (t.value === "{") {
      braceDepth++;
    } else if (t.value === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
    }

    // Only treat | as a delimiter at top level (no nested grouping)
    if (parenDepth === 0 && braceDepth === 0 && t.value === "|") {
      const chunk = segment.slice(lastPos, t.start).trim();
      if (chunk) parts.push(chunk);
      lastPos = t.end; // skip past the pipe character
    }
  }

  // Add whatever remains after the last pipe (or the whole string if none)
  const tail = segment.slice(lastPos).trim();
  if (tail) parts.push(tail);

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