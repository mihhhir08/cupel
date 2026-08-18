#!/usr/bin/env node
// Dedicated executable entry. Keeping this separate from index.ts means the CLI
// module stays importable in tests without self-detecting how it was invoked.
import { main } from './index.js';

main().then((code) => {
  // Set exitCode rather than calling exit: exit() tears down the process before
  // an async stdout pipe has flushed, truncating --json output.
  process.exitCode = code;
});
