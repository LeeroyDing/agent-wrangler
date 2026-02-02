# Data Model

## Entities

### Agent
Represents a managed child process.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (string) | Unique identifier. |
| `name` | String | Display name. |
| `command` | String | Shell command to execute. |
| `working_directory` | String | Absolute path to execution context. |
| `status` | Enum | `running`, `error` (exit code != 0), `stopped` (exit code 0), `waiting_input`. |
| `pid` | Integer | OS Process ID (None if stopped). |
| `exit_code` | Integer | Exit code (None if running). |
| `created_at` | Date | Creation time. |

### LogEntry
A single line of output.

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | Date | When the line was captured. |
| `source` | Enum | `stdout` or `stderr`. |
| `content` | String | The text content. |

## Storage
**Type**: In-Memory Map.
**Structure**:
```typescript
const agents = new Map<string, Agent>();
```
**Persistence**: None (per spec).