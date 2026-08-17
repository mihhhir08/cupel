# Cupel — Design Document

**Date:** 2026-08-17
**Status:** Approved
**Author:** Mihirsinh Chavda

---

## 1. Problem

The agent extension ecosystem solved distribution and skipped every quality gate.

In roughly eighteen months, coding agents went from having no extension model to
having eight competing marketplaces, hundreds of thousands of published skills, and
a Model Context Protocol server for nearly every SaaS product in existence. None of
that growth was accompanied by the infrastructure that made earlier package
ecosystems survivable: no verified publishers, no provenance, no audit command, no
lockfile, no meaningful quality signal.

The measured consequences:

| Finding | Number | Source |
| --- | --- | --- |
| Skills containing prompt-injection flaws | **36%** of 3,984 scanned | Snyk ToxicSkills, Feb 2026 |
| Skills with live malicious payloads | 76 confirmed | Snyk ToxicSkills, Feb 2026 |
| ClawHub skills outright malicious | **12%** of 2,857 | Independent audit, 2026 |
| Skills poisoned in the ClawHavoc campaign | 1,184 | OWASP, Apr 2026 |
| Issues found across 22,511 audited skills | 140,963 (**6.3 per skill**) | Agentman ecosystem report, 2026 |
| Mean quality score, 47,150 public skills | **6.2 / 12** | SkillsBench, 2026 |
| Pass-rate improvement from curated skills | **+16.2 percentage points** | SkillsBench, 2026 |
| Context consumed by GitHub MCP tool schemas | **~42,000 tokens** (21% of a 200K window) | Measured, 2026 |
| Schema overhead, 20-turn session, 3-4 servers | **~300,000 tokens** | Measured, 2026 |
| Direct losses attributed to prompt injection | **$2.3B**, +340% YoY | Recorded Future, 2026 |
| Employees at 10k-person orgs running MCP servers | 15.28%, ~2 servers each, mostly unreviewed | CSO Online, 2026 |

The official remedy was requested and declined. `anthropics/claude-code` issue
#30727 asked for a verified marketplace with publisher identity, security review,
and code signing. It was closed as not planned and marked stale.

So the need is documented, quantified, urgent, and officially unaddressed.

### 1.1 Why scanning alone does not solve it

The instinct is to build a scanner. That instinct is wrong, for two reasons.

First, detection does not work well enough. Current methods catch roughly 23% of
sophisticated injection attempts. A 36% flaw rate against that detection rate is a
losing game of whack-a-mole.

Second, and more fundamentally, the problem is task-conditioned. From SkillScope
(arXiv 2605.05868):

> Scanning tools do not reliably convert broad standing privilege into least
> privilege... the problem is inherently task-conditioned: the same action may be
> necessary under one user prompt but over-privileged under another.

A skill that is clean at scan time still executes with the full privilege of the
agent running it: the developer's SSH keys, cloud credentials, and production
access.

### 1.2 Why the existing runtime tools do not solve it either

Runtime enforcement is the correct architectural answer, and several projects
pursue it. None of them serves an individual developer:

- `sandlock.mcp` — Landlock and seccomp-bpf. Linux-kernel only; does not run on macOS.
- Cosmonic Control — WebAssembly capability isolation. Enterprise platform.
- sandbox0 — commercial gateway product.
- gVisor / Kata Containers — heavy infrastructure, per-VM isolation.

Nobody has shipped the cross-platform, zero-config, locally-run tool that a solo
developer with fourteen skills and six MCP servers installs in thirty seconds.

### 1.3 The framing

This is npm circa 2010. Distribution arrived years before trust infrastructure did.
npm's answer was not three separate tools; it was one verdict per package, produced
locally, on demand, by a command every developer already had.

---

## 2. Product

**Cupel** grades every skill, plugin, and MCP server a coding agent loads, and
issues one verdict per extension.

```
npx cupel
```

Discovers everything installed, analyzes it, prints a report card, writes a
lockfile.

A cupel is the porous vessel used in fire assay to determine the true composition
of a precious metal. The name is chosen deliberately: an assay measures
*composition*, not just contamination, which is precisely the scope of the three
pillars below.

### 2.1 The three pillars

Each pillar exists because a specific measurement demanded it.

**Safety** — Prompt-injection patterns in tool and skill descriptions, hidden
Unicode and homoglyph obfuscation, credential-path reach, network egress
destinations, shell and exec surface, unpinned dependencies, provenance signals
(git origin, signing, author history).
*Because 36% of scanned skills carry injection flaws.*

**Cost** — Token weight of every MCP tool schema and every skill body, the per-turn
tax they impose, percentage of the context window consumed before the user types
anything, and a projected dollar and quota cost.
*Because one MCP server can consume 42,000 tokens of a 200,000-token window.*

**Quality** — SKILL.md structure and completeness, description and trigger clarity,
body length against usefulness, and semantic overlap or ambiguity against the other
skills installed alongside it.
*Because mean public skill quality is 6.2/12, and curated skills raise agent pass
rates by 16.2 percentage points.*

### 2.2 The differentiating capability: `cupel diff`

Every existing scanner is stateless. It tells you whether a thing looks bad today.

Cupel keeps `cupel.lock` and reports what *changed*:

```
CHANGED  github-mcp  2.2.0 -> 2.3.0
  + reads  ~/.aws/credentials          (new)
  + egress api.telemetry-collect.net   (new)
  ! safety  A- -> D
```

This is rug-pull detection running locally on the developer's machine. ClawHavoc
poisoned 1,184 skills through updates — the attack that actually happened is a
change over time, and a stateless scanner is structurally blind to it.

