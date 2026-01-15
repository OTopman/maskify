#!/usr/bin/env node
import { createInterface } from 'readline';
import { registerDefaults } from '../core/bootstrap';
import { MaskifyCore } from '../core/maskify';
import { GlobalConfigLoader, MaskOptions, MiddlewareField } from '../utils';

// Registry initialization
registerDefaults();

const args = process.argv.slice(2);

function parseArgs() {
  // 1. Load file config first
  const fileConfig = GlobalConfigLoader.load();

  // 2. Default options
  const options: {
    fields: MiddlewareField[]; // 👈 FIX: Updated type to accept objects
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
        // CLI args are always strings, which is valid for MiddlewareField[]
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

  // CLI defaults for schema generation
  const maskOpts: MaskOptions = {
    maskChar: options.maskChar,
    autoDetect: true,
  };

  // 👈 FIX: Handle both string and object field definitions
  const schema = Object.fromEntries(
    options.fields.map((field) => {
      if (typeof field === 'string') {
        return [field, maskOpts];
      }
      return [field.name, { ...maskOpts, ...field.options }];
    })
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

      // If no fields provided in CLI or Config, we can default to Auto-Masking
      // But based on your previous logic, we check schema mode.
      // If schema is empty and mode is mask, it might mean "mask nothing" or "error".
      // Assuming users might want Auto-Mask if no fields are explicitly passed:
      if (Object.keys(schema).length === 0 && options.fields.length === 0) {
        const masked = MaskifyCore.autoMask(json, maskOpts);
        console.log(JSON.stringify(masked));
        continue;
      }

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
      // If valid JSON cannot be parsed, output the raw line
      console.log(line);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});