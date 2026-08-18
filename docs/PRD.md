# Cupel — Product Requirements Document

**Version:** 1.0
**Date:** 2026-08-17
**Owner:** Mihirsinh Chavda
**Status:** Approved for implementation

---

## 1. Summary

Cupel is a local-first command-line tool that grades every skill, plugin, and MCP
server a coding agent loads, across three dimensions — safety, token cost, and
quality — and issues a single verdict per extension.

It runs entirely on the developer's machine, requires no account, no API key, and
no network access, and completes in under ten seconds on a typical installation.

```
npx cupel
```

---

## 2. Background

Coding agents gained an extension model, and the ecosystem around it grew faster
than any trust infrastructure to support it. Eight marketplaces now distribute
hundreds of thousands of skills and MCP servers with no verified publishers, no
provenance, no audit command, and no lockfile.

Measured consequences are in `docs/DESIGN.md`
§1. The headline figures: 36% of scanned skills carry prompt-injection flaws, the
mean quality of 47,150 public skills is 6.2 out of 12, and a single MCP server can
consume 21% of a 200,000-token context window before the user types a word.

A verified marketplace was formally requested in `anthropics/claude-code` issue
#30727 and closed as not planned.

---

## 3. Goals and non-goals

### 3.1 Goals

| ID | Goal | Measure of success |
| --- | --- | --- |
| G1 | Make the invisible visible | A developer who has never audited their setup learns something they did not know, within 10 seconds of first run |
| G2 | Be trivially adoptable | Zero config, zero account, zero network. `npx cupel` works on first invocation |
| G3 | Detect change, not just state | `cupel diff` surfaces a rug pull that a stateless scanner cannot see |
| G4 | Be extended by contributors | A new detection rule can be added as a YAML pull request with no TypeScript |
| G5 | Survive past the first run | The CI gate and lockfile give teams a reason to keep it installed |

### 3.2 Non-goals

- Runtime interception or blocking of live agent traffic (deferred, see §9)
- A hosted service, registry, or account system
- Competing with enterprise security vendors on scanning depth
- Automated remediation that rewrites a user's skills
- Support for non-MCP agent frameworks in v1

---

## 4. Users

**Primary — the individual agent power user.** Has 10–40 skills and 3–8 MCP servers
installed, accumulated over months from GitHub links, blog posts, and marketplace
browsing. Has never audited any of them. Does not know what they can reach.
Motivated first by curiosity, then by alarm.

**Secondary — the team lead adopting agents at work.** Needs to answer "is it safe
for our engineers to install these" and currently cannot. Needs a lockfile and a CI
gate, not a dashboard.

**Tertiary — the skill author.** Wants their published skill to grade well and wants
to know why it does not. Cupel's quality pillar is their feedback loop.

---

## 5. Functional requirements

### 5.1 Discovery — `FR-D`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-D1 | Discover skills in `~/.claude/skills/` and project `.claude/skills/` | P0 |
| FR-D2 | Discover plugins in `~/.claude/plugins/` | P0 |
| FR-D3 | Discover MCP servers from `.mcp.json`, `~/.claude.json` | P0 |
| FR-D4 | Discover MCP servers from `claude_desktop_config.json` | P1 |
| FR-D5 | Discover MCP servers from `.cursor/mcp.json` | P1 |
| FR-D6 | Accept `--path` to scan an arbitrary root | P1 |
| FR-D7 | Report discovery coverage so the user knows what was and was not looked at | P0 |

### 5.2 Extraction — `FR-E`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-E1 | Parse SKILL.md frontmatter and body | P0 |
| FR-E2 | Parse MCP server configuration: command, args, env keys, transport | P0 |
| FR-E3 | Static extraction is the default and requires no execution | P0 |
| FR-E4 | Live probe (`--probe`) spawns a server, calls `tools/list`, terminates | P1 |
| FR-E5 | Live probe never invokes a tool, only enumerates | P0 |
| FR-E6 | Live probe is opt-in and never implied by another flag | P0 |

