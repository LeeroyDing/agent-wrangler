# Research & Decisions

**Feature**: Agent Wrangler
**Date**: 2026-02-02

## Research Questions

### 1. Agent Client Protocol (ACP) Implementation
**Question**: How does the agent communicate status (like "waiting for input") to the host via stdio?
**Decision**: Use the official **Agent Client Protocol (ACP)** via the `@agentclientprotocol/sdk` npm package.
**Specification**:
- Follow the standard ACP lifecycle: `initialize`, `create_session`, `prompt`, `streaming updates`.
- Use the SDK's built-in models.
- Rationale: Interoperability with standard-compliant agents. Leverage proven SDK.

### 2. Real-time Log Streaming Strategy
**Question**: How to stream logs from Express to the browser?
**Options**:
- A. Polling.
- B. Server-Sent Events (SSE).
- C. WebSockets.
**Decision**: **Server-Sent Events (SSE)**.
**Rationale**: Native support in Express (res.write, keep-alive) and Browser (EventSource). Simple unidirectional flow.

### 3. Subprocess I/O Management
**Question**: How to read stdout/stderr in Node.js?
**Decision**: Node.js Child Process Streams.
**Implementation**:
- `spawn()` returns streams.
- Listen to `data` events on `stdout` and `stderr`.
- Push chunks to the SSE stream/manager.
- Rationale: Standard Node.js non-blocking I/O.

## Technology Stack Confirmation

- **Backend**: Node.js, TypeScript, Express.
- **Frontend**: Vanilla JS (ES6 Modules), CSS3.
- **Communication**: REST API for actions, SSE for logs.
- **Protocol**: `@agentclientprotocol/sdk` (ACP).