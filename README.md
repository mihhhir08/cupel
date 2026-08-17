<div align="center">

# cupel

**You have no idea what your agent's extensions can reach.**

One command assays every skill, plugin, and MCP server your coding agent loads —
and tells you what it costs you, what it can touch, and whether it's any good.

```
npx cupel
```

</div>

> **Status: design complete, implementation in progress.**
> The design, PRD, and scope are finished and in [`docs/`](docs/). The CLI is being
> built in the open — the output below is the target, not a shipped feature. Star
> the repo to follow along, or [contribute a rule](docs/) once Phase 3 lands.

---

## The problem

A cupel is the porous vessel used in fire assay to find out what a metal is *actually*
made of. Your agent's extensions have never been assayed.

In eighteen months, coding agents went from having no extension model to eight
competing marketplaces distributing hundreds of thousands of skills and MCP servers.
None of that came with verified publishers, provenance, an audit command, or a
lockfile. The measurements:

| | |
| --- | --- |
| **36%** | of 3,984 scanned skills carry prompt-injection flaws <sup>[Snyk ToxicSkills]</sup> |
| **12%** | of 2,857 ClawHub skills were outright malicious |
| **1,184** | skills poisoned in the ClawHavoc campaign — *via updates* |
| **6.3** | issues per skill, across 22,511 audited |
| **6.2 / 12** | mean quality across 47,150 public skills <sup>[SkillsBench]</sup> |
| **+16.2pp** | agent pass-rate improvement from curated skills |
| **~42,000** | tokens consumed by one MCP server's schemas — 21% of a 200K window |
| **$2.3B** | direct losses attributed to prompt injection in 2026, +340% YoY |

A verified marketplace was formally requested in
[anthropics/claude-code#30727](https://github.com/anthropics/claude-code/issues/30727).
It was **closed as not planned**.

So nobody is coming. Run the assay yourself.

---

## What it does

```
$ npx cupel

  Assaying 22 extensions ...

  ┌ SAFETY ──────────────────────────────────────────────────┐
  │  D   notion-mcp        reads ~/.config/gh, egress ×3      │
  │  C   pdf-wizard        hidden unicode in description      │
  │  B   sql-runner        shell exec surface                 │
  └──────────────────────────────────────────────────────────┘

  ┌ COST ────────────────────────────────────────────────────┐
  │  github-mcp        41,900 tok    21% of window  $0.13/turn│
  │  playwright-mcp    14,300 tok     7% of window  $0.04/turn│
  └──────────────────────────────────────────────────────────┘

  Token tax    63,400 tokens per turn — 32% of your window
  Verdict      D    2 extensions need attention

  cupel explain notion-mcp     cupel lock
```

Three pillars, one verdict. **The verdict is your worst pillar, never the average** —
a skill that's elegant, cheap, and insecure is not a B+.

| Pillar | What it measures |
| --- | --- |
| **Safety** | Injection patterns, hidden Unicode and homoglyphs, credential-path reach, network egress, shell surface, provenance |
| **Cost** | Token weight of every tool schema and skill body, per-turn tax, share of your context window, projected spend |
| **Quality** | Structure, trigger clarity, length against usefulness, semantic overlap with your other skills |

---

## The part nobody else does

Every scanner is **stateless**. It tells you a thing looks fine today.

ClawHavoc poisoned 1,184 skills **through updates**. The attack that actually
happened is a *change over time*, and a stateless scanner is structurally blind to it.

`cupel diff` keeps a lockfile and reports what changed:

```
CHANGED  github-mcp  2.2.0 -> 2.3.0
  + reads  ~/.aws/credentials          (new)
  + egress api.telemetry-collect.net   (new)
  ! safety  A- -> D
```

That's rug-pull detection, running locally, on your machine.

---

## Commands

| Command | Purpose |
| --- | --- |
| `cupel` | Assay everything discoverable, print the report |
| `cupel lock` | Write `cupel.lock` |
| `cupel diff` | Compare current state against the lockfile |
| `cupel explain <id>` | Full reasoning behind one finding |
| `cupel gate` | CI mode — exit non-zero on violation |

```yaml
# .github/workflows/cupel.yml
- run: npx cupel gate --max-risk medium --budget 15000
```

---

## Principles

**No network. No account. No telemetry.** Not a roadmap item — a hard commitment,
enforced by test. A tool that audits trust cannot itself be a data-collection
channel.

**Cross-platform.** The existing runtime enforcement tools are Linux-kernel-only
(Landlock, seccomp) or enterprise platforms. Cupel runs on your Mac.

**Rules are data, not code.** Detection rules are versioned YAML with their own test
cases. You can contribute one without reading a line of TypeScript.

---

## Why not just a scanner

Because detection catches roughly 23% of sophisticated injection attempts, and
because the problem is task-conditioned. From
[SkillScope (arXiv 2605.05868)](https://arxiv.org/abs/2605.05868):

> Scanning tools do not reliably convert broad standing privilege into least
> privilege... the same action may be necessary under one user prompt but
> over-privileged under another.

A skill that's clean at scan time still runs with **your** privileges — your SSH
keys, your cloud credentials, your production access. Runtime enforcement is the
real answer and it's on the roadmap ([PRD §9](docs/PRD.md)). But a tool nobody has
installed can't enforce anything, so Cupel starts by showing you what you already
have.

---

## Documentation

- [Design](docs/superpowers/specs/2026-08-17-cupel-design.md) — problem analysis, architecture, rationale
- [PRD](docs/PRD.md) — requirements, users, metrics, risks
- [Scope](docs/SCOPE.md) — phases, boundaries, definition of done

## License

Apache-2.0
