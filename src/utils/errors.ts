export class MaskifyError extends Error {
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'MaskifyError';
    this.context = context;
  }
}

export class MaskifyValidationError extends MaskifyError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'MaskifyValidationError';
  }
}

export class MaskifyConfigError extends MaskifyError {
  readonly hint?: string;

  constructor(
    message: string,
    hint?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.name = 'MaskifyConfigError';
    this.hint = hint;
  }
}
