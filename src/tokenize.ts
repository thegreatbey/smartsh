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

export interface RoleToken extends EnhancedToken {
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
  
  // Step 1: Reconstruct command substitution ($(...))
  result = reconstructCommandSubstitution(result);
  
  // Step 2: Reconstruct here-documents (<< 'EOF')
  result = reconstructHereDocs(result);
  
  // Step 3: Reconstruct process substitution (<(...))
  result = reconstructProcessSubs(result);
  
  // Step 4: Reconstruct function definitions (())
  result = reconstructFunctionDefs(result);
  
  // Step 5: Reconstruct environment variables (${...})
  result = reconstructEnvVars(result, cmd);
  
  // Step 6: Reconstruct redirection operators (2>, etc.)
  result = reconstructRedirections(result);
  
  // Step 7: Reconstruct escaped operators (\&&, etc.)
  result = reconstructEscapedOperators(result);
  
  return result;
}

/**
 * Reconstruct command substitution: $(...)
 */
function reconstructCommandSubstitution(tokens: EnhancedToken[]): EnhancedToken[] {
  const result: EnhancedToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value === "$" && i + 1 < tokens.length && tokens[i + 1].value === "(") {
      // Found $(, find matching closing )
      let parenDepth = 1;
      let j = i + 2;
      
      while (j < tokens.length && parenDepth > 0) {
        if (tokens[j].value === "(") parenDepth++;
        if (tokens[j].value === ")") parenDepth--;
        j++;
      }
      
      if (parenDepth === 0) {
        // Found complete $(...), merge all tokens
        const cmdSubToken: EnhancedToken = {
          value: "$(",
          start: tokens[i].start,
          end: tokens[j - 1].end,
          originalText: tokens.slice(i, j).map(t => t.originalText).join(""),
          reconstructedValue: "$(",
          needsReconstruction: false
        };
        
        // Add the command inside
        for (let k = i + 2; k < j - 1; k++) {
          cmdSubToken.reconstructedValue += tokens[k].value + " ";
        }
        cmdSubToken.reconstructedValue = cmdSubToken.reconstructedValue.trim() + ")";
        
        result.push(cmdSubToken);
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
      
      // Include the delimiter (e.g., 'EOF') - NO SPACE
      hereDocToken.end = tokens[i + 1].end;
      hereDocToken.originalText += tokens[i + 1].originalText;
      hereDocToken.reconstructedValue += tokens[i + 1].value;
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
  const result: EnhancedToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value === "$" && i + 1 < tokens.length && tokens[i + 1].value === "{") {
      // Found ${, find matching closing }
      let braceDepth = 1;
      let j = i + 2;
      
      while (j < tokens.length && braceDepth > 0) {
        if (tokens[j].value === "{") braceDepth++;
        if (tokens[j].value === "}") braceDepth--;
        j++;
      }
      
      if (braceDepth === 0) {
        // Found complete ${...}, merge all tokens
        const envVarToken: EnhancedToken = {
          value: "${",
          start: tokens[i].start,
          end: tokens[j - 1].end,
          originalText: tokens.slice(i, j).map(t => t.originalText).join(""),
          reconstructedValue: "${",
          needsReconstruction: false
        };
        
        // Add the variable name inside
        for (let k = i + 2; k < j - 1; k++) {
          envVarToken.reconstructedValue += tokens[k].value + " ";
        }
        envVarToken.reconstructedValue = envVarToken.reconstructedValue.trim() + "}";
        
        result.push(envVarToken);
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
 * Reconstruct redirection operators (2>, etc.)
 */
function reconstructRedirections(tokens: EnhancedToken[]): EnhancedToken[] {
  const result: EnhancedToken[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    // Check for redirection patterns like "2" followed by ">"
    if (tokens[i].value.match(/^\d+$/) && i + 1 < tokens.length && 
        (tokens[i + 1].value === ">" || tokens[i + 1].value === ">>" || tokens[i + 1].value === "&")) {
      // Found number followed by redirection operator
      const redirectionToken: EnhancedToken = {
        value: tokens[i].value + tokens[i + 1].value,
        start: tokens[i].start,
        end: tokens[i + 1].end,
        originalText: tokens[i].originalText + tokens[i + 1].originalText,
        reconstructedValue: tokens[i].value + tokens[i + 1].value,
        needsReconstruction: false
      };
      
      result.push(redirectionToken);
      i += 1; // Skip the next token
    } else if (isRedirectionToken(tokens[i].value)) {
      // Already a complete redirection token
      result.push(tokens[i]);
    } else {
      result.push(tokens[i]);
    }
  }
  
  return result;
}

/**
 * Reconstruct escaped operators (\&&, etc.)
 */
function reconstructEscapedOperators(tokens: EnhancedToken[]): EnhancedToken[] {
  const result: EnhancedToken[] = [];

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value.startsWith("\\") && i + 1 < tokens.length && isOperatorStart(tokens[i + 1].value)) {
      // Found escaped operator like \&&
      const escapedOpToken: EnhancedToken = {
        value: tokens[i].value + tokens[i + 1].value,
        start: tokens[i].start,
        end: tokens[i + 1].end,
        originalText: tokens[i].originalText + tokens[i + 1].originalText,
        reconstructedValue: tokens[i].value + tokens[i + 1].value,
        needsReconstruction: false
      };
      result.push(escapedOpToken);
      i += 1; // Skip the next token
    } else {
      result.push(tokens[i]);
    }
  }
  return result;
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
    const enhancedToken: EnhancedToken = {
      ...t,
      originalText: t.value,
      reconstructedValue: t.value,
      needsReconstruction: false
    };

    if (OPS.has(t.value)) {
      out.push({ ...enhancedToken, role: "op" });
      expectCmd = true;
      continue;
    }

    if (isRedirectionToken(t.value)) {
      out.push({ ...enhancedToken, role: "arg" });
      continue;
    }

    if (expectCmd) {
      out.push({ ...enhancedToken, role: "cmd" });
      expectCmd = false;
      continue;
    }

    if (t.value.startsWith("-") && t.value.length > 1 && t.quoteType === undefined) {
      out.push({ ...enhancedToken, role: "flag" });
    } else {
      out.push({ ...enhancedToken, role: "arg" });
    }
  }
  return out;
} 

