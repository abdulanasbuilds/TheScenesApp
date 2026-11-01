# The Scenes — Universal Agent Prompt Template

Paste this template into any coding agent. The agent must still read `AGENTS.md` first when repository access is available.

## Prompt

### CONTEXT

You are working on **The Scenes**, an African-first, globally expandable platform for learning, teaching, communities, discovery, and creator-led education.

AI is a flagship category, not the whole company.

The product may use Skool/Circle/Kajabi as references for proven patterns, but it is not a one-to-one clone.

### OBJECTIVE

[Describe the exact outcome.]

### CURRENT PHASE

[State the phase from `docs/PHASES.md`.]

### IN-SCOPE

- [file/feature/task]
- [file/feature/task]

### OUT-OF-SCOPE

- production auth/database if frontend gate is not passed;
- payments unless explicitly approved;
- unrelated future phases;
- destructive migrations;
- provider changes not required by the task.

### EXISTING FILES

Inspect these before editing:

- [paths]

### DESIGN REQUIREMENTS

Follow `docs/DESIGN-FIRST.md`.

Create variants when a meaningful visual/product choice exists. Use realistic deterministic fixtures for frontend-only work.

### DATA

[Describe relevant fixture/domain data.]

### SECURITY

Follow `docs/SECURITY-RULES.md`.

Never:

- hardcode secrets;
- bypass authorization;
- trust client-only permissions;
- store raw provider credentials in normal database rows;
- weaken a security boundary to make a demo work.

### INTEGRATIONS

Follow `docs/INTEGRATIONS.md`.

Use provider adapters.

Provider behavior must be verified against current official documentation before implementation.

### TOOLS / SKILLS

Use the actually available:

- product/research skills;
- design/frontend skills;
- implementation skills;
- security skills;
- QA/browser skills;
- repository/Git tooling;
- CLI;
- approved MCPs.

Do not claim a capability exists without detecting it.

### IMPLEMENTATION

1. Inspect current implementation.
2. Confirm phase boundary.
3. Implement the smallest correct slice.
4. Preserve existing architecture unless a change is explicitly required.
5. Keep future integrations behind interfaces.
6. Verify behavior.

### ACCEPTANCE CRITERIA

- [criterion]
- [criterion]
- [criterion]

### VERIFICATION

Run the relevant commands, such as:

- `bun run lint`
- `bunx tsc --noEmit`
- `bun run build`
- browser/visual checks when UI changes.

Do not claim a check passed unless it actually ran.

### HANDOFF

Report:

- what changed;
- files changed;
- what was verified;
- known limitations;
- next recommended phase/task.
