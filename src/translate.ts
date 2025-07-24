console.log('src/translate.ts LOADED');
import { translateSingleUnixSegment } from "./unixMappings";
import { tokenizeWithPos, tagTokenRoles } from "./tokenize";
import { translateForShell } from "./shellMappings";
import { translateBidirectional } from "./bidirectionalMappings";

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
  "echo",
  "nl"
];

const SUPPORTED_COMMANDS = new Set<string>([...MAPPINGS.map((m) => m.unix), ...DYNAMIC_CMDS]);

export function lintCommand(cmd: string): { unsupported: string[]; suggestions: string[] } {
  const unsupported: string[] = [];
  const suggestions: string[] = [];

  // Pre-compute allowed flag sets for static mappings
  const STATIC_ALLOWED_FLAGS: Record<string, Set<string>> = Object.fromEntries(
    MAPPINGS.map((m) => [m.unix, new Set(Object.keys(m.flagMap))])
  );

  // Manual definitions for dynamic translators that aren't part of MAPPINGS
  const DYNAMIC_ALLOWED_FLAGS: Record<string, Set<string>> = {
    uniq: new Set(["-c"]),
    sort: new Set(["-n"]),
    cut: new Set(["-d", "-f"]),
    tr: new Set([]),
    find: new Set(["-name", "-type", "-delete", "-exec"]),
    xargs: new Set(["-0"]),
    sed: new Set(["-n"]),
  };

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

      // 1. Unknown command
      if (!SUPPORTED_COMMANDS.has(c)) {
        unsupported.push(`${trimmed} (unknown command: '${c}')`);
        
        // Provide suggestions for common typos
        const cmdSuggestions = getCommandSuggestions(c);
        if (cmdSuggestions.length > 0) {
          suggestions.push(`  Did you mean: ${cmdSuggestions.join(", ")}?`);
        }
        continue;
      }

      // 2. Unknown flags for supported command
      const allowedFlags = STATIC_ALLOWED_FLAGS[c] ?? DYNAMIC_ALLOWED_FLAGS[c];
      if (allowedFlags) {
        const flagToks = tokens.filter((t) => t.role === "flag");
        for (const fTok of flagToks) {
          if (!allowedFlags.has(fTok.value)) {
            unsupported.push(`${trimmed} (unsupported flag: '${fTok.value}' for '${c}')`);
            
            // Provide flag suggestions
            const flagSuggestions = getFlagSuggestions(c, fTok.value, allowedFlags);
            if (flagSuggestions.length > 0) {
              suggestions.push(`  Available flags for '${c}': ${Array.from(allowedFlags).join(", ")}`);
            }
            break; // Only report once per segment
          }
        }
      }
    }
  }

  return { unsupported, suggestions };
}

function getCommandSuggestions(unknownCmd: string): string[] {
  const allCommands = [...MAPPINGS.map((m) => m.unix), ...DYNAMIC_CMDS];
  const suggestions: string[] = [];
  
  // Simple Levenshtein-like matching for common typos
  for (const cmd of allCommands) {
    if (cmd.length >= 3 && (
      cmd.includes(unknownCmd) || 
      unknownCmd.includes(cmd) ||
      Math.abs(cmd.length - unknownCmd.length) <= 2
    )) {
      suggestions.push(cmd);
      if (suggestions.length >= 3) break; // Limit to 3 suggestions
    }
  }
  
  return suggestions;
}

function getFlagSuggestions(cmd: string, unknownFlag: string, allowedFlags: Set<string>): string[] {
  const suggestions: string[] = [];
  
  // Look for similar flags
  for (const flag of Array.from(allowedFlags)) {
    if (flag.includes(unknownFlag) || unknownFlag.includes(flag)) {
      suggestions.push(flag);
      if (suggestions.length >= 3) break;
    }
  }
  
  return suggestions;
}

export type ShellType = "bash" | "powershell" | "cmd" | "ash" | "dash" | "zsh" | "fish" | "ksh" | "tcsh";

