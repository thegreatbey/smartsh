export interface TokenInfo {
  value: string;
  start: number;
  end: number; // exclusive
  /** Quote character that originally wrapped the token (' or " ), or undefined for unquoted */
  quoteType?: "'" | '"';
}

export interface EnhancedToken extends TokenInfo {
  originalText: string;  // The exact original substring
  reconstructedValue: string;  // What it should be after reconstruction
  needsReconstruction: boolean;  // Flag for special handling
}

export type TokenRole = "cmd" | "flag" | "arg" | "op";

export interface RoleToken extends TokenInfo {
  role: TokenRole;
}

/**
 * Custom tokenizer that preserves shell constructs instead of evaluating them.
 * This is the key difference from shell-quote which is designed for execution.
 */
export function tokenizeWithPos(cmd: string): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  let i = 0;
  
  while (i < cmd.length) {
    // Skip whitespace
    while (i < cmd.length && /\s/.test(cmd[i])) {
      i++;
    }
    if (i >= cmd.length) break;
    
    const start = i;
    let value = "";
    let quoteType: "'" | '"' | undefined = undefined;
    
    // Handle quoted strings
    if (cmd[i] === "'" || cmd[i] === '"') {
      quoteType = cmd[i] as "'" | '"';
      const quoteChar = cmd[i];
      value = cmd[i]; // Include the opening quote
      i++; // Skip opening quote
      
      while (i < cmd.length && cmd[i] !== quoteChar) {
        value += cmd[i];
        i++;
      }
      
      if (i < cmd.length) {
        value += cmd[i]; // Include the closing quote
        i++; // Skip closing quote
      }
    }
    // Handle operators (but check for escaped operators first)
    else if (cmd[i] === '\\' && i + 1 < cmd.length && isOperatorStart(cmd[i + 1])) {
      // Escaped operator - treat as literal
      value = cmd[i] + cmd[i + 1];
      i += 2;
    }
    // Handle PowerShell backtick-escaped operators
    else if (cmd[i] === '`' && i + 1 < cmd.length && isOperatorStart(cmd[i + 1])) {
      // Check for double backtick-escaped operators like `&`&
      if (cmd[i + 1] === '&' && i + 2 < cmd.length && cmd[i + 2] === '`' && i + 3 < cmd.length && cmd[i + 3] === '&') {
        // `&`& - treat as single token
        value = cmd[i] + cmd[i + 1] + cmd[i + 2] + cmd[i + 3];
        i += 4;
      } else if (cmd[i + 1] === '|' && i + 2 < cmd.length && cmd[i + 2] === '`' && i + 3 < cmd.length && cmd[i + 3] === '|') {
        // `|`| - treat as single token
        value = cmd[i] + cmd[i + 1] + cmd[i + 2] + cmd[i + 3];
        i += 4;
      } else {
        // Single backtick-escaped operator
        value = cmd[i] + cmd[i + 1];
        i += 2;
      }
    }
    else if (isOperator(cmd, i)) {
      const op = extractOperator(cmd, i);
      value = op;
      i += op.length;
    }
    // Handle regular tokens
    else {
      while (i < cmd.length && !/\s/.test(cmd[i]) && !isOperatorStart(cmd[i])) {
        value += cmd[i];
        i++;
      }
    }
    
    // Safety check: if we didn't process any characters, increment i to avoid infinite loop
    if (i === start) {
      value = cmd[i];
      i++;
    }
    
    if (value) {
      tokens.push({
        value,
        start,
        end: i,
        quoteType
      });
    }
  }
  
  return tokens;
}

/**
 * Check if we're at the start of an operator
 */
function isOperatorStart(char: string): boolean {
  return ['<', '>', '|', '&', ';', '(', ')', '{', '}'].includes(char);
}

/**
 * Check if we're at an operator position
 */
