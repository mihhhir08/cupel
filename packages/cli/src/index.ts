#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { assay } from '@cupel/core';
import { render } from './render.js';

export interface Flags {
  command: string;
  json: boolean;
  color: boolean;
  contextWindow: number;
}

export function parseFlags(argv: string[], env: NodeJS.ProcessEnv = {}): Flags {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      json: { type: 'boolean' },
      'no-color': { type: 'boolean' },
      window: { type: 'string' },
    },
  });

  return {
    command: positionals[0] ?? 'scan',
    json: values.json === true,
    color: !(values['no-color'] === true || env.NO_COLOR !== undefined),
    contextWindow: values.window ? Number(values.window) : 200_000,
  };
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const flags = parseFlags(argv, process.env);

  if (flags.command !== 'scan') {
    process.stderr.write(`Unknown command: ${flags.command}\n`);
    return 2;
  }

  const result = await assay({ contextWindow: flags.contextWindow });
  process.stdout.write(
    flags.json ? `${JSON.stringify(result, null, 2)}\n` : render(result, { color: flags.color }),
  );
  return 0;
}

// Run only when invoked directly, so the module stays importable in tests.
if (process.argv[1]?.endsWith('index.js')) {
  // Set exitCode rather than calling process.exit: exit() tears down the
  // process before an async stdout pipe has flushed, truncating --json output.
  main().then((code) => {
    process.exitCode = code;
  });
}
