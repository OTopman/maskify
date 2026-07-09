import { Lexer } from './lexer';
import { TokenType } from './patterns';
import { MaskifyCore } from '../maskify';
import { MaskOptions } from '../../utils';

export class SmartMasker {
  /**
   * Compiles the input string by tokenizing it and applying specific masks 
   * to sensitive tokens while preserving the surrounding text layout.
   */
  static process(text: string, options: MaskOptions = {}): string {
    if (!text || typeof text !== 'string') return text || '';

    // 1. Tokenize the input string
    const tokens = Lexer.tokenize(text);
    
    // 2. Map tokens to masked strings
    return tokens.map(token => {
      // Pass-through normal text
      if (token.type === TokenType.TEXT) {
        return token.value;
      }

      // Map TokenType enum to MaskableType string used by MaskifyCore
      // e.g. TokenType.EMAIL ('EMAIL') -> 'email'
      const maskType = token.type.toLowerCase() as any;

      // Delegate to the core masking logic
      return MaskifyCore.mask(token.value, {
        ...options,
        type: maskType,
        autoDetect: false // We already detected the type!
      });
    }).join('');
  }
}
