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

const CP_MAPPING: CommandMapping = {
  unix: "cp",
  ps: "Copy-Item",
  flagMap: {
    "-r": "-Recurse",
    "-R": "-Recurse",
    "-f": "-Force",
    "-rf": "-Recurse -Force",
    "-fr": "-Recurse -Force",
  },
  forceArgs: true,
};

const MV_MAPPING: CommandMapping = {
  unix: "mv",
  ps: "Move-Item",
  flagMap: {},
  forceArgs: true,
};

const TOUCH_MAPPING: CommandMapping = {
  unix: "touch",
  ps: "New-Item -ItemType File",
  flagMap: {},
  forceArgs: true,
};

const GREP_MAPPING: CommandMapping = {
  unix: "grep",
  ps: "Select-String",
  flagMap: {
    "-i": "-CaseSensitive:$false",
    "-n": "-LineNumber",
    "-in": "-CaseSensitive:$false -LineNumber",
    "-ni": "-CaseSensitive:$false -LineNumber",
  },
  forceArgs: true,
};

const CAT_MAPPING: CommandMapping = {
  unix: "cat",
  ps: "Get-Content",
  flagMap: {},
  forceArgs: true,
};

const WHICH_MAPPING: CommandMapping = {
  unix: "which",
  ps: "Get-Command",
  flagMap: {},
  forceArgs: true,
};

const SORT_MAPPING: CommandMapping = {
  unix: "sort",
  ps: "Sort-Object",
  flagMap: {},
  forceArgs: false,
};

const UNIQ_MAPPING: CommandMapping = {
  unix: "uniq",
  ps: "Select-Object -Unique",
  flagMap: {},
  forceArgs: false,
};

const FIND_MAPPING: CommandMapping = {
  unix: "find",
  ps: "Get-ChildItem -Recurse",
  flagMap: {
    "-name": "-Filter", // maps -name pattern
    "-type": "", // we ignore -type for now
  },
  forceArgs: true,
};

const PWD_MAPPING: CommandMapping = {
  unix: "pwd",
  ps: "Get-Location",
  flagMap: {},
  forceArgs: false,
};

const DATE_MAPPING: CommandMapping = {
  unix: "date",
  ps: "Get-Date",
  flagMap: {},
  forceArgs: false,
};

const CLEAR_MAPPING: CommandMapping = {
  unix: "clear",
  ps: "Clear-Host",
  flagMap: {},
  forceArgs: false,
};

const PS_MAPPING: CommandMapping = {
  unix: "ps",
  ps: "Get-Process",
  flagMap: {},
  forceArgs: false,
};

const KILL_MAPPING: CommandMapping = {
  unix: "kill",
  ps: "Stop-Process",
  flagMap: {
    "-9": "-Force",
  },
  forceArgs: true,
};

const DF_MAPPING: CommandMapping = {
  unix: "df",
  ps: "Get-PSDrive",
  flagMap: {
    "-h": "", // human-readable not needed
  },
  forceArgs: false,
};

const HOSTNAME_MAPPING: CommandMapping = {
  unix: "hostname",
  ps: "$env:COMPUTERNAME",
  flagMap: {},
  forceArgs: false,
};

export const MAPPINGS: CommandMapping[] = [
  RM_MAPPING,
  MKDIR_MAPPING,
  LS_MAPPING,
  CP_MAPPING,
  MV_MAPPING,
  TOUCH_MAPPING,
  GREP_MAPPING,
  CAT_MAPPING,
  WHICH_MAPPING,
  SORT_MAPPING,
  UNIQ_MAPPING,
  FIND_MAPPING,
  PWD_MAPPING,
  DATE_MAPPING,
  CLEAR_MAPPING,
  PS_MAPPING,
  KILL_MAPPING,
  DF_MAPPING,
  HOSTNAME_MAPPING,
];

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

  // Dynamic translations for head/tail/wc
  if (cmd === "head" || cmd === "tail") {
    let count: number | undefined;
    // patterns: -10 or -n 10
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
      return segment; // unsupported pattern
    }
    const flag = cmd === "head" ? "-First" : "-Last";
    const targetArgs = tokens.slice(1).filter((t) => {
      if (t.startsWith("-")) return false;
      if (t === String(count)) return false;
      return true;
    });
    const psCmd = `Select-Object ${flag} ${count}`;
    return [psCmd, ...targetArgs].join(" ");
  }

  if (cmd === "wc" && tokens.length >= 2 && tokens[1] === "-l") {
    const restArgs = tokens.slice(2);
    return ["Measure-Object -Line", ...restArgs].join(" ");
  }

  // Dynamic translations for sleep
  if (cmd === "sleep" && tokens.length >= 2) {
    const duration = tokens[1];
    if (/^\d+$/.test(duration)) {
      return `Start-Sleep ${duration}`;
    }
  }

  // Dynamic translation for whoami
  if (cmd === "whoami") {
    return "$env:USERNAME";
  }

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