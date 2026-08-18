import { basename, dirname } from 'node:path';
import { parse } from 'yaml';
import type { ExtractedSkill } from '../types.js';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function extractSkill(raw: string, source: string): ExtractedSkill {
  const fallbackName = basename(dirname(source));
  const match = raw.match(FRONTMATTER);

  let frontmatter: Record<string, unknown> = {};
  let body = raw;

  if (match) {
    body = raw.slice(match[0].length);
    try {
      const parsed = parse(match[1]);
      if (parsed && typeof parsed === 'object') {
        frontmatter = parsed as Record<string, unknown>;
      }
    } catch {
      // Malformed frontmatter is a finding for the quality pillar, not a crash.
      frontmatter = {};
    }
  }

  const name = typeof frontmatter.name === 'string' ? frontmatter.name : fallbackName;
  const description =
    typeof frontmatter.description === 'string' ? frontmatter.description : '';

  return {
    id: `skill:${name}`,
    kind: 'skill',
    name,
    source,
    description,
    body,
    frontmatter,
  };
}
