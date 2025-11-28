import { PATTERNS, TokenType } from './patterns';

export interface Token {
  type: TokenType;
  value: string;
  index: number;
}

export class Lexer {
  private static masterRegex: RegExp;
  private static groupMap: TokenType[];

  /**
   * Lazy-initializes the master regex for O(1) repeated access.
   * Compiles all patterns into one giant Regex: (JWT)|(URL)|(EMAIL)|...
   */
  private static init() {
    if (this.masterRegex) return;

    // Create capturing groups for each pattern
    const patternSources = PATTERNS.map((p) => `(${p.regex.source})`);

    // Join with OR (|) and add the global flag (g)
    this.masterRegex = new RegExp(patternSources.join('|'), 'g');

    // Map the capturing group index to the Token Type
    // Group 1 = JWT, Group 2 = URL, etc.
    this.groupMap = PATTERNS.map((p) => p.type);
  }

  /**
   * Scans input string in a single pass (O(N)) and produces a stream of tokens.
   */
  static tokenize(input: string): Token[] {
    this.init();

    const tokens: Token[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex state for new input
    this.masterRegex.lastIndex = 0;

    // Execute the single-pass scan
    while ((match = this.masterRegex.exec(input)) !== null) {
      const matchStart = match.index;
      const matchValue = match[0];

      // 1. Capture preceding TEXT token (the gap between matches)
      if (matchStart > lastIndex) {
        tokens.push({
          type: TokenType.TEXT,
          value: input.slice(lastIndex, matchStart),
          index: lastIndex,
        });
      }

      // 2. Identify WHICH pattern matched
      // The master regex puts the match in a specific capturing group index.
      // We find the first non-undefined group (starting from index 1).
      let type = TokenType.TEXT;
      for (let i = 1; i < match.length; i++) {
        if (match[i] !== undefined) {
          // Map 1-based regex group to 0-based groupMap array
          type = this.groupMap[i - 1];
          break;
        }
      }

      tokens.push({ type, value: matchValue, index: matchStart });
      lastIndex = this.masterRegex.lastIndex;
    }

    // 3. Capture any remaining TEXT at the end of the string
    if (lastIndex < input.length) {
      tokens.push({
        type: TokenType.TEXT,
        value: input.slice(lastIndex),
        index: lastIndex,
      });
    }

    return tokens;
  }
}
