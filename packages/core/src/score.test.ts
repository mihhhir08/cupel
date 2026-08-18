import { describe, it, expect } from 'vitest';
import { toGrade, worstGrade, scoreCost } from './score.js';

describe('toGrade', () => {
  it('maps scores to letters', () => {
    expect(toGrade(95)).toBe('A');
    expect(toGrade(85)).toBe('B');
    expect(toGrade(75)).toBe('C');
    expect(toGrade(65)).toBe('D');
    expect(toGrade(10)).toBe('F');
  });
});

describe('worstGrade', () => {
  it('returns the worst grade, never the average', () => {
    expect(worstGrade(['A', 'A', 'D'])).toBe('D');
  });

  it('treats unknown as worse than F', () => {
    expect(worstGrade(['A', 'F', 'unknown'])).toBe('unknown');
  });

  it('returns unknown for an empty list', () => {
    expect(worstGrade([])).toBe('unknown');
  });
});

describe('scoreCost', () => {
  it('scores a free extension perfectly', () => {
    expect(scoreCost(0, 200_000)).toBe(100);
  });

  it('penalises proportionally to window share', () => {
    const tenPercent = scoreCost(20_000, 200_000);
    const twentyPercent = scoreCost(40_000, 200_000);
    expect(tenPercent).toBeGreaterThan(twentyPercent);
  });

  it('never returns a negative score', () => {
    expect(scoreCost(500_000, 200_000)).toBe(0);
  });
});
