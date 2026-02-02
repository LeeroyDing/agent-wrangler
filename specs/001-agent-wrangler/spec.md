# Feature Specification: Agent Wrangler

**Feature Branch**: `001-agent-wrangler`  
**Created**: 2026-02-02  
**Status**: Draft  
**Input**: User description: "Build Agent Wrangler. It should use Agent Client Protocol, so it should spawn new processes and communicate with them using stdio. It should also have a "logs" view for each agent. Each agent would be in a list on the left sidebar, with a "traffic light" status signal to indicate whether it has an error, running, or waiting for user input. In the main detail view for the selected agent there should just be a view into stdout and stderr, with a text box to send text into stdin. When creating a new agent, the user should be asked for 1) display name, 2) working directory, 3) command to start agent. The web app should also remember the last command used in memory, so it's easy to start a bigger number of agents."

## Clarifications

### Session 2026-02-02
- Q: How should log retention be handled for verbose agents? → A: Use a ring buffer (limit to last 1000 lines).
- Q: Should raw ACP protocol messages be visible in the user's log view? → A: Filter and hide ACP lines from the logs; use them only for internal status updates.
- Q: Should the stdin input box be always enabled or only when waiting for input? → A: Contextual Enable; the input box is only active when the agent status is "Waiting for Input" (Yellow).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Start Agent (Priority: P1)

The user wants to start a new agent process by specifying its configuration so they can run automation tasks.

**Why this priority**: Core functionality. Without creating agents, the system has no utility.

**Independent Test**: Can be tested by filling the "New Agent" form and verifying a process is spawned on the host system.

**Acceptance Scenarios**:

1. **Given** the application is open, **When** the user clicks "New Agent", **Then** a form requests Display Name, Working Directory, and Command.
2. **Given** the form is filled, **When** the user submits, **Then** a new process spawns, and the agent appears in the sidebar list.
3. **Given** a previously created agent, **When** opening the "New Agent" form, **Then** the "Command" field defaults to the last used command (for this session).

---

### User Story 2 - Monitor Agent Status & Output (Priority: P1)

The user needs to see the agent's running state and log output to understand what it is doing.

**Why this priority**: Visibility is essential for "wrangling" agents.

**Independent Test**: Can be tested by running a script that prints to stdout/stderr and exits with different codes, verifying UI updates.

**Acceptance Scenarios**:

1. **Given** a running agent, **When** selected in the sidebar, **Then** the main view displays a live stream of its stdout and stderr.
2. **Given** a running agent, **When** observing the sidebar, **Then** a "Green" traffic light indicator is visible.
3. **Given** an agent that exited with an error (non-zero code), **When** observed, **Then** the indicator is "Red".
4. **Given** an agent waiting for input (as signaled by an explicit Agent Client Protocol message), **When** observed, **Then** the indicator is "Yellow".

---

### User Story 3 - Interact via Stdin (Priority: P2)

The user needs to send text commands or responses to the agent.

**Why this priority**: Required for interactive agents, though some agents may be non-interactive (P1 vs P2 borderline, kept P2 as read-only viewing is more critical).

**Independent Test**: Run a script that reads from stdin and echoes it; verify sending text results in the echo appearing in logs.

**Acceptance Scenarios**:

1. **Given** a running agent in "Waiting for Input" status, **When** the user types in the input box and hits Send/Enter, **Then** the text is written to the agent process's standard input.
2. **Given** an agent in "Running" status (not waiting for input), **When** the user views the agent detail, **Then** the stdin input box is disabled.

### Edge Cases

- What happens when the Working Directory does not exist? (Expect error on creation).
- What happens if the Command is invalid? (Expect immediate "Red" error state).
- What happens if the browser tab is closed? (Agents are session-bound and all child processes MUST be terminated when the UI session ends).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to spawn new local processes.
- **FR-002**: System MUST capture and display `stdout` and `stderr` for each agent process in real-time.
- **FR-003**: System MUST allow sending text input to an agent's `stdin`.
- **FR-004**: System MUST display a list of all managed agents.
- **FR-005**: System MUST indicate agent status: Running (Green), Error/Stopped (Red), Waiting for Input (Yellow).
- **FR-006**: System MUST persist the last entered "Command" string in memory for the duration of the session to facilitate creating multiple agents.
- **FR-007**: System MUST validate input fields (Name required, Directory valid path, Command required).
- **FR-008**: System MUST implement log retention using a ring buffer, keeping only the most recent 1000 lines per agent.
- **FR-009**: System MUST filter and hide lines starting with the ACP prefix from the user-facing log view, processing them only for status/state changes.
- **FR-010**: System MUST only enable the `stdin` input UI for an agent when its status is "Waiting for Input" (Yellow).

### Key Entities

- **Agent**: Represents a managed process. Attributes: ID, Name, Working Directory, Command, Status, PID.
- **LogStream**: The history of stdout/stderr events for an agent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can spawn a valid agent process in under 15 seconds (UI interaction time).
- **SC-002**: Logs appear in the UI within <500ms of being emitted by the process.
- **SC-003**: Status indicator updates within <1s of state change (e.g., process exit).
- **SC-004**: System successfully handles 10 concurrent agents without UI degradation.