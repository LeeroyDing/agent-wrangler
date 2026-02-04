# agent-wrangler Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-02

## Active Technologies
- TypeScript 5.x (Backend), HTML5/CSS3/ES6 (Frontend) + `express` (Web Server), `@agentclientprotocol/sdk` (ACP Protocol), `ws` (WebSockets/SSE - implied or standard), `zod` (Validation). (001-agent-wrangler)
- In-memory (Session-bound per Spec). (001-agent-wrangler)

- Python 3.12 (Backend), HTML5/CSS3/ES6 (Frontend) + None (Standard Library only per "Zero-Dependency" principle) - `http.server`, `subprocess`, `threading`, `json`. (001-agent-wrangler)

## Project Structure

```text
src/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

Python 3.12 (Backend), HTML5/CSS3/ES6 (Frontend): Follow standard conventions

## Recent Changes
- 001-agent-wrangler: Added TypeScript 5.x (Backend), HTML5/CSS3/ES6 (Frontend) + `express` (Web Server), `@agentclientprotocol/sdk` (ACP Protocol), `ws` (WebSockets/SSE - implied or standard), `zod` (Validation).
- 001-agent-wrangler: Added TypeScript 5.x (Backend), HTML5/CSS3/ES6 (Frontend) + `express` (Web Server), `@agentclientprotocol/sdk` (ACP Protocol), `ws` (WebSockets/SSE - implied or standard), `zod` (Validation).

- 001-agent-wrangler: Added Python 3.12 (Backend), HTML5/CSS3/ES6 (Frontend) + None (Standard Library only per "Zero-Dependency" principle) - `http.server`, `subprocess`, `threading`, `json`.
- Updated status indicator logic: Green for "waiting_input" (idle), Amber for "running". Updated server to handle `stopReason` for accurate status transitions.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
