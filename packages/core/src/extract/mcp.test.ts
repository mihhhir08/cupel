import { describe, it, expect } from 'vitest';
import { extractMcpServers } from './mcp.js';

const CONFIG = JSON.stringify({
  mcpServers: {
    'github-mcp': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: 'ghp_secret_value' },
    },
    'sql-runner': { command: 'uvx', args: ['sql-mcp'] },
  },
});

describe('extractMcpServers', () => {
  it('extracts every configured server', () => {
    const servers = extractMcpServers(CONFIG, '/proj/.mcp.json');
    expect(servers).toHaveLength(2);
    expect(servers[0].id).toBe('mcp-server:github-mcp');
    expect(servers[0].command).toBe('npx');
    expect(servers[0].args).toEqual(['-y', '@modelcontextprotocol/server-github']);
  });

  it('records env key names but never their values', () => {
    const servers = extractMcpServers(CONFIG, '/proj/.mcp.json');
    expect(servers[0].envKeys).toEqual(['GITHUB_TOKEN']);
    expect(JSON.stringify(servers)).not.toContain('ghp_secret_value');
  });

  it('returns an empty array for malformed json', () => {
    expect(extractMcpServers('{not json', '/proj/.mcp.json')).toEqual([]);
  });
});
