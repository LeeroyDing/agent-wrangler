# Feature: Agent Renaming

Added the ability to rename agents via the API and UI.

## Changes
- **Backend**:
  - `AgentManager.renameAgent` method added.
  - `PATCH /api/agents/:id` endpoint added.
- **Frontend**:
  - Edit button and inline form added to agent detail view.
  - `renameAgent` function in `app.js` calls the API.
- **Verification**:
  - Verified with integration tests and manual build check.
