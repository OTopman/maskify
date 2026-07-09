export interface MaskContext {
  strict?: boolean;
  context?: unknown;
  [key: string]: any;
}

export interface Masker<TInput, TOutput = TInput> {
  (value: TInput, ctx?: MaskContext): TOutput;
  _condition?: (val: TInput, ctx?: MaskContext) => boolean;
  _parentFn?: (val: any, ctx: MaskContext) => any;

  when(condition: (val: TInput, ctx?: MaskContext) => boolean): Masker<TInput, TInput | TOutput>;
  redact(label?: string): Masker<TInput, string>;
  transform<TNew>(fn: (val: TOutput) => TNew): Masker<TInput, TNew>;
}

export function createMasker<I, O>(
  fn: (val: I, ctx: MaskContext) => O
): Masker<I, O> {
  const masker = ((val: I, ctx: MaskContext = {}) => fn(val, ctx)) as any as Masker<I, O>;

  masker.when = (condition: (val: I, ctx?: MaskContext) => boolean) => {
    const next = createMasker((val: I, ctx: MaskContext) => {
      return condition(val, ctx) ? fn(val, ctx) : (val as unknown as O);
    });
    next._condition = condition;
    next._parentFn = fn;
    return next;
  };

  masker.redact = (label?: string) => {
    const cond = masker._condition;
    const parentFn = masker._parentFn;
    if (cond && parentFn) {
      return createMasker((val: I, ctx: MaskContext) => {
        return cond(val, ctx) ? (label ?? '[REDACTED]') : (parentFn(val, ctx) as unknown as string);
      });
    }
    return createMasker((_val: I, _ctx: MaskContext) => {
      return label ?? '[REDACTED]';
    });
  };

  masker.transform = <TNew>(fnTransform: (val: O) => TNew) => {
    const cond = masker._condition;
    const parentFn = masker._parentFn;
    if (cond && parentFn) {
      return createMasker((val: I, ctx: MaskContext) => {
        return cond(val, ctx) ? fnTransform(fn(val, ctx)) : (parentFn(val, ctx) as unknown as TNew);
      });
    }
    return createMasker((val: I, ctx: MaskContext) => {
      return fnTransform(fn(val, ctx));
    });
  };

  return masker;
}

/**
 * Callable that supports both calling conventions shared by every built-in
 * masker: `maskX(value, opts)` for immediate masking, and `maskX(opts)` for
 * a reusable, chainable `Masker` builder consumed by `m.object()` schemas.
 */
export type DualModeMasker<TOpts, TOutput = string> = {
  (value: string, opts?: TOpts): TOutput;
  (opts?: TOpts): Masker<string, TOutput>;
};

/**
 * Builds a `DualModeMasker` from a single `(value, opts, ctx) => output`
 * implementation, so each masker module only has to define its masking
 * logic once instead of hand-rolling the direct-vs-builder dispatch.
 *
 * `coerce: true` preserves the `String(value)` coercion a few maskers
 * (card, phone) apply on their direct-call path for non-string input.
 */
export function createDualModeMasker<TOpts extends object, TOutput = string>(
  run: (value: string, opts: TOpts, ctx: MaskContext) => TOutput,
  config: { coerce?: boolean } = {}
): DualModeMasker<TOpts, TOutput> {
  const dualModeMasker = (first?: any, second?: TOpts): any => {
    const isBuilder = first === undefined || (first !== null && typeof first === 'object');
    if (isBuilder) {
      const builderOpts = (first ?? {}) as TOpts;
      return createMasker((value: string, ctx: MaskContext) => run(value, builderOpts, ctx));
    }
    const value = config.coerce ? String(first) : (first as string);
    return run(value, (second ?? {}) as TOpts, {});
  };
  return dualModeMasker as DualModeMasker<TOpts, TOutput>;
}
