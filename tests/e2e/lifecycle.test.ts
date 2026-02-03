import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}/api`;

function waitForServer(port: number, timeout = 10000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = new net.Socket();
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for server on port ${port}`));
        } else {
          setTimeout(check, 100);
        }
      });
      socket.connect(port, '127.0.0.1');
    };
    check();
  });
}

describe('End-to-End System Lifecycle', () => {
  let server: ChildProcess;

  beforeAll(async () => {
    server = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: PORT.toString() },
      stdio: 'pipe',
      detached: true,
    });

    try {
      await waitForServer(PORT);
    } catch (e) {
      if (server.pid) process.kill(-server.pid);
      throw e;
    }
  }, 15000);

  afterAll(() => {
    if (server && server.pid) {
      try {
        process.kill(-server.pid);
      } catch (e) {}
    }
  });

  it('should list agents (initially empty)', async () => {
    const res = await fetch(`${BASE_URL}/agents`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should create an agent and run a command', async () => {
    const res = await fetch(`${BASE_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Agent',
        command: 'echo "E2E Test Output"',
        working_directory: '.',
      }),
    });

    expect(res.status).toBe(201);
    const agent = await res.json();

    let complete = false;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 200));
        const check = await fetch(`${BASE_URL}/agents/${agent.id}`);
        const updated = await check.json();
        if (updated.status === 'stopped') {
            complete = true;
            break;
        }
    }
    expect(complete).toBe(true);
  });

  it('should support ACP interaction loop', async () => {
    const cmd = `echo 'ACP: {"type": "status", "status": "waiting_input"}' && read line && echo "GOT: $line"`;
    
    const createRes = await fetch(`${BASE_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'ACP Interactive Agent',
        command: cmd,
        working_directory: '.',
      }),
    });
    const agent = await createRes.json();

    let ready = false;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        const check = await fetch(`${BASE_URL}/agents/${agent.id}`);
        const updated = await check.json();
        if (updated.status === 'waiting_input') {
            ready = true;
            break;
        }
    }
    expect(ready).toBe(true);

    const stdinRes = await fetch(`${BASE_URL}/agents/${agent.id}/stdin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: 'secret-code' })
    });
    expect(stdinRes.status).toBe(204);

    let finished = false;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 200));
        const check = await fetch(`${BASE_URL}/agents/${agent.id}`);
        const updated = await check.json();
        if (updated.status === 'stopped') {
            finished = true;
            break;
        }
    }
    expect(finished).toBe(true);
  });
});