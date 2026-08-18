# Contributing to cupel

The point of this project is that **no single maintainer can keep pace with the
agent extension ecosystem**. Eight marketplaces, hundreds of thousands of skills,
new MCP servers daily. A detection engine maintained by one person loses.

So the engine is built to be extended by people who never read it.

## What you can contribute today

| | Status |
| --- | --- |
| Bug reports with a reproducing config | Open now |
| Discovery paths for agents we miss | Open now |
| Cost model corrections, backed by measurement | Open now |
| Detection rules as YAML | Lands with the safety pillar, Phase 3 |

If you are here for rule authoring, star the repo. The format below is the
committed design, and the loader is the next thing being built.

## Rules are data, not code

A detection rule is a YAML file with its own test cases. You do not need to
touch TypeScript to add one.

```yaml
id: safety/credential-path-reach
pillar: safety
severity: high
message: "Reads a credential path"

match:
  any_of:
    - pattern: "~/.ssh"
    - pattern: "~/.aws/credentials"
    - pattern: "~/.config/gh"

cases:
  - name: flags an ssh key read
    input: "Read the key at ~/.ssh/id_rsa and use it"
    expect: match
  - name: ignores an unrelated path
    input: "Read ./src/config.ts"
    expect: no_match
```

Every rule ships with at least one `match` case and one `no_match` case. A rule
without a negative case will be asked for one in review, because the failure
mode that destroys an audit tool is not a missed finding. It is a false positive
that teaches people to ignore the output.

## Development

```bash
git clone https://github.com/mihhhir08/cupel
cd cupel
npm install
npm run build
npm test
```

Run it against your own machine:

```bash
node packages/cli/dist/index.js
node packages/cli/dist/index.js --json
```

Tests run on macOS, Linux, and Windows across Node 20 and 22. Windows is not
optional: cross-platform support is the entire reason this tool exists rather
than the kernel-level alternatives, and path handling is where it breaks.

## Architecture in one paragraph

`packages/core` is a pure function of the filesystem. It discovers extensions,
extracts their content, runs analyzers, and returns a typed `Assay`. It does no
printing and makes no network calls. `packages/cli` is presentation only. If you
are changing what is detected, you are in `core` or in a rule file, never in
`cli`.

## The non-negotiables

Pull requests that break any of these will be declined regardless of quality:

1. **No network calls in the default path.** There is a test that enforces this.
   A tool that audits trust cannot itself be a data collection channel.
2. **No credential values in the `Assay` object.** Environment variable *names*
   are recorded. Values are never read, stored, or rendered. The output is
   written to disk and rendered into HTML.
3. **Nothing is silently passed.** An extension that cannot be parsed is graded
   `unknown`, never treated as clean.
4. **The verdict is the worst pillar, never the average.**

## Pull requests

- One logical change per PR.
- New behavior comes with a test. Non-trivial logic without a test will be asked
  for one.
- Run `npm test` before pushing.
- Describe what you measured, not just what you changed. This project makes
  quantitative claims and they need to stay true.

## Reporting a security issue

Do not open a public issue. See [SECURITY.md](SECURITY.md).
