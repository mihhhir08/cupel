import type { Grade } from './types.js';

/** Worst first. `unknown` is worse than `F`: an unparseable extension is never a pass. */
const ORDER: Grade[] = ['unknown', 'F', 'D', 'C', 'B', 'A'];

export function toGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function worstGrade(grades: Grade[]): Grade {
  if (grades.length === 0) return 'unknown';
  return grades.reduce((worst, g) =>
    ORDER.indexOf(g) < ORDER.indexOf(worst) ? g : worst,
  );
}

/**
 * An extension consuming 20% of the window scores 0.
 * Below that, the penalty is linear in window share.
 */
export function scoreCost(tokens: number, contextWindow: number): number {
  if (tokens <= 0) return 100;
  const share = tokens / contextWindow;
  return Math.max(0, Math.round(100 - (share / 0.2) * 100));
}
