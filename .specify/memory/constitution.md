<!--
SYNC IMPACT REPORT
Version Change: 0.0.0 -> 1.0.0
Modified Principles:
- Added: Functional Purity (D)
- Added: Test-Driven Development (E)
- Added: Integration Testing Mandatory (F)
- Added: 100% Test Coverage (G)
- Added: Documentation-Driven (H)
- Added: Conventional Commits & SemVer (I)
- Added: Observability First (K)
- Added: Strict Typing (L)
- Added: Zero-Dependency (N)
- Added: YAGNI (O)
- Added: Boring Technology (P)
Templates Requiring Updates:
- .specify/templates/plan-template.md: ⚠ (Needs Constitution Check update)
- .specify/templates/spec-template.md: ⚠ (Needs verification)
- .specify/templates/tasks-template.md: ⚠ (Needs task categories for TDD/Docs)
-->
# Agent Wrangler Constitution

## Core Principles

### I. Functional Purity
Prefer pure functions and immutability. Side effects must be isolated to the edges of the system (e.g., I/O, API calls). State mutations should be avoided unless strictly necessary for performance within isolated scopes.

### II. Test-Driven Development (TDD)
Tests must be written *before* the implementation. The "Red-Green-Refactor" cycle is mandatory for all logic changes. No code is written without a failing test case defining its expected behavior.

### III. Integration Testing Mandatory
Unit tests are insufficient. Features must include end-to-end or integration tests that verify real-world usage and contract adherence between components.

### IV. 100% Test Coverage
Code coverage must remain at 100% (or strict high threshold >95%) for the main branch. Any drop in coverage is a build failure. Untested code is technical debt by definition.

### V. Documentation-Driven
Write the user guide, README, or technical spec *before* writing the code. If a feature isn't documented, it doesn't exist. Documentation is the primary interface for understanding the system.

### VI. Conventional Commits & SemVer
Strict adherence to Semantic Versioning (MAJOR.MINOR.PATCH). Commit messages must follow the Conventional Commits specification (e.g., `feat:`, `fix:`, `chore:`) to enable automated changelog generation and versioning.

### VII. Observability First
Every feature must emit structured logs and/or metrics. Debugging in production should not require new code deployment. The system's internal state must be inferable from its outputs.

### VIII. Strict Typing
No `any`, implicit casting, or loose typing allowed. Compile-time safety is prioritized. All types must be explicitly defined or strictly inferred by the compiler.

### IX. Zero-Dependency Preference
Avoid adding external dependencies unless absolutely necessary. Prefer standard library solutions to reduce bloat, maintenance burden, and supply chain risk.

### X. YAGNI (You Aren't Gonna Need It)
Do not build for the future. Implement only what is required for the current specification. speculative generality is a violation of this constitution.

### XI. Boring Technology
Choose established, stable technologies over the "new and shiny." Stability and long-term maintainability outweigh novelty.

## Operational Constraints

### Security & Privacy
- **Secure Defaults**: All configurations must default to the most secure setting.
- **Data Minimization**: Collect only strictly necessary data.

### Performance
- **Sync over Async**: Prefer synchronous code for simplicity unless I/O bound or explicitly required by performance constraints.

## Governance

### Amendments
This Constitution supersedes all other project practices. Amendments require:
1.  A pull request explicitly proposing the change.
2.  Updates to all dependent templates (plans, specs, tasks).
3.  A version bump of this document.

### Compliance
- All Pull Requests must verify compliance with these principles.
- Code reviews must explicitly check for violations (e.g., "Is this impure function necessary?", "Where is the documentation for this new feature?").

**Version**: 1.0.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-02