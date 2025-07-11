import { parse as shellParse } from "shell-quote";

export interface TokenInfo {
  value: string;
  start: number;
  end: number; // exclusive
  /** Quote character that originally wrapped the token (' or " ), or undefined for unquoted */
  quoteType?: "'" | '"';
}

export type TokenRole = "cmd" | "flag" | "arg" | "op";

export interface RoleToken extends TokenInfo {
  role: TokenRole;
}

/**
 * Tokenize a command string using shell-quote while preserving original
 * substring positions. This enables loss-less reconstruction of segments.
 */
export function tokenizeWithPos(cmd: string): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  let cursor = 0;

  for (const tok of shellParse(cmd)) {
    if (typeof tok === "object" && "op" in tok) {
      const op = tok.op as string;
      if (op === "glob") {
        const pattern = (tok as any).pattern as string;
        const idx = cmd.indexOf(pattern, cursor);
        tokens.push({ value: pattern, start: idx, end: idx + pattern.length });
        cursor = idx + pattern.length;
      } else {
        const idx = cmd.indexOf(op, cursor);
        tokens.push({ value: op, start: idx, end: idx + op.length });
        cursor = idx + op.length;
      }
    } else {
      const strTok = String(tok);
      const idx = cmd.indexOf(strTok, cursor);
      // shell-quote attaches a `quote` field with the original quote char(s) used
      const qt = (tok as any)?.quote as string | undefined;
      const quoteChar = qt === "'" || qt === "\"" ? (qt as "'" | '"') : undefined;
      tokens.push({ value: strTok, start: idx, end: idx + strTok.length, quoteType: quoteChar });
      cursor = idx + strTok.length;
    }
  }

  return tokens;
}

const OPS = new Set(["&&", "||", "|", ";", "|&"]);

// Recognise > >> < 2> 2>> 2>&1 &> etc.
function isRedirectionToken(val: string): boolean {
  return /^(\d*>>?&?\d*|[<>]{1,2}|&>?)$/.test(val);
}

/**
 * Classify each token with a coarse role: command, flag, argument or operator.
 * The heuristic is simple but works for most Unix one-liners.
 */
export function tagTokenRoles(tokens: TokenInfo[]): RoleToken[] {
  const out: RoleToken[] = [];
  let expectCmd = true; // start of command or after connector/semicolon/pipe

  for (const t of tokens) {
    if (OPS.has(t.value)) {
      out.push({ ...t, role: "op" });
      expectCmd = true;
      continue;
    }

    if (isRedirectionToken(t.value)) {
      out.push({ ...t, role: "arg" });
      continue;
    }

    if (expectCmd) {
      out.push({ ...t, role: "cmd" });
      expectCmd = false;
      continue;
    }

    if (t.value.startsWith("-") && t.value.length > 1 && t.quoteType === undefined) {
      out.push({ ...t, role: "flag" });
    } else {
      out.push({ ...t, role: "arg" });
    }
  }
  return out;
} 