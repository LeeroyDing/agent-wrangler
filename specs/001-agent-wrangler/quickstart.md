# Agent Wrangler Quickstart

Agent Wrangler is a local web-based process manager supporting the **Agent Client Protocol (ACP)**.

## Prerequisites
- **Node.js**: v20 or newer
- **npm**: (included with Node.js)

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm run dev
   ```
   The application will be available at **`http://localhost:3001`**.

## Using the Application

### 1. Creating Agents
- Click **"New Agent"** in the sidebar.
- Provide a Display Name, Working Directory, and a Shell Command.
- The "Command" will be remembered across agent creations in the same session.

### 2. Monitoring
- Select an agent from the sidebar.
- Observe the **Traffic Light** indicator:
    - 🟢 **Green**: Process is running.
    - 🔴 **Red**: Process exited with an error.
    - ⚪ **Gray**: Process finished successfully.
    - 🟡 **Yellow**: Process is waiting for input (via ACP).
- View live logs (stdout/stderr) in the console view. Logs are limited to the most recent 1000 lines.

### 3. Interaction
- If an agent is in the **Waiting for Input** (Yellow) state, the text box at the bottom will enable.
- Type your message and hit **Enter** or click **Send** to write to the process's `stdin`.

## Protocol Integration (ACP)

Agents can communicate status to the Wrangler by printing specific JSON lines to `stdout`:

```text
ACP: {"type": "status", "status": "waiting_input"}
```

Available statuses: `running`, `waiting_input`, `stopped`, `error`.

## Development

- **Run Tests**: `npm test`
- **Build**: `npm run build` (if configured)