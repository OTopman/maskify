export function maskIp(value: string): string {
  // IPv4 regex
  if (value.includes('.')) {
    return value.replace(/\.\d+$/, '.***');
  }
  // IPv6 simple masking
  if (value.includes(':')) {
    return value.replace(/:[\da-fA-F]+$/, ':****');
  }
  return value;
}
