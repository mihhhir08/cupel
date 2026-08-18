# Security

cupel is a tool for auditing untrusted content. That makes its own threat model
worth stating plainly.

## Reporting a vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/mihhhir08/cupel/security/advisories/new).

Do not open a public issue for a vulnerability. Expect an acknowledgement within
72 hours.

## Threat model

cupel parses files written by people you have not vetted. Skill bodies, tool
descriptions, and MCP configuration are all attacker-controlled in the scenario
this tool exists for.

**What cupel does**

- Reads files. It does not execute skills.
- Records environment variable *names* from MCP configuration. It never reads
  or stores their values, because those files hold live credentials and the
  output is written to disk and rendered into HTML.
- Makes zero network calls in the default path. This is enforced by a test, not
  by convention.
- Grades an unparseable extension as `unknown`. It never silently treats it as
  clean.

**What cupel deliberately does not do yet**

- It does not spawn MCP servers by default. A future `--probe` flag will start a
  server as a subprocess to enumerate its tools. That flag will be opt-in and
  will never invoke a tool, because spawning an unvetted server is precisely the
  risk this tool warns about. Defaulting to it would make cupel an attack vector
  for the thing it detects.
- It does not enforce anything at runtime. Detection is not containment, and the
  README is explicit about that limit.

## Known limits

Static analysis of adversarial content is not a solved problem. Published
detection rates for sophisticated prompt injection sit near 23%. A clean cupel
report means no rule matched. It does not mean an extension is safe.

Treat the output as evidence, not as a guarantee.

## Scope

In scope: the CLI, the core library, the rule engine, and anything that could
cause cupel to leak credentials, execute attacker-controlled code, or report a
malicious extension as clean.

Out of scope: vulnerabilities in the skills and MCP servers cupel inspects.
Report those to their authors.
