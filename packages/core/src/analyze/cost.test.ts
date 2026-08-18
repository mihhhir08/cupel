import { describe, it, expect } from 'vitest';
import { analyzeCost } from './cost.js';
import type { ExtractedSkill, ExtractedMcpServer } from '../types.js';

const skill: ExtractedSkill = {
  id: 'skill:pdf-wizard',
  kind: 'skill',
  name: 'pdf-wizard',
  source: '/skills/pdf-wizard/SKILL.md',
  description: 'Extracts tables from PDF files',
  body: 'x'.repeat(4000),
  frontmatter: {},
};

const server: ExtractedMcpServer = {
  id: 'mcp-server:github-mcp',
  kind: 'mcp-server',
  name: 'github-mcp',
  source: '/proj/.mcp.json',
  command: 'npx',
  args: [],
  envKeys: [],
  tools: [
    { name: 'create_issue', description: 'Create an issue', inputSchema: { type: 'object' } },
    { name: 'list_repos', description: 'List repositories', inputSchema: { type: 'object' } },
  ],
};

describe('analyzeCost', () => {
  it('counts skill body and description tokens', () => {
    const r = analyzeCost(skill);
    expect(r.tokens).toBeGreaterThan(900);
    expect(r.tokens).toBeLessThan(1200);
  });

  it('counts every mcp tool schema', () => {
    const r = analyzeCost(server);
    expect(r.tokens).toBeGreaterThan(0);
    expect(r.findings.some((f) => f.ruleId === 'cost/tool-schema-weight')).toBe(true);
  });

  it('reports zero tokens for a server with no known tools', () => {
    const r = analyzeCost({ ...server, tools: [] });
    expect(r.tokens).toBe(0);
  });

  it('raises a finding when one extension exceeds the heavy threshold', () => {
    const heavy: ExtractedSkill = { ...skill, body: 'x'.repeat(200_000) };
    const r = analyzeCost(heavy);
    const finding = r.findings.find((f) => f.ruleId === 'cost/heavy-extension');
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('high');
  });

  it('always attributes findings to the extension id', () => {
    const r = analyzeCost(server);
    for (const f of r.findings) {
      expect(f.extensionId).toBe('mcp-server:github-mcp');
      expect(f.pillar).toBe('cost');
    }
  });
});