### 5.3 Safety analysis — `FR-S`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-S1 | Detect prompt-injection patterns in tool and skill descriptions | P0 |
| FR-S2 | Detect hidden Unicode, homoglyphs, zero-width and bidi control characters | P0 |
| FR-S3 | Flag reach into credential paths (`~/.ssh`, `~/.aws`, `~/.config/gh`, keychains, `.env`) | P0 |
| FR-S4 | Enumerate network egress destinations referenced by the extension | P0 |
| FR-S5 | Flag shell, `exec`, and subprocess surface | P0 |
| FR-S6 | Flag unpinned or floating dependency specifications | P1 |
| FR-S7 | Record provenance: git origin, signing status, author, last modified | P1 |
| FR-S8 | Map each finding to its OWASP Agentic Skills Top 10 category where applicable | P1 |

### 5.4 Cost analysis — `FR-C`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-C1 | Token-count every MCP tool schema | P0 |
| FR-C2 | Token-count every skill body and description | P0 |
| FR-C3 | Compute per-turn token tax across all installed extensions | P0 |
| FR-C4 | Express that tax as a percentage of a configurable context window | P0 |
| FR-C5 | Project a dollar cost at configurable per-token pricing | P1 |
| FR-C6 | Rank extensions by cost so the worst offender is obvious | P0 |
| FR-C7 | Account for deferred/on-demand tool loading where the host supports it | P1 |

### 5.5 Quality analysis — `FR-Q`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-Q1 | Validate SKILL.md structure and required frontmatter fields | P0 |
| FR-Q2 | Score description and trigger clarity — can an agent tell when to use this? | P0 |
| FR-Q3 | Flag body length disproportionate to stated purpose | P1 |
| FR-Q4 | Detect semantic overlap and trigger ambiguity between installed skills | P1 |
| FR-Q5 | Flag abandoned extensions by last-modified date | P1 |

### 5.6 Scoring and verdict — `FR-V`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-V1 | Score each pillar 0–100, mapped to a letter grade | P0 |
| FR-V2 | Verdict per extension is the **worst** pillar, never the average | P0 |
| FR-V3 | Unparseable extensions grade `unknown` and are never silently passed | P0 |
| FR-V4 | Every finding is traceable to the rule that produced it | P0 |
| FR-V5 | `cupel explain <id>` prints the full reasoning for one finding | P1 |

### 5.7 Lockfile and diff — `FR-L`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-L1 | `cupel lock` writes `cupel.lock` with content hashes and recorded capabilities | P0 |
| FR-L2 | `cupel diff` compares current state against the lockfile | P0 |
| FR-L3 | Diff surfaces newly acquired capabilities, not just changed hashes | P0 |
| FR-L4 | Diff highlights grade regressions between versions | P0 |
| FR-L5 | Lockfile is human-readable and diff-friendly in git | P1 |

### 5.8 Output — `FR-O`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-O1 | Terminal report, readable and screenshot-worthy by default | P0 |
| FR-O2 | `--json` for machine consumption | P0 |
| FR-O3 | `--html` writes a self-contained report with no external assets | P1 |
| FR-O4 | Respect `NO_COLOR` and non-TTY output | P1 |

### 5.9 CI gate — `FR-G`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-G1 | `cupel gate --max-risk <level>` exits non-zero on violation | P0 |
| FR-G2 | `cupel gate --budget <tokens>` fails when the token tax exceeds budget | P0 |
| FR-G3 | Ship a reference GitHub Actions workflow | P1 |

### 5.10 Python SDK — `FR-P`

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P1 | `cupel.scan()` returns a dict mirroring the JSON schema | P1 |
| FR-P2 | Typed via TypedDict or dataclasses | P2 |

---

## 6. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR1 | Complete a static scan of a typical installation in under 10 seconds |
| NFR2 | Zero network access in the default path — verifiable, and stated in the README |
| NFR3 | No account, API key, or telemetry. No usage data leaves the machine, ever |
| NFR4 | Cross-platform: macOS, Linux, Windows. No kernel-specific dependencies |
| NFR5 | Node 20+ with no native compilation step |
| NFR6 | A malformed rule pack fails loudly at load, never silently matches nothing |
| NFR7 | Live probe runs with a hard timeout and is always terminated |

