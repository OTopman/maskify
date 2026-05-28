import { MaskifyValidationError } from './errors';

const MAX_INPUT_LENGTH = 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export interface ValidateInputOptions {
  strict?: boolean;
  allowEmpty?: boolean;
  maxLength?: number;
}

export function validateInput(
  value: unknown,
  options: ValidateInputOptions = {},
): ValidationResult {
  const { strict = false, allowEmpty = false, maxLength = MAX_INPUT_LENGTH } =
    options;

  if (typeof value !== 'string') {
    const msg = `Expected string for masking, got ${typeof value}`;
    if (strict) {
      throw new MaskifyValidationError(msg, { received: typeof value });
    }
    return { valid: false, error: msg };
  }

  if (!value) {
    if (allowEmpty) {
      return { valid: true, sanitized: '' };
    }
    const msg = 'Empty string is not allowed';
    if (strict) {
      throw new MaskifyValidationError(msg, { received: '' });
    }
    return { valid: false, error: msg };
  }

  if (value.length > maxLength) {
    const msg = `Input exceeds maximum length of ${maxLength} characters`;
    if (strict) {
      throw new MaskifyValidationError(msg, {
        max: maxLength,
        actual: value.length,
      });
    }
    return { valid: true, sanitized: value.slice(0, maxLength) };
  }

  return { valid: true, sanitized: value.trim() };
}

export function assertValidInput(
  value: unknown,
  context: string,
  strict = false,
): asserts value is string {
  const result = validateInput(value, { strict, allowEmpty: true });
  if (!result.valid && strict) {
    throw new MaskifyValidationError(
      `Invalid input for ${context}: ${result.error}`,
      { context },
    );
  }
}
