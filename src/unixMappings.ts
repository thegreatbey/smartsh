export interface CommandMapping {
  unix: string;
  ps: string;
  flagMap: Record<string, string>; // maps a unix flag (or combo) to ps flags
  forceArgs?: boolean; // if true command requires at least one argument
}

const RM_MAPPING: CommandMapping = {
  unix: "rm",
  ps: "Remove-Item",
  flagMap: {
    "-rf": "-Recurse -Force",
    "-fr": "-Recurse -Force",
    "-r": "-Recurse",
    "-f": "-Force",
  },
  forceArgs: true,
};

const MKDIR_MAPPING: CommandMapping = {
  unix: "mkdir",
  ps: "New-Item -ItemType Directory",
  flagMap: {
    "-p": "-Force",
  },
};

const LS_MAPPING: CommandMapping = {
  unix: "ls",
  ps: "Get-ChildItem",
  flagMap: {
    "-la": "-Force",
    "-al": "-Force",
    "-a": "-Force",
    "-l": "",
  },
};

export const MAPPINGS: CommandMapping[] = [RM_MAPPING, MKDIR_MAPPING, LS_MAPPING];

// Simple tokenizer by whitespace, respecting quoted substrings
function tokenize(segment: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | "\"" | null = null;
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (quote) {
      current += ch;
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === "\"") {
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
  if (current) tokens.push(current);
  return tokens;
}

export function translateSingleUnixSegment(segment: string): string {
  const tokens = tokenize(segment);
  if (tokens.length === 0) return segment;
  const cmd = tokens[0];
  const mapping = MAPPINGS.find((m) => m.unix === cmd);
  if (!mapping) return segment; // not a unix command we handle

  const flagTokens = tokens.slice(1).filter((t) => t.startsWith("-"));
  const argTokens = tokens.slice(1).filter((t) => !t.startsWith("-"));

  let psFlags = "";
  for (const flagTok of flagTokens) {
    const mapped = mapping.flagMap[flagTok];
    if (mapped !== undefined) {
      if (mapped) psFlags += " " + mapped;
    } else {
      // Unknown flag -> bail out (don't translate)
      return segment;
    }
  }

  // Ensure required args present
  if (mapping.forceArgs && argTokens.length === 0) {
    return segment;
  }

  const psCommand = `${mapping.ps}${psFlags}`.trim();
  return [psCommand, ...argTokens].join(" ");
} 