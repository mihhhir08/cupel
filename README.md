<div align="center">

# cupel

**You have no idea what your agent's extensions can reach.**

One command assays every skill, plugin, and MCP server your coding agent loads —
and tells you what it costs you, what it can touch, and whether it's any good.

```
npx cupel
```

</div>

> **Status: `cupel scan` works today. Cost pillar shipped; safety and quality are next.**
> Discovery and the cost pillar are implemented and tested on macOS, Linux, and
> Windows. The safety and quality pillars, the lockfile, and `cupel diff` are
> designed and planned but not yet built — sections describing them below are
> marked. Star the repo to follow along.

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

Real output, run against the author's own machine:

```
$ npx cupel

  Assayed 83 extensions

  A  math-olympiad               180 tok   0% of window  +4,757 on use
  A  hook-development            136 tok   0% of window  +3,909 on use
  A  command-development         128 tok   0% of window  +4,628 on use
  A  build-mcp-app               117 tok   0% of window  +4,616 on use
  ...

  Token tax  5,758 tokens per turn — 3% of your window
  On use     192,446 tokens if every extension fires
  Verdict    A
```

Two numbers, because they behave differently. **Token tax** is what every
extension costs you on *every single turn* — skill names and descriptions stay
resident so the agent knows what it can reach for. **On use** is what would load
if all of them actually fired: 192,446 tokens, or 96% of a 200K window.

Three pillars, one verdict. **The verdict is your worst pillar, never the average** —
a skill that's elegant, cheap, and insecure is not a B+.

| Pillar | What it measures | Status |
| --- | --- | --- |
| **Cost** | Token weight of every tool schema and skill body, per-turn tax vs. deferred, share of your context window | **shipped** |
| **Safety** | Injection patterns, hidden Unicode and homoglyphs, credential-path reach, network egress, shell surface, provenance | planned |
| **Quality** | Structure, trigger clarity, length against usefulness, semantic overlap with your other skills | planned |

---

## The part nobody else does *(planned)*

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

| Command | Purpose | Status |
| --- | --- | --- |
| `cupel` | Assay everything discoverable, print the report | **works** |
| `cupel --json` | Machine-readable output | **works** |
| `cupel lock` | Write `cupel.lock` | planned |
| `cupel diff` | Compare current state against the lockfile | planned |
| `cupel explain <id>` | Full reasoning behind one finding | planned |
| `cupel gate` | CI mode — exit non-zero on violation | planned |

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
- [Plan: phases 0–2](docs/superpowers/plans/2026-08-17-cupel-phase-0-2.md) — the TDD tasks behind what ships today
- [PRD](docs/PRD.md) — requirements, users, metrics, risks
- [Scope](docs/SCOPE.md) — phases, boundaries, definition of done

## License

Apache-2.0
