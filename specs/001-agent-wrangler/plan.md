# Implementation Plan: Agent Wrangler

**Branch**: `001-agent-wrangler` | **Date**: 2026-02-02 | **Spec**: [specs/001-agent-wrangler/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-agent-wrangler/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build "Agent Wrangler," a local web-based process manager using TypeScript (Node.js) and vanilla HTML/JS. It allows spawning processes, monitoring stdout/stderr, and sending stdin input. The system manages agents via an Express.js server and leverages the official Agent Client Protocol (ACP) for standardized agent communication.

## Technical Context

**Language/Version**: TypeScript 5.x (Backend), HTML5/CSS3/ES6 (Frontend)
**Primary Dependencies**: `express` (Web Server), `@agentclientprotocol/sdk` (ACP Protocol), `zod` (Validation).
**Storage**: In-memory (Session-bound per Spec).
**Testing**: `vitest` or `jest` (TDD).
**Target Platform**: Linux (Development environment).
**Project Type**: Web Application (Localhost).
**Performance Goals**: UI updates <500ms, Spawn <15s.
**Constraints**: Minimal dependencies.
**Scale/Scope**: Single user, ~10 concurrent agents.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Functional Purity**: Agent management logic (state changes) isolated from I/O (subprocess calls).
- [x] **TDD**: Tests will be written using `vitest` before implementation.
- [x] **Integration Tests**: E2E tests via API calls.
- [x] **100% Coverage**: All logic branches will be tested.
- [x] **Documentation**: `quickstart.md` and inline docstrings planned.
- [x] **Strict Typing**: TypeScript `strict: true`.
- [x] **Zero-Dependency**: Justified dependencies: Express (Standard Web Server), ACP SDK (Protocol).
- [x] **Observability**: Structured logging to stdout/stderr for the wrangler itself.

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-wrangler/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── agent.ts         # Agent entity and logic
│   └── agentManager.ts  # In-memory collection management
├── infrastructure/
│   ├── server.ts        # Express Server implementation
│   └── process.ts       # Subprocess wrapping and I/O handling
└── web/
    ├── index.html       # Single Page App
    ├── style.css        # Styles
    └── app.js           # Frontend logic

tests/
├── unit/
│   ├── agent.test.ts
│   └── agentManager.test.ts
└── integration/
    └── serverFlow.test.ts
```

**Structure Decision**: Clean Architecture. `domain` contains pure logic. `infrastructure` handles I/O (web/process). `web` contains static assets served by Express static middleware.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Express Dependency | Standard robust web server for Node. | `http` module too low-level for routing/SSE needs. |
