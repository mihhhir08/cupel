import { describe, it, expect } from 'vitest';
import { parseFlags } from './index.js';

describe('parseFlags', () => {
  it('defaults to the scan command', () => {
    expect(parseFlags([]).command).toBe('scan');
  });

  it('reads the json flag', () => {
    expect(parseFlags(['--json']).json).toBe(true);
  });

  it('reads a custom context window', () => {
    expect(parseFlags(['--window', '1000000']).contextWindow).toBe(1_000_000);
  });

  it('disables color when NO_COLOR is set', () => {
    expect(parseFlags([], { NO_COLOR: '1' }).color).toBe(false);
  });

  it('disables color with --no-color', () => {
    expect(parseFlags(['--no-color']).color).toBe(false);
  });

  it('keeps color on by default', () => {
    expect(parseFlags([]).color).toBe(true);
  });
});
