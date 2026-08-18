import { describe, it, expect } from 'vitest';
import { defaultSkillPaths, defaultMcpConfigPaths } from './paths.js';

describe('discovery paths', () => {
  it('includes the user and project skill directories', () => {
    const paths = defaultSkillPaths({ home: '/home/u', cwd: '/proj' });
    expect(paths).toContain('/home/u/.claude/skills');
    expect(paths).toContain('/proj/.claude/skills');
  });

  it('includes plugin directories', () => {
    const paths = defaultSkillPaths({ home: '/home/u', cwd: '/proj' });
    expect(paths).toContain('/home/u/.claude/plugins');
  });

  it('includes every known mcp config location', () => {
    const paths = defaultMcpConfigPaths({ home: '/home/u', cwd: '/proj' });
    expect(paths).toContain('/proj/.mcp.json');
    expect(paths).toContain('/home/u/.claude.json');
    expect(paths).toContain('/proj/.cursor/mcp.json');
  });
});
