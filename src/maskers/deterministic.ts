import { createHmac } from 'crypto';
import { MaskOptions } from '../utils';

export function maskDeterministic(
  value: string,
  opts: MaskOptions & { secret?: string }
): string {
  // Requires a 'secret' in options, or defaults to a hardcoded one (not recommended for prod)
  const secret = (opts as any).secret || 'default-maskify-secret';
  return createHmac('sha256', secret)
    .update(value)
    .digest('hex')
    .substring(0, 12);
}