export interface ShellInfo {
  type: ShellType;
  /**
   * Whether this shell natively understands Unix-style conditional connectors (&&, ||).
   */
  supportsConditionalConnectors: boolean;
  /** Only set for PowerShell */
  version?: number | null;
  /**
   * Whether this shell needs Unix command translations
   */
  needsUnixTranslation: boolean;
  /**
   * The target shell for command translations
   */
  targetShell: "powershell" | "cmd" | "bash" | "ash" | "dash" | "zsh" | "fish" | "ksh" | "tcsh";
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
  
  // Be conservative: check traditional powershell first (most common)
  const candidates = ["powershell", "pwsh"];
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
        needsUnixTranslation: true,
        targetShell: "powershell",
      };
    }
    return {
      type: OVERRIDE_SHELL,
      supportsConditionalConnectors: true,
      needsUnixTranslation: true,
      targetShell: OVERRIDE_SHELL,
    };
  }

  // 2. Platform-specific heuristics
  if (process.platform === "win32") {
    const isCmd = Boolean(process.env.PROMPT) && !process.env.PSModulePath;
    if (isCmd) {
      debugLog("Detected CMD via PROMPT env.");
      return { type: "cmd", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "cmd" };
    }

    // If PSModulePath is set we are likely in PowerShell (cmd.exe doesn't set it)
    if (process.env.PSModulePath) {
      const version = getPowerShellVersionSync();
      return {
        type: "powershell",
        version,
        supportsConditionalConnectors: version !== null && version >= 7,
        needsUnixTranslation: true,
        targetShell: "powershell",
      };
    }

    // Check parent process executable via ComSpec; still could be CMD if user launched from there.
    const comspec = process.env.ComSpec?.toLowerCase();
    if (comspec?.includes("cmd.exe")) {
      debugLog("Detected CMD via ComSpec path.");
      return { type: "cmd", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "cmd" };
    }

    // Detect Git Bash / WSL bash via SHELL env even on Windows
    const shellEnv = process.env.SHELL?.toLowerCase();
    if (shellEnv && shellEnv.includes("bash")) {
      debugLog("Detected Bash on Windows via SHELL env:", shellEnv);
      return { type: "bash", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "bash" };
    }

    // Fallback to PowerShell
    const version = getPowerShellVersionSync();
    return {
      type: "powershell",
      version,
      supportsConditionalConnectors: version !== null && version >= 7,
      needsUnixTranslation: true,
      targetShell: "powershell",
    };
  }

  // 3. Non-Windows: detect specific shell types
  const shellPath = process.env.SHELL;
  if (shellPath) {
    debugLog(`Detected Unix shell via SHELL env: ${shellPath}`);
    
    // Extract shell name from path
    const shellName = shellPath.split('/').pop()?.toLowerCase() || '';
    
    // Map shell names to types
    if (shellName.includes('ash') || shellName.includes('busybox')) {
      return { 
        type: "ash", 
        supportsConditionalConnectors: true, 
        needsUnixTranslation: false, // ash is already Unix-like
        targetShell: "ash" 
      };
    }
    if (shellName.includes('dash')) {
      return { 
        type: "dash", 
        supportsConditionalConnectors: true, 
        needsUnixTranslation: false, // dash is already Unix-like
        targetShell: "dash" 
      };
    }
    if (shellName.includes('zsh')) {
      return { 
        type: "zsh", 
        supportsConditionalConnectors: true, 
        needsUnixTranslation: false, // zsh is already Unix-like
        targetShell: "zsh" 
      };
    }
    if (shellName.includes('fish')) {
      return { 
        type: "fish", 
        supportsConditionalConnectors: true, 
        needsUnixTranslation: false, // fish is already Unix-like
        targetShell: "fish" 
      };
    }
    if (shellName.includes('ksh')) {
      return { 
        type: "ksh", 
        supportsConditionalConnectors: true, 
        needsUnixTranslation: false, // ksh is already Unix-like
        targetShell: "ksh" 
      };
    }
    if (shellName.includes('tcsh')) {
      return { 
        type: "tcsh", 
        supportsConditionalConnectors: true, 
        needsUnixTranslation: false, // tcsh is already Unix-like
        targetShell: "tcsh" 
      };
    }
    if (shellName.includes('bash')) {
      return { 
        type: "bash", 
        supportsConditionalConnectors: true, 
        needsUnixTranslation: false, // bash is already Unix-like
        targetShell: "bash" 
      };
    }
  }
  
  // Fallback to bash for Unix-like systems
  return { 
    type: "bash", 
    supportsConditionalConnectors: true, 
    needsUnixTranslation: false, // assume Unix-like environment
    targetShell: "bash" 
  };
}

