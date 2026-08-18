import { join } from 'node:path';

export interface PathContext {
  home: string;
  cwd: string;
}

export function defaultSkillPaths({ home, cwd }: PathContext): string[] {
  return [
    join(home, '.claude', 'skills'),
    join(home, '.claude', 'plugins'),
    join(cwd, '.claude', 'skills'),
  ];
}

export function defaultMcpConfigPaths({ home, cwd }: PathContext): string[] {
  return [
    join(cwd, '.mcp.json'),
    join(home, '.claude.json'),
    join(cwd, '.cursor', 'mcp.json'),
    join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    join(home, '.config', 'Claude', 'claude_desktop_config.json'),
  ];
}
