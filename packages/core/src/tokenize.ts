/**
 * Character-per-token divisors, calibrated against published measurements:
 *   - GitHub MCP tool schemas   ~42,000 tokens
 *   - Playwright MCP, 22 tools  ~14,300 tokens
 *
 * Structured JSON tokenizes denser than prose because punctuation and short
 * keys break into more tokens per character.
 *
 * ponytail: heuristic estimator, accurate enough to rank extensions and size
 * the headline tax. Swap in a real BPE table if absolute accuracy is ever
 * needed — the divisors are the only calibration surface.
 */
const CHARS_PER_TOKEN_PROSE = 4.0;
const CHARS_PER_TOKEN_JSON = 2.8;

/** Fraction of non-alphanumeric characters above which text is treated as structured. */
const STRUCTURE_THRESHOLD = 0.22;

export function estimateTokens(text: string): number {
  if (!text) return 0;

  const punctuation = (text.match(/[^\p{L}\p{N}\s]/gu) ?? []).length;
  const structureRatio = punctuation / text.length;
  const divisor =
    structureRatio > STRUCTURE_THRESHOLD ? CHARS_PER_TOKEN_JSON : CHARS_PER_TOKEN_PROSE;

  return Math.ceil(text.length / divisor);
}

export function estimateJsonTokens(value: unknown): number {
  return estimateTokens(JSON.stringify(value) ?? '');
}
