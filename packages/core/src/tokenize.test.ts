import { describe, it, expect } from 'vitest';
import { estimateTokens } from './tokenize.js';

describe('estimateTokens', () => {
  it('returns zero for empty input', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates prose at roughly four characters per token', () => {
    const prose = 'The quick brown fox jumps over the lazy dog. '.repeat(20);
    const est = estimateTokens(prose);
    const ratio = prose.length / est;
    expect(ratio).toBeGreaterThan(3.2);
    expect(ratio).toBeLessThan(4.8);
  });

  it('estimates structured json denser than prose', () => {
    const json = JSON.stringify({ name: 'x', inputSchema: { type: 'object' } });
    const prose = 'a '.repeat(json.length / 2);
    expect(estimateTokens(json) / json.length)
      .toBeGreaterThan(estimateTokens(prose) / prose.length);
  });

  it('calibrates within range of the published playwright mcp measurement', () => {
    // 22 tool definitions measured at ~14,300 tokens.
    const tool = JSON.stringify({
      name: 'browser_click',
      description: 'Click an element on the page identified by a selector.',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the element' },
          timeout: { type: 'number', description: 'Milliseconds to wait' },
        },
        required: ['selector'],
      },
    });
    const est = estimateTokens(tool);
    expect(est).toBeGreaterThan(40);
    expect(est).toBeLessThan(200);
  });
});
