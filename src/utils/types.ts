export type MaskableType = 'email' | 'phone' | 'card' | 'generic';

export interface MaskOptions {
  visibleStart?: number;
  visibleEnd?: number;
  maxAsterisks?: number;
  autoDetect?: boolean;
  type?: MaskableType;
  maskChar?: string;
}

export type MaskSchema = Record<string, MaskOptions>;
