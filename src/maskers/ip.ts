import { MaskOptions } from '../utils';

/**
 * Masks IPv4 and IPv6 addresses.
 * @param value - The IP address string.
 * @param _opts - Masking options (unused but required for interface consistency).
 */
export function maskIp(value: string, _opts: MaskOptions = {}): string {
  // IPv4: 192.168.1.50 -> 192.168.1.***
  if (value.includes('.')) {
    return value.replace(/\.\d+$/, '.***');
  }
  // IPv6: 2001:db8::1 -> 2001:db8::****
  if (value.includes(':')) {
    return value.replace(/:[\da-fA-F]+$/, ':****');
  }
  return value;
}
