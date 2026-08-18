# Cupel — Project Scope

**Version:** 1.0
**Date:** 2026-08-17
**Companion documents:** `PRD.md` (what and why), `DESIGN.md` (design rationale)

---

## 1. Scope statement

Build and ship a cross-platform, local-first CLI that discovers every skill, plugin,
and MCP server installed for a coding agent, analyzes each across safety, token
cost, and quality, and issues one verdict per extension — plus a lockfile and a
diff that detect capability changes over time.

Everything in this document is scoped to that sentence. Work that does not serve it
is out of scope by default, not by exception.

---

## 2. In scope

### 2.1 Deliverables

| # | Deliverable | Description |
| --- | --- | --- |
| D1 | `@cupel/core` | Discovery, extraction, three analyzers, scoring engine. Pure; no I/O side effects |
| D2 | `@cupel/rules` | Declarative YAML rule packs with per-rule test cases |
| D3 | `cupel` CLI | Five commands: `scan`, `lock`, `diff`, `explain`, `gate` |
| D4 | `@cupel/report` | Self-contained HTML report generator |
| D5 | `cupel` Python SDK | Thin client returning the scan result as a dict |
| D6 | Fixture corpus | Clean and known-bad extensions for regression testing |
| D7 | Documentation | README, rule authoring guide, contribution guide, threat model |
| D8 | Landing page | Static site, deployable to GitHub Pages |
| D9 | CI | Test matrix, lint, reference `cupel gate` workflow |

### 2.2 Platform and ecosystem coverage

**Committed:** macOS, Linux, Windows. Node 20+.
**Ecosystems:** Claude Code skills, Claude Code plugins, MCP servers (via `.mcp.json`,
`~/.claude.json`, `claude_desktop_config.json`, `.cursor/mcp.json`).

MCP coverage is protocol-level, so Cursor and Claude Desktop come nearly free once
Claude Code is supported. That is why they are in scope; ecosystems requiring
bespoke parsers are not.

---

## 3. Out of scope

Recorded explicitly so that scope creep has to argue against a written decision
rather than slip in unnoticed.

| Excluded | Rationale |
| --- | --- |
| Runtime interception or blocking of live agent traffic | Correct long-term direction, deferred until the tool has earned installation. See PRD §9 |
| Hosted service, registry, or account system | Breaks the zero-network commitment (NFR2/NFR3) that makes the tool trustworthy |
| Web dashboard with authentication | No user need in v1; the HTML report covers the visual case |
| Automated remediation that edits user skills | Trust cost far exceeds the benefit; a tool that audits must not also mutate |
| LLM-based analysis in the default path | Breaks zero-network. Optional opt-in path only, and only after heuristics are measured |
| Non-MCP agent frameworks (LangChain, CrewAI) | No acute unvetted-marketplace problem; would double parser surface for a fraction of the value |
| OpenClaw plugin support | Large audience, but a fast-moving third-party target. Revisit after v1 |
| Telemetry of any kind | Non-negotiable. See NFR3 |
| Publishing to a marketplace or acting as a registry | Cupel judges the ecosystem; it does not join it |

---

## 4. Phases

Each phase ends in a state that could ship. No phase depends on a later phase to be
useful, which means the project can be stopped at any boundary without leaving
half a product behind.

### Phase 0 — Foundation
Monorepo, TypeScript config, test harness, CI skeleton, `Assay` type definitions.
**Done when:** an empty scan runs end to end and emits valid JSON.

### Phase 1 — Discovery and extraction
All discovery paths, SKILL.md parsing, MCP config parsing, coverage reporting.
**Done when:** `cupel scan` lists every extension on a real machine, with no analysis.

### Phase 2 — The cost pillar
Tokenizer, schema and body counting, per-turn tax, window percentage, ranking.
**Done when:** the headline token-tax number is correct within 5% of published counts.

Cost is built first among the analyzers deliberately. It is the pillar with no false
positives — a token count is a fact — so it produces a shippable, alarming,
screenshot-worthy result before any judgment call is written.

### Phase 3 — The safety pillar
Rule pack format, rule loader, injection and hidden-Unicode detection, credential
reach, egress enumeration, exec surface, provenance.
**Done when:** the known-bad fixture corpus is detected with zero false positives on
the clean corpus.

### Phase 4 — The quality pillar
Structure validation, description and trigger clarity, overlap and ambiguity
detection, staleness.
**Done when:** scores correlate directionally with SkillsBench on a sample.

### Phase 5 — Verdict, lockfile, diff
Scoring, worst-pillar verdict, `cupel lock`, `cupel diff`, `cupel explain`.
**Done when:** a synthetic rug pull is detected and clearly explained.

### Phase 6 — Surfaces
Terminal formatting, HTML report, `cupel gate`, Python SDK, reference workflow.
**Done when:** all five commands work and the gate fails a build correctly.

### Phase 7 — Launch readiness
README, threat model, rule authoring guide, contribution guide, landing page, demo
recording.
**Done when:** a stranger can install, run, understand the output, and contribute a
rule without asking a question.

---

## 5. Definition of done

A phase is complete only when all of the following hold:

- Every P0 requirement in its scope passes an automated test
- The fixture corpus produces no regressions in the `Assay` snapshot
- No new network calls exist in the default path — enforced by test
- Public interfaces are documented at their boundary
- The CLI degrades gracefully on a machine with nothing installed

---

## 6. Dependencies and constraints

| Constraint | Implication |
| --- | --- |
| Zero network in default path | No LLM calls, no registry lookups, no telemetry. Enforced by test, not by convention |
| No native compilation | Rules out kernel-level primitives such as Landlock and seccomp. This is why Cupel is cross-platform where the runtime tools are not |
| Ecosystem paths are unstable | Discovery paths must be configuration, never hard-coded constants |
| Live probe executes untrusted code | Opt-in only, hard timeout, enumeration only, never tool invocation |

---

## 7. Risk register

See PRD §10 for the full register. The two scope-specific risks:

**Analyzer scope inflation.** Three pillars invite endless sub-checks. Mitigation:
a check earns its place only if it maps to a documented finding in the evidence
table, or to an OWASP Agentic Skills Top 10 category.

**The bolted-together failure.** Three pillars can read as three tools sharing a
binary. Mitigation: one verdict, one headline number, and one shared data model —
the pillars must converge on a single judgment or the product has failed its core
premise.

---

## 8. Success criteria for v1

1. `npx cupel` on a machine with a real installation produces at least one genuinely
   surprising finding.
2. Total runtime under 10 seconds, static path.
3. A contributor adds a working detection rule without writing TypeScript.
4. `cupel diff` catches a rug pull that no stateless scanner would report.
5. The terminal output is good enough that people post a screenshot of it.

Criterion 5 is not decoration. The research is explicit that adoption for this
category follows a shareable moment of revelation, and a report nobody screenshots
is a report nobody shares.
