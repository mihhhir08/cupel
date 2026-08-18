import { homedir } from 'node:os';
import { discover } from './discover/index.js';
import { analyzeCost } from './analyze/cost.js';
import { scoreCost, toGrade, worstGrade } from './score.js';
import type { Assay, AssayOptions, ExtensionAssay, Grade } from './types.js';

export * from './types.js';
export { estimateTokens } from './tokenize.js';

const DEFAULT_CONTEXT_WINDOW = 200_000;

export async function assay(options: AssayOptions = {}): Promise<Assay> {
  const home = options.home ?? homedir();
  const cwd = options.cwd ?? process.cwd();
  const contextWindow = options.contextWindow ?? DEFAULT_CONTEXT_WINDOW;

  const { extensions: found, coverage } = await discover({ home, cwd });

  const extensions: ExtensionAssay[] = found.map((ext) => {
    const cost = analyzeCost(ext);
    const costScore = scoreCost(cost.tokens, contextWindow);
    const pillars = [
      { pillar: 'cost' as const, score: costScore, grade: toGrade(costScore) },
    ];
    return {
      extension: ext,
      pillars,
      findings: cost.findings,
      verdict: worstGrade(pillars.map((p) => p.grade)),
      tokens: cost.tokens,
    };
  });

  const tokenTaxPerTurn = extensions.reduce((n, e) => n + e.tokens, 0);
  const verdict: Grade = worstGrade(extensions.map((e) => e.verdict));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    contextWindow,
    extensions,
    tokenTaxPerTurn,
    verdict,
    coverage,
  };
}