/**
 * Translate a Unix-style command string (using && and ||) to something that
 * preserves conditional semantics on shells that *don’t* natively support them
 * (currently: legacy PowerShell < 7).
 */
export function translateCommand(command: string, shell: ShellInfo): string {
  // Detect input format
  const inputInfo = parseInput(command);
  
  // If input is Unix and shell needs translation, use existing logic
  if (inputInfo.format === "unix" && shell.needsUnixTranslation) {
    // First translate any supported Unix commands inside each segment
    const parts = splitByConnectors(command).map((part) => {
      if (part === "&&" || part === "||") return part;
      // Handle pipe-separated subsegments
      const pipeParts = splitByPipe(part);
      const translatedPipeParts = pipeParts.map((segment) => {
        return translateSingleUnixSegmentForShell(segment, shell.targetShell);
      });
      return translatedPipeParts.join(" | ");
    });
    const unixTranslated = parts.join(" ");

    // Handle backtick-escaped operators for PowerShell compatibility
    const finalResult = handleBacktickEscapedOperators(unixTranslated);

    // Handle conditional connectors for shells that don't support them natively
    if (shell.supportsConditionalConnectors) {
      return finalResult;
    }

    // Legacy PowerShell needs special handling for conditional connectors
    if (shell.type === "powershell") {
      return translateForLegacyPowerShell(finalResult);
    }

    return finalResult;
  }

  // If input is PowerShell or CMD, use bidirectional translation
  if (inputInfo.format === "powershell" || inputInfo.format === "cmd") {
    const parts = splitByConnectors(command).map((part) => {
      if (part === "&&" || part === "||") return part;
      // Handle pipe-separated subsegments
      const pipeParts = splitByPipe(part);
      const translatedPipeParts = pipeParts.map((segment) => {
        return translateSingleSegmentBidirectional(segment, inputInfo.format, shell.targetShell);
      });
      return translatedPipeParts.join(" | ");
    });
    const translated = parts.join(" ");

    // Handle conditional connectors for shells that don't support them natively
    if (shell.supportsConditionalConnectors) {
      return translated;
    }

    // Legacy PowerShell needs special handling for conditional connectors
    if (shell.type === "powershell") {
      return translateForLegacyPowerShell(translated);
    }

    return translated;
  }

  // Shells that don't need translation (Unix-like shells): just return original
  return command;
}