/**
 * Enhanced tokenization with reconstruction and role tagging.
 */
export function tokenizeWithPosEnhancedAndRoles(cmd: string): RoleToken[] {
  const enhancedTokens = tokenizeWithPosEnhanced(cmd);
  return enhancedTokens.map(token => ({
    ...token,
    role: determineRole(token, enhancedTokens)
  }));
}

/**
 * Determine the role of a token based on context.
 */
function determineRole(token: EnhancedToken, allTokens: EnhancedToken[]): TokenRole {
  // Use the reconstructed value for role determination
  const value = token.reconstructedValue;
  
  // Check if it's an operator
  if (OPS.has(value)) {
    return "op";
  }
  
  // Check if it's a redirection token
  if (isRedirectionToken(value)) {
    return "arg";
  }
  
  // Check if it's a flag (starts with - and not quoted)
  if (value.startsWith("-") && value.length > 1 && token.quoteType === undefined) {
    return "flag";
  }
  
  // For the first token or after operators, it's likely a command
  const tokenIndex = allTokens.indexOf(token);
  if (tokenIndex === 0) {
    return "cmd";
  }
  
  // Check if the previous token was an operator
  for (let i = tokenIndex - 1; i >= 0; i--) {
    if (OPS.has(allTokens[i].reconstructedValue)) {
      return "cmd";
    }
    if (allTokens[i].reconstructedValue === ";" || allTokens[i].reconstructedValue === "|") {
      return "cmd";
    }
  }
  
  // Default to argument
  return "arg";
} 