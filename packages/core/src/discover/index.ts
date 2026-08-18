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
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findSkillFiles(full)));
    } else if (entry.name === 'SKILL.md') {
      out.push(full);
    }
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

  return { extensions, coverage };
}
