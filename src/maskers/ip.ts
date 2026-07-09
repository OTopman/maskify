import { createDualModeMasker, MaskContext } from '../core/masker';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IpOptions {
  // Option signatures placeholder
}

function runIpMasking(value: string, _opts: IpOptions, _ctx: MaskContext): string {
  if (!value) return '';
  if (value.includes('.')) {
    return value.replace(/\.\d+$/, '.***');
  }
  if (value.includes(':')) {
    return value.replace(/:[\da-fA-F]+$/, ':****');
  }
  return value;
}

export const maskIp = createDualModeMasker(runIpMasking);
