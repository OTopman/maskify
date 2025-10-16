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
  detectType(value: string): MaskableType {
    const trimmed = value.trim();
    if (this.isEmail(trimmed)) return 'email';
    if (this.isPhone(trimmed)) return 'phone';
    if (this.isCard(trimmed)) return 'card';
    if (this.isAddress(trimmed)) return 'address';
    if (this.isName(trimmed)) return 'name';
    return 'generic';
  },
};
