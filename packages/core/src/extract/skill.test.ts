import { describe, it, expect } from 'vitest';
import { extractSkill } from './skill.js';

const SAMPLE = `---
name: pdf-wizard
description: Extracts tables from PDF files
---

# PDF Wizard

Use this when the user has a PDF.
`;

describe('extractSkill', () => {
  it('parses frontmatter and body', () => {
    const s = extractSkill(SAMPLE, '/skills/pdf-wizard/SKILL.md');
    expect(s.name).toBe('pdf-wizard');
    expect(s.description).toBe('Extracts tables from PDF files');
    expect(s.body).toContain('# PDF Wizard');
    expect(s.id).toBe('skill:pdf-wizard');
    expect(s.kind).toBe('skill');
  });

  it('falls back to the directory name when frontmatter has no name', () => {
    const s = extractSkill('no frontmatter here', '/skills/orphan/SKILL.md');
    expect(s.name).toBe('orphan');
    expect(s.description).toBe('');
  });

  it('does not throw on malformed yaml', () => {
    const s = extractSkill('---\n:::bad yaml:::\n---\nbody', '/skills/broken/SKILL.md');
    expect(s.name).toBe('broken');
    expect(s.body).toContain('body');
  });
});