// Handle PowerShell backtick-escaped operators by converting them to quoted versions
function handleBacktickEscapedOperators(cmd: string): string {
  // Convert `&`& to '&&' and `|`| to '||' for PowerShell compatibility
  return cmd
    .replace(/`&`&/g, "'&&'")
    .replace(/`\|`\|/g, "'||'");
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

/**
 * Translate a single Unix segment for a specific target shell
 */
function translateSingleUnixSegmentForShell(segment: string, targetShell: string): string {
  // For PowerShell, use the existing translation logic
  if (targetShell === "powershell") {
    return translateSingleUnixSegment(segment);
  }

  // For other shells, use the new shell-specific translation
  if (segment.includes("${")) {
    return segment;
  }

  const trimmed = segment.trim();
  if (trimmed.startsWith("(") || trimmed.startsWith("{")) {
    return segment;
  }

  // Tokenise using the shared helpers
  const roleTokens = tagTokenRoles(tokenizeWithPos(segment));
  if (roleTokens.length === 0) return segment;

  let hasHereDoc = roleTokens.some((t) => t.value === "<<");
  const tokensValues = roleTokens.map((t) => t.value);
  for (let i = 0; i < tokensValues.length - 1; i++) {
    if (tokensValues[i] === "<" && tokensValues[i + 1] === "<") {
      hasHereDoc || (hasHereDoc = true);
      break;
    }
  }

  if (hasHereDoc) {
    return segment;
  }

  const tokens = roleTokens.map((t) => t.value);
  const flagTokens = roleTokens.filter((t) => t.role === "flag").map((t) => t.value);
  const argTokens = roleTokens.filter((t) => t.role === "arg").map((t) => t.value);

  // First command token gives us the Unix command name
  const cmdToken = roleTokens.find((t) => t.role === "cmd");
  if (!cmdToken) return segment;
  const cmd = cmdToken.value;

  // Use shell-specific translation
  return translateForShell(cmd, targetShell, flagTokens, argTokens);
}

/**
 * Translate a single segment using bidirectional translation
 */
function translateSingleSegmentBidirectional(segment: string, sourceFormat: string, targetShell: string): string {
  // For PowerShell, use the existing translation logic
  if (targetShell === "powershell") {
    return translateSingleUnixSegment(segment);
  }

  // For other shells, use the new bidirectional translation
  if (segment.includes("${")) {
    return segment;
  }

  const trimmed = segment.trim();
  if (trimmed.startsWith("(") || trimmed.startsWith("{")) {
    return segment;
  }

  // Tokenise using the shared helpers
  const roleTokens = tagTokenRoles(tokenizeWithPos(segment));
  if (roleTokens.length === 0) return segment;

  let hasHereDoc = roleTokens.some((t) => t.value === "<<");
  const tokensValues = roleTokens.map((t) => t.value);
  for (let i = 0; i < tokensValues.length - 1; i++) {
    if (tokensValues[i] === "<" && tokensValues[i + 1] === "<") {
      hasHereDoc || (hasHereDoc = true);
      break;
    }
  }

  if (hasHereDoc) {
    return segment;
  }

  const tokens = roleTokens.map((t) => t.value);
  const flagTokens = roleTokens.filter((t) => t.role === "flag").map((t) => t.value);
  const argTokens = roleTokens.filter((t) => t.role === "arg").map((t) => t.value);

  // First command token gives us the command name
  const cmdToken = roleTokens.find((t) => t.role === "cmd");
  if (!cmdToken) return segment;
  const cmd = cmdToken.value;

  // Use bidirectional translation
  return translateBidirectional(cmd, sourceFormat, targetShell, flagTokens, argTokens);
}

/**
 * Quote backtick-escaped operators for PowerShell compatibility
 */
function quoteBacktickEscapedOperators(segment: string): string {
  // Replace backtick-escaped && and || with quoted versions
  return segment
    .replace(/\`&\`&/g, "'&&'")
    .replace(/\`\|\`\|/g, "'||'");
} 

export type InputFormat = "unix" | "powershell" | "cmd";

export interface InputInfo {
  format: InputFormat;
  command: string;
}

/**
 * Detect the input format of a command
 */
export function detectInputFormat(command: string): InputFormat {
  // PowerShell indicators
  if (command.includes("Remove-Item") || 
      command.includes("Get-ChildItem") || 
      command.includes("Copy-Item") ||
      command.includes("Move-Item") ||
      command.includes("New-Item") ||
      command.includes("Get-Content") ||
      command.includes("Select-String") ||
      command.includes("Write-Host") ||
      command.includes("Clear-Host") ||
      command.includes("Get-Location") ||
      command.includes("$env:") ||
      command.includes("Invoke-")) {
    return "powershell";
  }

  // CMD indicators
  if (command.includes("del") || 
      command.includes("dir") || 
      command.includes("copy") ||
      command.includes("move") ||
      command.includes("md") ||
      command.includes("type") ||
      command.includes("findstr") ||
      command.includes("cls") ||
      command.includes("cd") ||
      command.includes("echo %") ||
      command.includes("tasklist") ||
      command.includes("taskkill")) {
    return "cmd";
  }

  // Default to Unix (most common case)
  return "unix";
}

/**
 * Parse command into InputInfo
 */
export function parseInput(command: string): InputInfo {
  return {
    format: detectInputFormat(command),
    command: command
  };
} 