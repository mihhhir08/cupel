import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { assay } from './index.js';

const HOME = resolve('tests/fixtures/home');
const PROJ = resolve('tests/fixtures/proj');

describe('assay', () => {
  it('returns a complete assay object', async () => {
    const result = await assay({ home: HOME, cwd: PROJ });
    expect(result.version).toBe(1);
    expect(result.contextWindow).toBe(200_000);
    expect(result.extensions.length).toBeGreaterThan(0);
    expect(typeof result.tokenTaxPerTurn).toBe('number');
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('sums the token tax across every extension', async () => {
    const result = await assay({ home: HOME, cwd: PROJ });
    const sum = result.extensions.reduce((n, e) => n + e.tokens, 0);
    expect(result.tokenTaxPerTurn).toBe(sum);
  });

  it('gives every extension a verdict', async () => {
    const result = await assay({ home: HOME, cwd: PROJ });
    for (const e of result.extensions) {
      expect(['A', 'B', 'C', 'D', 'F', 'unknown']).toContain(e.verdict);
    }
  });

  it('handles a machine with nothing installed', async () => {
    const result = await assay({ home: '/nonexistent', cwd: '/nonexistent' });
    expect(result.extensions).toEqual([]);
    expect(result.tokenTaxPerTurn).toBe(0);
    expect(result.verdict).toBe('unknown');
  });

  it('makes no network calls', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error('network access is forbidden in the default path');
    }) as typeof fetch;
    try {
      await expect(assay({ home: HOME, cwd: PROJ })).resolves.toBeDefined();
    } finally {
      globalThis.fetch = original;
    }
  });
});
