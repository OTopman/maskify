import { MaskableType } from './types';

export const Detectors = {
  isEmail: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  isPhone: (v: string) => /^\+?\d{7,15}$/.test(v),
  isCard: (v: string) => /^\d{12,19}$/.test(v.replace(/\s+/g, '')),
  isAddress: (v: string) =>
    /\d+\s+[\w\s,.-]+/.test(v) &&
    /(road|street|st|rd|ave|lane|close|way|boulevard|crescent)/i.test(v),
  isName: (v: string) =>
    /^[A-Za-z\s.'-]+$/.test(v.trim()) && /\s/.test(v.trim()),
  isIp: (v: string) =>
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(
      v
    ),
  isJwt: (v: string) =>
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/.test(v),
  isUrl: (v: string) =>
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/.test(v),

  detectType(value: string): MaskableType {
    const trimmed = value.trim();
    if (this.isEmail(trimmed)) return 'email';
    if (this.isPhone(trimmed)) return 'phone';
    if (this.isCard(trimmed)) return 'card';
    if (this.isIp(trimmed)) return 'ip';
    if (this.isJwt(trimmed)) return 'jwt';
    if (this.isUrl(trimmed)) return 'url';
    if (this.isAddress(trimmed)) return 'address';
    if (this.isName(trimmed)) return 'name';
    return 'generic';
  },
};
