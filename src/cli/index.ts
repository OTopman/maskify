#!/usr/bin/env node
import { createInterface } from 'readline';
import { registerDefaults } from '../core/bootstrap';
import { MaskifyCore } from '../core/maskify';
import { MaskOptions, MiddlewareField } from '../utils';
import { GlobalConfigLoader } from '../utils/config';
import { buildSchemaFromFields } from '../utils/schema-builder';

registerDefaults();

interface CliOptions {
  fields: MiddlewareField[];
  maskChar: string;
  mode: 'mask' | 'allow';
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const fileConfig = GlobalConfigLoader.load();
  const options: CliOptions = {
    fields: fileConfig.fields || [],
    maskChar: fileConfig.maskOptions?.maskChar || '*',
    mode: fileConfig.mode || 'mask',
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--fields':
      case '-f':
        options.fields =
          argv[++i]?.split(',').map((s) => s.trim()).filter(Boolean) || [];
        break;
      case '--char':
      case '-c':
        options.maskChar = argv[++i] || options.maskChar;
        break;
      case '--allow':
        options.mode = 'allow';
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }
  return options;
}

function printHelp(): void {
  process.stdout.write(`
Usage: maskify [options] < input.json

Options:
  -f, --fields <list>   Comma-separated list of fields to mask
  -c, --char <char>     Character to use for masking (default: "*")
      --allow           Enable allowlist mode (mask everything except --fields)
  -h, --help            Show this help message

Configuration:
  Config is auto-loaded from maskify.config.{js,cjs,ts}, .maskifyrc.{js,json},
  or a "maskify" field in package.json.

Examples:
  cat logs.json | maskify
  cat logs.json | maskify -f "email,phone"
`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const maskOpts: MaskOptions = {
    maskChar: options.maskChar,
    autoDetect: true,
  };

  const schema = buildSchemaFromFields(options.fields, maskOpts);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const json = JSON.parse(line);
      const masked = schema
        ? MaskifyCore.maskSensitiveFields(
            json,
            schema,
            { mode: options.mode, defaultMask: maskOpts },
            maskOpts,
          )
        : MaskifyCore.autoMask(json, maskOpts);
      process.stdout.write(JSON.stringify(masked) + '\n');
    } catch {
      process.stdout.write(line + '\n');
    }
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
