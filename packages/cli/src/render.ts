import type { Assay } from '@cupel/core';

export interface RenderOptions {
  color?: boolean;
}

const ESC = '\u001b';
const DIM = `${ESC}[2m`;
const BOLD = `${ESC}[1m`;
const RESET = `${ESC}[0m`;

export function render(assay: Assay, options: RenderOptions = {}): string {
  const color = options.color ?? true;
  const c = (code: string, text: string) => (color ? `${code}${text}${RESET}` : text);
  const lines: string[] = [''];

  if (assay.extensions.length === 0) {
    lines.push('  No extensions found.');
    lines.push(c(DIM, `  Looked in ${assay.coverage.length} locations.`));
    lines.push('');
    return lines.join('\n');
  }

  lines.push(c(BOLD, `  Assayed ${assay.extensions.length} extensions`), '');

  const ranked = [...assay.extensions].sort((a, b) => b.tokens - a.tokens);
  for (const e of ranked) {
    const share = ((e.tokens / assay.contextWindow) * 100).toFixed(0);
    const name = e.extension.name.padEnd(22);
    const tokens = `${e.tokens.toLocaleString()} tok`.padStart(13);
    lines.push(`  ${e.verdict}  ${name}${tokens}   ${share}% of window`);
  }

  const taxShare = ((assay.tokenTaxPerTurn / assay.contextWindow) * 100).toFixed(0);
  lines.push('');
  lines.push(
    c(BOLD, `  Token tax  ${assay.tokenTaxPerTurn.toLocaleString()} tokens per turn`) +
      c(DIM, ` — ${taxShare}% of your window`),
  );
  lines.push(c(BOLD, `  Verdict    ${assay.verdict}`));
  lines.push('');

  return lines.join('\n');
}
