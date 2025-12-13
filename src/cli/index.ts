#!/usr/bin/env node
import { createInterface } from 'readline';
import { registerDefaults } from '../core/bootstrap'; // 1. Import bootstrap
import { MaskifyCore } from '../core/maskify';
import { GlobalConfigLoader, MaskOptions } from '../utils';

// Registry initialization
registerDefaults();

const args = process.argv.slice(2);

function parseArgs() {
  // 1. Load file config first
  const fileConfig = GlobalConfigLoader.load();

  // 2. Default options
  const options: {
    fields: string[];
    maskChar: string;
    mode: 'mask' | 'allow';
    help: boolean;
  } = {
    fields: fileConfig.fields || [],
    maskChar: fileConfig.maskOptions?.maskChar || '*',
    mode: fileConfig.mode || 'mask',
    help: false,
  };

  // 3. Override with CLI args
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--fields':
      case '-f':
        options.fields = args[++i]?.split(',').map((s) => s.trim()) || [];
        break;
      case '--char':
      case '-c':
        options.maskChar = args[++i] || options.maskChar;
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

function printHelp() {
  console.log(`
Usage: maskify-ts [options] < input.json

Options:
  -f, --fields <list>   Comma-separated list of fields to mask (overrides config file)
  -c, --char <char>     Character to use for masking (default: "*")
  --allow               Enable Allowlist mode
  -h, --help            Show this help message

Configuration:
  Maskify looks for 'maskify.config.js', '.maskifyrc.json', or a "maskify" key in package.json.

Examples:
  cat logs.json | maskify-ts
  cat logs.json | maskify-ts -f "email,phone"
  `);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.fields.length === 0 && options.mode === 'mask') {
    console.error(
      'Error: No fields specified. Use -f or create a config file.'
    );
    process.exit(1);
  }

  // This object represents the "Effective Global Configuration" for this run
  const maskOpts: MaskOptions = {
    maskChar: options.maskChar,
    autoDetect: true,
  };

  const schema = Object.fromEntries(
    options.fields.map((field) => [field, maskOpts])
  );

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const json = JSON.parse(line);

      const masked = MaskifyCore.maskSensitiveFields(
        json,
        schema,
        {
          mode: options.mode,
          defaultMask: maskOpts,
        },
        maskOpts
      );

      console.log(JSON.stringify(masked));
    } catch (e) {
      // If valid JSON cannot be parsed, output the raw line (standard unix tool behavior)
      console.log(line);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
