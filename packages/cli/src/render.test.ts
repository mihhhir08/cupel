import { describe, it, expect } from 'vitest';
import { render } from './render.js';
import type { Assay } from '@cupel/core';

/** ANSI escape, built from its code point so no literal control byte lives in source. */
const ESC = String.fromCharCode(27);

const base: Assay = {
  version: 1,
  generatedAt: '2026-08-17T00:00:00.000Z',
  contextWindow: 200_000,
  tokenTaxPerTurn: 63_400,
  verdict: 'D',
  coverage: [{ path: '/home/u/.claude/skills', status: 'scanned', found: 2 }],
  extensions: [
    {
      extension: {
        id: 'mcp-server:github-mcp',
        kind: 'mcp-server',
        name: 'github-mcp',
        source: '/proj/.mcp.json',
        command: 'npx',
        args: [],
        envKeys: [],
        tools: [],
      },
      pillars: [{ pillar: 'cost', score: 55, grade: 'F' }],
      findings: [],
      verdict: 'F',
      tokens: 41_900,
    },
  ],
};

describe('render', () => {
  it('shows the headline token tax and window share', () => {
    const out = render(base);
    expect(out).toContain('63,400');
    expect(out).toContain('32%');
  });

  it('lists extensions by name with their token cost', () => {
    const out = render(base);
    expect(out).toContain('github-mcp');
    expect(out).toContain('41,900');
  });

  it('tells the user when nothing was found rather than printing an empty report', () => {
    const empty: Assay = { ...base, extensions: [], tokenTaxPerTurn: 0, verdict: 'unknown' };
    expect(render(empty)).toContain('No extensions found');
  });

  it('emits no ansi escapes when color is disabled', () => {
    expect(render(base, { color: false })).not.toContain(ESC);
  });

  it('emits ansi escapes when color is enabled', () => {
    expect(render(base)).toContain(ESC);
  });
});
