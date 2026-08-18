import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { defaultSkillPaths, defaultMcpConfigPaths } from './paths.js';

const ctx = { home: '/home/u', cwd: '/proj' };

// Expected paths are built with join() so the assertions hold on Windows,
// where the separator is a backslash.
describe('discovery paths', () => {
  it('includes the user and project skill directories', () => {
    const paths = defaultSkillPaths(ctx);
    expect(paths).toContain(join('/home/u', '.claude', 'skills'));
    expect(paths).toContain(join('/proj', '.claude', 'skills'));
  });

  it('includes plugin directories', () => {
    expect(defaultSkillPaths(ctx)).toContain(join('/home/u', '.claude', 'plugins'));
  });

  it('includes every known mcp config location', () => {
    const paths = defaultMcpConfigPaths(ctx);
    expect(paths).toContain(join('/proj', '.mcp.json'));
    expect(paths).toContain(join('/home/u', '.claude.json'));
    expect(paths).toContain(join('/proj', '.cursor', 'mcp.json'));
  });

  it('produces absolute, separator-normalised paths', () => {
    for (const p of [...defaultSkillPaths(ctx), ...defaultMcpConfigPaths(ctx)]) {
      expect(p).toBe(join(p));
    }
  });
});
