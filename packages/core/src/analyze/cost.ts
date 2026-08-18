import { estimateTokens, estimateJsonTokens } from '../tokenize.js';
import type { Extracted, Finding } from '../types.js';

/** Always-loaded tokens above which a single extension is called out as heavy. */
const HEAVY_TOKENS = 5_000;

export interface CostResult {
  /** Charged on every turn. */
  tokens: number;
  /** Charged only when the extension is invoked. */
  deferredTokens: number;
  findings: Finding[];
}

export function analyzeCost(ext: Extracted): CostResult {
  const findings: Finding[] = [];
  let tokens = 0;
  let deferredTokens = 0;

  if (ext.kind === 'skill') {
    // Agents keep every skill's name and description resident so they know when
    // to reach for it. The body is read only once the skill is actually invoked.
    tokens = estimateTokens(`${ext.name}: ${ext.description}`);
    deferredTokens = estimateTokens(ext.body);
  } else {
    // Tool schemas are sent with every request unless the host defers them.
    for (const tool of ext.tools) tokens += estimateJsonTokens(tool);
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

  if (deferredTokens > 20_000) {
    findings.push({
      ruleId: 'cost/heavy-body',
      pillar: 'cost',
      extensionId: ext.id,
      severity: 'medium',
      message: `Loads ${deferredTokens.toLocaleString()} tokens when invoked`,
      evidence: ext.source,
    });
  }

  return { tokens, deferredTokens, findings };
}
