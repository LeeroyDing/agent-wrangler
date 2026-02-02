# Tasks: Agent Wrangler

**Input**: Design documents from `/specs/001-agent-wrangler/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: MANDATORY. This project follows strict TDD. Tests must be written and fail before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- `src/`: Backend source
- `src/web/`: Frontend source
- `tests/`: Test files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Node.js project (`package.json`) and gitignore
- [x] T002 Install dependencies (`express`, `@agentclientprotocol/sdk`, `zod`) and dev dependencies (`typescript`, `vitest`, `ts-node`, `@types/node`, `@types/express`)
- [x] T003 [P] Initialize TypeScript configuration (`tsconfig.json`) with `strict: true`
- [x] T004 [P] Create project directory structure (`src/domain`, `src/infrastructure`, `src/web`, `tests/unit`, `tests/integration`)
- [x] T005 [P] Setup Vitest configuration (`vitest.config.ts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create Agent entity definition in `src/domain/agent.ts` (Data Model)
- [x] T007 Create AgentManager interface in `src/domain/agentManager.ts` (In-memory store)
- [x] T008 Setup basic Express server structure in `src/infrastructure/server.ts`
- [x] T009 Define API routes structure in `src/infrastructure/server.ts` matching `contracts/openapi.yaml`
- [x] T010 [P] Create Process wrapper abstraction in `src/infrastructure/process.ts` (handling spawn/streams)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Start Agent (Priority: P1) 🎯 MVP

**Goal**: Spawn a new agent process via UI/API

**Independent Test**: POST /api/agents creates a process and returns 201; GET /api/agents lists it.

### Tests for User Story 1 (MANDATORY per Constitution) 🛑

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (TDD)**

- [x] T011 [P] [US1] Create unit tests for AgentManager (create/list) in `tests/unit/agentManager.test.ts`
- [x] T012 [P] [US1] Create integration test for POST /api/agents in `tests/integration/serverFlow.test.ts`

### Documentation for User Story 1 (MANDATORY per Constitution) 📝

- [x] T013 [P] [US1] Document API usage for agent creation in `docs/api.md` (or inline comments)

### Implementation for User Story 1

- [x] T014 [US1] Implement AgentManager create/list logic in `src/domain/agentManager.ts`
- [x] T015 [US1] Implement Process spawning logic in `src/infrastructure/process.ts`
- [x] T016 [US1] Implement POST /api/agents endpoint in `src/infrastructure/server.ts`
- [x] T017 [US1] Implement GET /api/agents endpoint in `src/infrastructure/server.ts`
- [x] T018 [US1] Create basic HTML structure with "New Agent" form in `src/web/index.html`
- [x] T019 [US1] Implement frontend logic to submit form and update list in `src/web/app.js`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Monitor Agent Status & Output (Priority: P1)

**Goal**: View real-time logs and status (Green/Red/Yellow) via SSE and ACP

**Independent Test**: Connect to SSE stream, verify log chunks arrive; verify status updates via API/SSE.

### Tests for User Story 2 (MANDATORY per Constitution) 🛑

- [ ] T020 [P] [US2] Create unit tests for LogStream buffering (ring buffer) in `tests/unit/agent.test.ts`
- [ ] T021 [P] [US2] Create integration test for SSE endpoint (`/stream/logs/:id`) in `tests/integration/serverFlow.test.ts`

### Documentation for User Story 2 (MANDATORY per Constitution) 📝

- [ ] T022 [P] [US2] Document SSE endpoint behavior

### Implementation for User Story 2

- [ ] T023 [US2] Implement Ring Buffer log storage in `src/domain/agent.ts`
- [ ] T024 [US2] Implement SSE endpoint `/stream/logs/:id` in `src/infrastructure/server.ts`
- [ ] T025 [US2] Integrate ACP SDK to parse stdout for status updates in `src/infrastructure/process.ts`
- [ ] T026 [US2] Implement ACP message filtering (hide raw ACP lines) in `src/infrastructure/process.ts`
- [ ] T027 [US2] Implement frontend SSE listener and log display in `src/web/app.js`
- [ ] T028 [US2] Implement frontend status indicator (Traffic Light) logic in `src/web/app.js`
- [ ] T029 [P] [US2] Style log view and status indicators in `src/web/style.css`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Interact via Stdin (Priority: P2)

**Goal**: Send input to agent when requested (Yellow status)

**Independent Test**: POST to /api/agents/:id/stdin writes to process stdin; Input box enables only on Yellow status.

### Tests for User Story 3 (MANDATORY per Constitution) 🛑

- [ ] T030 [P] [US3] Create integration test for POST /api/agents/:id/stdin in `tests/integration/serverFlow.test.ts`

### Documentation for User Story 3 (MANDATORY per Constitution) 📝

- [ ] T031 [P] [US3] Document stdin endpoint

### Implementation for User Story 3

- [ ] T032 [US3] Implement write-to-stdin logic in `src/infrastructure/process.ts`
- [ ] T033 [US3] Implement POST /api/agents/:id/stdin endpoint in `src/infrastructure/server.ts`
- [ ] T034 [US3] Add Input Box to frontend agent detail view in `src/web/index.html`
- [ ] T035 [US3] Implement frontend logic to enable/disable input based on status in `src/web/app.js`
- [ ] T036 [US3] Implement frontend logic to send input on Enter in `src/web/app.js`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T037 [P] Implement "Last Command" persistence (sessionStorage or server-side session) in `src/web/app.js`
- [ ] T038 Review and refine UI styling in `src/web/style.css`
- [ ] T039 Ensure error handling for invalid commands/paths is robust in `src/infrastructure/server.ts`
- [ ] T040 Final integration test run `npm test`
- [ ] T041 Update `quickstart.md` with final instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Foundational
- **User Story 2 (P1)**: Depends on Agent creation (US1) logic being present in backend, but implementation can be parallel
- **User Story 3 (P2)**: Depends on Agent creation (US1) and Status monitoring (US2) for the "Contextual Enable" logic

### Within Each User Story

- Tests (TDD) → Models → Services → Endpoints → Frontend