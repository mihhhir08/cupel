import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { discover } from './index.js';

const HOME = resolve('tests/fixtures/home');
const PROJ = resolve('tests/fixtures/proj');

describe('discover', () => {
  it('finds skills and mcp servers across roots', async () => {
    const { extensions } = await discover({ home: HOME, cwd: PROJ });
    const ids = extensions.map((e) => e.id).sort();
    expect(ids).toContain('skill:pdf-wizard');
    expect(ids).toContain('mcp-server:sql-runner');
  });

  it('reports coverage for every path it looked at', async () => {
    const { coverage } = await discover({ home: HOME, cwd: PROJ });
    expect(coverage.length).toBeGreaterThan(0);
    expect(coverage.some((c) => c.status === 'scanned')).toBe(true);
    expect(coverage.some((c) => c.status === 'missing')).toBe(true);
  });

  it('returns empty results without throwing when nothing exists', async () => {
    const { extensions } = await discover({ home: '/nonexistent', cwd: '/nonexistent' });
    expect(extensions).toEqual([]);
  });
});
