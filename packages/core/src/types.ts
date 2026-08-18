export type ExtensionKind = 'skill' | 'plugin' | 'mcp-server';
export type Pillar = 'safety' | 'cost' | 'quality';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F' | 'unknown';
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface DiscoveredExtension {
  /** Stable identifier: `${kind}:${name}` */
  id: string;
  kind: ExtensionKind;
  name: string;
  /** Absolute path to the file this came from */
  source: string;
}

export interface ExtractedSkill extends DiscoveredExtension {
  kind: 'skill';
  description: string;
  body: string;
  frontmatter: Record<string, unknown>;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface ExtractedMcpServer extends DiscoveredExtension {
  kind: 'mcp-server';
  command: string;
  args: string[];
  /** Names only. Values are never read or stored. */
  envKeys: string[];
  /** Empty unless the server declared tools or a live probe ran. */
  tools: McpTool[];
}

export type Extracted = ExtractedSkill | ExtractedMcpServer;

export interface Finding {
  ruleId: string;
  pillar: Pillar;
  extensionId: string;
  severity: Severity;
  message: string;
  evidence?: string;
}

export interface PillarScore {
  pillar: Pillar;
  score: number;
  grade: Grade;
}

export interface ExtensionAssay {
  extension: Extracted;
  pillars: PillarScore[];
  findings: Finding[];
  /** The worst pillar, never the average. */
  verdict: Grade;
  /** Tokens this extension adds to every turn. */
  tokens: number;
}

export interface CoverageReport {
  path: string;
  status: 'scanned' | 'missing' | 'error';
  found: number;
  note?: string;
}

export interface Assay {
  version: 1;
  generatedAt: string;
  contextWindow: number;
  extensions: ExtensionAssay[];
  tokenTaxPerTurn: number;
  verdict: Grade;
  coverage: CoverageReport[];
}

export interface AssayOptions {
  /** Directory roots to scan. Defaults to the standard discovery paths. */
  roots?: string[];
  /** Project directory for project-local config. Defaults to cwd. */
  cwd?: string;
  /** Context window used for percentage calculations. */
  contextWindow?: number;
  /** Home directory override, for testing. */
  home?: string;
}
