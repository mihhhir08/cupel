# cupel

**You have never read what your agent loads.**

Grades every skill, plugin, and MCP server on your machine: what it costs you,
what it can reach, whether it works.

```bash
npx cupel
```

> This README ships with the npm package. cupel is not yet published, so `npx cupel` does not resolve today. Run it from source: https://github.com/mihhhir08/cupel

```
  Assayed 83 extensions

  A  math-olympiad          180 tok   0% of window  +4,757 on use
  A  hook-development       136 tok   0% of window  +3,909 on use
  ...

  Token tax  5,758 tokens per turn  3% of your window
  On use     192,446 tokens if every extension fires
  Verdict    A
```

**Token tax** is what you pay on every request, because skill names and
descriptions stay resident. **On use** is what arrives if every skill fires in
one session.

Reads Claude Code skills and plugins, and MCP servers configured for Claude
Code, Claude Desktop, and Cursor.

## Principles

- **No network.** Zero calls in the default path, enforced by a test.
- **No account, no telemetry.** Credential values in your config are never read,
  stored, or rendered.
- **Cross-platform.** macOS, Linux, Windows. No native compilation.

## Status

The cost pillar ships today. Safety and quality analysis, plus `cupel lock` and
`cupel diff` for catching rug pulls, are in progress.

Full documentation, evidence, and the contribution guide:
**https://github.com/mihhhir08/cupel**

Apache-2.0
