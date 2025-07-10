import { parse as shellParse } from "shell-quote";

export interface TokenInfo {
  value: string;
  start: number;
  end: number; // exclusive
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
      const idx = cmd.indexOf(op, cursor);
      tokens.push({ value: op, start: idx, end: idx + op.length });
      cursor = idx + op.length;
    } else {
      const strTok = String(tok);
      const idx = cmd.indexOf(strTok, cursor);
      tokens.push({ value: strTok, start: idx, end: idx + strTok.length });
      cursor = idx + strTok.length;
    }
  }

  return tokens;
} 