NFR3 is a hard product commitment, not an implementation detail. A tool that audits
trust cannot itself be a data-collection channel.

---

## 7. User experience

### 7.1 First run

The first run is the entire adoption event. It must produce, within ten seconds, at
least one fact the user did not previously know about their own machine.

```
$ npx cupel

  Assaying 22 extensions ...

  ┌ SAFETY ──────────────────────────────────────────────────┐
  │  D   notion-mcp        reads ~/.config/gh, egress ×3      │
  │  C   pdf-wizard        hidden unicode in description      │
  │  B   sql-runner        shell exec surface                 │
  └──────────────────────────────────────────────────────────┘

  ┌ COST ────────────────────────────────────────────────────┐
  │  github-mcp        41,900 tok    21% of window   $0.13/turn│
  │  playwright-mcp    14,300 tok     7% of window   $0.04/turn│
  └──────────────────────────────────────────────────────────┘

  Token tax    63,400 tokens per turn — 32% of your window
  Verdict      D    2 extensions need attention

  cupel explain notion-mcp     cupel lock
```

### 7.2 Command surface

| Command | Purpose |
| --- | --- |
| `cupel` / `cupel scan` | Assay everything discoverable; print the report |
| `cupel lock` | Write `cupel.lock` |
| `cupel diff` | Compare current state to the lockfile |
| `cupel explain <id>` | Full reasoning behind one finding |
| `cupel gate` | CI mode; exit non-zero on violation |

Five commands. No subcommand trees, no config file required to start.

---

## 8. Success metrics

| Horizon | Metric | Target |
| --- | --- | --- |
| Launch | GitHub stars | 1,000 in first 30 days |
| Launch | Show HN / front page | Front page of Hacker News |
| 90 days | Community rule contributions | 25 merged rule PRs from ≥10 contributors |
| 90 days | Forks | 150 |
| 180 days | Repos with `cupel.lock` committed | 500 |

The rule-contribution metric is the one that matters most. Stars measure attention;
merged rule PRs measure whether the extensibility boundary in `packages/rules`
actually worked. If that number is near zero at 90 days, the architecture failed
regardless of star count.

---

## 9. Deferred: runtime enforcement

Runtime least-privilege enforcement is the correct long-term architecture, and the
research is unambiguous that scanning alone cannot convert standing privilege into
least privilege.

It is deliberately deferred past v1 for one reason: Cupel must first earn the right
to be installed. The x-ray earns that right at a fraction of the engineering cost,
and a tool nobody has installed cannot enforce anything.

The v1 data model is designed so that recorded capabilities become enforcement
policy without redesign — the capability set that `cupel.lock` records is
intentionally the same shape that a future policy engine would consume.

---

## 10. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Anthropic ships native auditing | High | Cover Cursor and Claude Desktop too; the diff and the lockfile remain uncovered by any first-party roadmap |
| A well-funded vendor ships the same thing | Medium | Compete on local-first, zero-account, and community rules — a posture enterprise vendors structurally will not adopt |
| False positives erode trust | High | Every finding traceable to a named rule; `explain` shows the evidence; ship with conservative defaults |
| Security framing suppresses adoption | Medium | Lead with the x-ray and the cost number, not with blocking |
| Rule corpus stagnates without contributors | High | Rules as YAML data with positive/negative test cases; contribution guide before launch |
| Ecosystem paths shift | Medium | Discovery paths are configuration, not hard-coded constants |

---

## 11. Open questions

| # | Question | Resolution path |
| --- | --- | --- |
| Q1 | Which tokenizer for cost estimates? | Benchmark a local BPE approximation against published counts; accuracy within 5% is sufficient for ranking |
| Q2 | Does quality scoring need an LLM, or do heuristics suffice? | Start heuristic-only to preserve NFR2 and NFR3; measure agreement against SkillsBench before considering an optional LLM path |
| Q3 | Should `cupel.lock` be committed to git by default? | Recommend yes for teams; document both modes |

Q2's default is load-bearing. An LLM call would break the zero-network commitment
that makes the tool trustworthy, so heuristics are the default and any LLM path
must remain strictly opt-in.