### 2.3 Adoption strategy

Security tooling historically underperforms on adoption because it introduces
friction. Headroom reached 39,000 stars in five months because it saved money
immediately and measurably.

Therefore the entry point is not enforcement. It is the x-ray: run one command and
see, for the first time, what the extensions already installed on your machine
actually reach for. That output is alarming, personal, and screenshot-able.
Enforcement is what a developer turns on after their own report frightens them.

Precedent: `ccusage`, a CLI that does nothing but read Claude Code's local JSONL
files, was the #1 trending GitHub project in February 2026.

---

## 3. Architecture

```
cupel/
├── packages/
│   ├── core/         discover -> extract -> analyze -> score
│   ├── rules/        declarative YAML rule packs, versioned
│   ├── cli/          cupel scan | diff | lock | gate | explain
│   ├── report/       self-contained HTML report
│   └── python-sdk/   thin client: cupel.scan() -> dict
├── docs/
└── site/             landing page
```

### 3.1 Module boundaries

Each package answers three questions: what it does, how it is used, what it depends
on.

**`core`** — Takes a filesystem root and a config object. Returns a typed `Assay`
object. Performs no printing and no network access. Depends only on `rules`. This
purity is what makes the analysis testable in isolation and is the single most
important boundary in the system.

**`rules`** — Declarative YAML rule packs. Data, not code. Depends on nothing.

This boundary is deliberate and strategic. A contributor can add a detection rule
via a YAML pull request without reading a line of TypeScript. That is what converts
stars into forks, and forks into a rule corpus no single maintainer could write.

**`cli`** — Presentation only. Depends on `core` and `report`. Contains no analysis
logic whatsoever; if a rule needs to change, `cli` is not the file to open.

**`report`** — Takes an `Assay`, emits a self-contained HTML file. Depends on
nothing but the `Assay` type.

**`python-sdk`** — Thin client wrapping the CLI's JSON output. Exists because the
agent-tooling audience skews Python, and because `cupel.scan()` returning a dict is
the lowest-friction way for that audience to adopt.

### 3.2 Data flow

```
discover ──> extract ──> analyze ──> score ──> emit
   │            │           │          │         │
   │            │           ├ safety   │         ├ terminal
   │            │           ├ cost     │         ├ html
   │            │           └ quality  │         ├ json
   │            │          (parallel)  │         └ cupel.lock
   │            │                      │
   │            └ SKILL.md frontmatter + body
   │              MCP manifests, tool schemas
   │
   └ ~/.claude/skills/, ~/.claude/plugins/, ./.claude/
     .mcp.json, ~/.claude.json
     claude_desktop_config.json, ./.cursor/mcp.json
```

### 3.3 MCP tool extraction: two modes

**Static (default).** Parse configuration and any declared manifest. Safe,
instant, requires no execution.

**Live (opt-in, `--probe`).** Spawn the server as a subprocess, issue `tools/list`,
read the schemas, terminate. Never invokes a tool.

Live mode is opt-in and never the default, because spawning an unvetted MCP server
is precisely the risk the tool exists to warn about. Defaulting to it would make
Cupel an attack vector for the thing it detects.

### 3.4 Scoring

Each pillar scores 0–100 and maps to a letter grade.

**The verdict is the worst pillar, not the average.** A skill that is elegant,
cheap, and insecure is not a B+. Averaging hides exactly the failure mode the tool
exists to surface.

One headline number accompanies the grades: total token tax per turn, in tokens and
in dollars, summed across every installed extension.

### 3.5 Error handling

- An extension that cannot be parsed is graded `unknown`. It is never silently
  passed. Silence is the failure mode that makes audit tools worthless.
- A missing or unreadable discovery path is skipped with a note, not an abort.
- Live-probe timeouts are non-fatal; the extension degrades to static analysis and
  is marked as such in the report.
- A malformed rule pack fails loudly at load time rather than silently matching
  nothing.

### 3.6 Testing

- A fixture corpus of real-shaped extensions: clean examples, and known-bad examples
  reconstructed from published ToxicSkills and ClawHavoc patterns.
- Snapshot tests over the emitted `Assay` JSON — this catches unintended scoring
  drift across the whole corpus with one assertion.
- Table-driven tests per rule: each rule ships with positive and negative cases in
  its own YAML.
- `cupel diff` tested against synthetic lockfile pairs representing a rug pull.

### 3.7 CI gate

```
cupel gate --max-risk medium --budget 15000
```

Exit 1 on violation. This is what moves Cupel from a one-time curiosity to a
recurring dependency in a team's pipeline.

---

## 4. Scope boundaries

**In scope for v1:** Claude Code skills, plugins, and MCP servers; MCP
configurations shared with Cursor and Claude Desktop; the three analyzers; the
lockfile; the diff; the HTML report; the CI gate; the Python SDK.

**Explicitly out of scope for v1:** runtime interception or blocking of live agent
traffic; a hosted service or registry; a web dashboard with accounts; automated
remediation that edits a user's skills; support for non-MCP agent frameworks.

Runtime enforcement is the correct long-term architecture and is deliberately
deferred. Cupel must first earn the right to be installed, and the x-ray earns that
right at a fraction of the engineering cost.

---

## 5. Non-goals

Cupel does not attempt to be a better scanner than a well-funded security vendor at
enterprise scale. It attempts to be the only tool an individual developer will
actually run on their own machine, on a Tuesday, out of curiosity — and then keep
running because the diff keeps telling them something they did not know.
