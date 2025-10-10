export const Detectors = {
  isEmail: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  isPhone: (v: string) => /^\+?\d{7,15}$/.test(v),
  isCard: (v: string) => /^\d{12,19}$/.test(v.replace(/\s+/g, '')),
};
