import * as maskers from '../maskers';
import { registry } from './registry';

// Register standard maskers
export function registerDefaults() {
  registry.register('email', maskers.maskEmail);
  registry.register('phone', maskers.maskPhone);
  registry.register('card', maskers.maskCard);
  registry.register('ip', maskers.maskIp);
  registry.register('jwt', maskers.maskJwt);
  registry.register('url', maskers.maskUrl);
  registry.register('address', maskers.maskAddress);
  registry.register('name', maskers.maskName);
}
