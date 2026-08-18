import type { ExtractedMcpServer } from '../types.js';

interface RawServer {
  command?: string;
  args?: unknown;
  env?: Record<string, unknown>;
}

export function extractMcpServers(raw: string, source: string): ExtractedMcpServer[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const root = parsed as { mcpServers?: Record<string, RawServer> };
  const servers = root?.mcpServers;
  if (!servers || typeof servers !== 'object') return [];

  return Object.entries(servers).map(([name, cfg]) => ({
    id: `mcp-server:${name}`,
    kind: 'mcp-server' as const,
    name,
    source,
    command: typeof cfg?.command === 'string' ? cfg.command : '',
    args: Array.isArray(cfg?.args) ? cfg.args.map(String) : [],
    // Key names only. Values are credentials and must never be stored.
    envKeys: cfg?.env && typeof cfg.env === 'object' ? Object.keys(cfg.env) : [],
    tools: [],
  }));
}
