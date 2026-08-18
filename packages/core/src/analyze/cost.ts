import { estimateTokens, estimateJsonTokens } from '../tokenize.js';
import type { Extracted, Finding } from '../types.js';

/** Tokens above which a single extension is called out as heavy. */
const HEAVY_TOKENS = 10_000;

export interface CostResult {
  tokens: number;
  findings: Finding[];
}

export function analyzeCost(ext: Extracted): CostResult {
  const findings: Finding[] = [];
  let tokens = 0;

  if (ext.kind === 'skill') {
    tokens = estimateTokens(ext.description) + estimateTokens(ext.body);
  } else {
    for (const tool of ext.tools) {
      tokens += estimateJsonTokens(tool);
    }
    if (ext.tools.length > 0) {
      findings.push({
        ruleId: 'cost/tool-schema-weight',
        pillar: 'cost',
        extensionId: ext.id,
        severity: 'info',
        message: `${ext.tools.length} tool schemas cost ${tokens.toLocaleString()} tokens per turn`,
      });
    }
  }

  if (tokens > HEAVY_TOKENS) {
    findings.push({
      ruleId: 'cost/heavy-extension',
      pillar: 'cost',
      extensionId: ext.id,
      severity: 'high',
      message: `Adds ${tokens.toLocaleString()} tokens to every turn`,
      evidence: ext.source,
    });
  }

  return { tokens, findings };
}
