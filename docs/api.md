# Agent Wrangler API

## Agents

### Create Agent
**POST** `/api/agents`

Creates and immediately starts a new agent process.

**Request Body**:
```json
{
  "name": "My Agent",
  "command": "python script.py",
  "working_directory": "/path/to/cwd"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "name": "My Agent",
  "status": "running",
  "pid": 1234,
  ...
}
```

### List Agents
**GET** `/api/agents`

Returns a list of all managed agents.

**Response**: `200 OK`
```json
[
  { "id": "...", "name": "...", ... }
]
```
