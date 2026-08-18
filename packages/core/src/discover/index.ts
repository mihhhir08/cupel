import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { defaultSkillPaths, defaultMcpConfigPaths, type PathContext } from './paths.js';
import { extractSkill } from '../extract/skill.js';
import { extractMcpServers } from '../extract/mcp.js';
import type { CoverageReport, Extracted } from '../types.js';

export interface DiscoverResult {
  extensions: Extracted[];
  coverage: CoverageReport[];
}

async function findSkillFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  // A directory holding a SKILL.md *is* the skill. Anything nested below it is
  // vendored content (an `upstream/` copy, bundled examples), not a separate
  // installed skill, so we stop descending here.
  if (entries.some((e) => e.isFile() && e.name === 'SKILL.md')) {
    return [join(dir, 'SKILL.md')];
  }

  const out: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) out.push(...(await findSkillFiles(join(dir, entry.name))));
  }
  return out;
}

export async function discover(ctx: PathContext): Promise<DiscoverResult> {
  const extensions: Extracted[] = [];
  const coverage: CoverageReport[] = [];

  for (const dir of defaultSkillPaths(ctx)) {
    try {
      await stat(dir);
    } catch {
      coverage.push({ path: dir, status: 'missing', found: 0 });
      continue;
    }
    const files = await findSkillFiles(dir);
    for (const file of files) {
      try {
        extensions.push(extractSkill(await readFile(file, 'utf8'), file));
      } catch {
        coverage.push({ path: file, status: 'error', found: 0, note: 'unreadable' });
      }
    }
    coverage.push({ path: dir, status: 'scanned', found: files.length });
  }

  for (const file of defaultMcpConfigPaths(ctx)) {
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch {
      coverage.push({ path: file, status: 'missing', found: 0 });
      continue;
    }
    const servers = extractMcpServers(raw, file);
    extensions.push(...servers);
    coverage.push({ path: file, status: 'scanned', found: servers.length });
  }

  return { extensions: dedupe(extensions), coverage };
}

/**
 * The same skill ships in several places at once — a marketplace clone and a
 * versioned cache both hold `vercel/skills/workflow`. Only one is ever loaded,
 * so counting both would inflate the token tax. First path wins.
 */
function dedupe(extensions: Extracted[]): Extracted[] {
  const seen = new Map<string, Extracted>();
  for (const ext of extensions) {
    if (!seen.has(ext.id)) seen.set(ext.id, ext);
  }
  return [...seen.values()];
}
