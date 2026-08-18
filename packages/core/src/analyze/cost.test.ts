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
  it('charges only name and description every turn, never the body', () => {
    const r = analyzeCost(skill);
    // 'pdf-wizard: Extracts tables from PDF files' is well under 100 tokens.
    expect(r.tokens).toBeLessThan(100);
    // The 4,000-character body is deferred until the skill is invoked.
    expect(r.deferredTokens).toBeGreaterThan(900);
    expect(r.deferredTokens).toBeLessThan(1200);
  });

  it('charges mcp tool schemas every turn with nothing deferred', () => {
    const r = analyzeCost(server);
    expect(r.tokens).toBeGreaterThan(0);
    expect(r.deferredTokens).toBe(0);
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

  it('raises a finding when an mcp server is heavy every turn', () => {
    const bloated = {
      ...server,
      tools: Array.from({ length: 60 }, (_, i) => ({
        name: `tool_${i}`,
        description: 'A tool with a reasonably long description string.'.repeat(12),
        inputSchema: { type: 'object', properties: { a: { type: 'string' } } },
      })),
    };
    const finding = analyzeCost(bloated).findings.find(
      (f) => f.ruleId === 'cost/heavy-extension',
    );
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('high');
  });

  it('raises a finding when a skill body is huge on invocation', () => {
    const heavy: ExtractedSkill = { ...skill, body: 'x'.repeat(200_000) };
    const finding = analyzeCost(heavy).findings.find((f) => f.ruleId === 'cost/heavy-body');
    expect(finding).toBeDefined();
  });

  it('always attributes findings to the extension id', () => {
    const r = analyzeCost(server);
    for (const f of r.findings) {
      expect(f.extensionId).toBe('mcp-server:github-mcp');
      expect(f.pillar).toBe('cost');
    }
  });
});
