import pkg from '../../package.json';

export * from './clone';
export * from './config-loader';
export * from './detectors';
export * from './paths';
export * from './types';

export const __maskifySignature = `maskify-ts::v${pkg.version}::©Temitope Okunlola`;