function isOperator(cmd: string, pos: number): boolean {
  const operators = ['&&', '||', '|&', '<<', '>>', '|', ';', '<', '>', '(', ')', '{', '}'];
  
  for (const op of operators) {
    if (cmd.substring(pos, pos + op.length) === op) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract the operator at the current position
 */
function extractOperator(cmd: string, pos: number): string {
  const operators = ['&&', '||', '|&', '<<', '>>', '|', ';', '<', '>', '(', ')', '{', '}'];
  
  for (const op of operators) {
    if (cmd.substring(pos, pos + op.length) === op) {
      return op;
    }
  }
  
  return cmd[pos];
}

/**
 * Enhanced tokenization with preservation layer for complex shell constructs.
 * Maps parsed tokens back to original positions and reconstructs special constructs.
 */
export function tokenizeWithPosEnhanced(cmd: string): EnhancedToken[] {
  const basicTokens = tokenizeWithPos(cmd);
  const enhancedTokens = mapToOriginalPositions(basicTokens, cmd);
  return reconstructSpecialConstructs(enhancedTokens, cmd);
}

/**
 * Map basic tokens to enhanced tokens with original text preservation.
 */
function mapToOriginalPositions(tokens: TokenInfo[], cmd: string): EnhancedToken[] {
  return tokens.map(token => ({
    ...token,
    originalText: cmd.substring(token.start, token.end),
    reconstructedValue: token.value,
    needsReconstruction: false
  }));
}

/**
 * Reconstruct special shell constructs from original text.
 */
function reconstructSpecialConstructs(tokens: EnhancedToken[], cmd: string): EnhancedToken[] {
  let result = [...tokens];
  
  // Step 1: Reconstruct here-documents (<< 'EOF')
  result = reconstructHereDocs(result);
  
  // Step 2: Reconstruct process substitution (<(...))
  result = reconstructProcessSubs(result);
  
  // Step 3: Reconstruct function definitions (())
  result = reconstructFunctionDefs(result);
  
  // Step 4: Reconstruct environment variables (${...})
  result = reconstructEnvVars(result, cmd);
  
  return result;
}

/**
 * Reconstruct here-document syntax: << 'EOF'
 */
function reconstructHereDocs(tokens: EnhancedToken[]): EnhancedToken[] {
  const result: EnhancedToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value === "<<" && i + 1 < tokens.length) {
      // Found <<, merge with next token (delimiter)
      const hereDocToken: EnhancedToken = {
        value: "<<",
        start: tokens[i].start,
        end: tokens[i + 1].end,
        originalText: tokens[i].originalText + tokens[i + 1].originalText,
        reconstructedValue: "<<",
        needsReconstruction: false
      };
      
      // Include the delimiter (e.g., 'EOF')
      hereDocToken.end = tokens[i + 1].end;
      hereDocToken.originalText += tokens[i + 1].originalText;
      hereDocToken.reconstructedValue += " " + tokens[i + 1].value;
      i += 1; // Skip the next token
      
      result.push(hereDocToken);
    } else {
      result.push(tokens[i]);
    }
  }
  
  return result;
}

/**
 * Reconstruct process substitution: <(...)
 */
function reconstructProcessSubs(tokens: EnhancedToken[]): EnhancedToken[] {
  const result: EnhancedToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value === "<" && i + 1 < tokens.length && tokens[i + 1].value === "(") {
      // Found <(, find matching closing )
      let parenDepth = 1;
      let j = i + 2;
      
      while (j < tokens.length && parenDepth > 0) {
        if (tokens[j].value === "(") parenDepth++;
        if (tokens[j].value === ")") parenDepth--;
        j++;
      }
      
      if (parenDepth === 0) {
        // Found complete <(...), merge all tokens
        const processSubToken: EnhancedToken = {
          value: "<(",
          start: tokens[i].start,
          end: tokens[j - 1].end,
          originalText: tokens.slice(i, j).map(t => t.originalText).join(""),
          reconstructedValue: "<(",
          needsReconstruction: false
        };
        
        // Add the command inside
        for (let k = i + 2; k < j - 1; k++) {
          processSubToken.reconstructedValue += tokens[k].value + " ";
        }
        processSubToken.reconstructedValue += ")";
        
        result.push(processSubToken);
        i = j - 1; // Skip all processed tokens
      } else {
        result.push(tokens[i]);
      }
    } else {
      result.push(tokens[i]);
    }
  }
  
  return result;
}

/**
 * Reconstruct function definitions: ()
 */
function reconstructFunctionDefs(tokens: EnhancedToken[]): EnhancedToken[] {
  const result: EnhancedToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value === "(" && i + 1 < tokens.length && tokens[i + 1].value === ")") {
      // Found (), merge them
      const funcDefToken: EnhancedToken = {
        value: "()",
        start: tokens[i].start,
        end: tokens[i + 1].end,
        originalText: tokens[i].originalText + tokens[i + 1].originalText,
        reconstructedValue: "()",
        needsReconstruction: false
      };
      
      result.push(funcDefToken);
      i += 1; // Skip the next token
    } else {
      result.push(tokens[i]);
    }
  }
  
  return result;
}

/**
 * Reconstruct environment variables from original text.
 */
function reconstructEnvVars(tokens: EnhancedToken[], cmd: string): EnhancedToken[] {
  return tokens.map(token => {
    // Look for ${...} patterns in the original text
    const envVarPattern = /\$\{[^}]+\}/g;
    let reconstructed = token.value;
    let needsReconstruction = false;
    
    // Check if the original text contains environment variables that were stripped
    if (token.originalText.includes("${")) {
      // Find all ${...} patterns in the original text
      const matches = token.originalText.match(envVarPattern) || [];
      
      // Replace empty strings or partial matches with the original patterns
      for (const match of matches) {
        if (reconstructed === "" || reconstructed === token.originalText.replace(envVarPattern, "")) {
          reconstructed = token.originalText;
          needsReconstruction = true;
          break;
        }
      }
    }
    
    return {
      ...token,
      reconstructedValue: reconstructed,
      needsReconstruction
    };
  });
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