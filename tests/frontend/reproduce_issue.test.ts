import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const fetchMock = vi.fn();
global.fetch = fetchMock;

class EventSourceMock {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  listeners: Record<string, Function[]> = {};

  constructor(public url: string) {}

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  close() {}

  // Helper to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(data) });
    }
  }
}
global.EventSource = EventSourceMock as any;

describe('Bug Reproduction: Logs and Input', () => {
  let dom: JSDOM;
  let window: any;
  let document: any;
  let eventSourceInstance: EventSourceMock | null = null;

  beforeEach(async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => []
    });

    // Capture the instance so we can interact with it in tests
    global.EventSource = class extends EventSourceMock {
        constructor(url: string) {
            super(url);
            eventSourceInstance = this;
        }
    } as any;

    const html = fs.readFileSync(path.resolve(__dirname, '../../src/web/index.html'), 'utf-8');
    dom = new JSDOM(html, {
      url: 'http://localhost:3000',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    window = dom.window;
    document = window.document;
    
    window.fetch = fetchMock;
    window.alert = vi.fn();

    global.window = window;
    global.document = document;
    
    // Load app
    // const appModule = await import('../../src/web/app.js');
    // appModule.initApp();
    // await new Promise(r => setTimeout(r, 0));
  });

  it('should display logs when agent is selected and logs are streamed', async () => {
    const agent = { id: '123', name: 'Test Agent', status: 'running' };
    
    // Mock fetchAgents to return our agent
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [agent]
    });

    const appModule = await import('../../src/web/app.js');
    appModule.initApp();
    await new Promise(r => setTimeout(r, 0));

    // Verify list is rendered
    const list = document.getElementById('agent-list');
    expect(list.children.length).toBe(1);
    
    // Click the agent
    const item = list.children[0];
    item.click();
    
    // Verify SSE connection established
    expect(eventSourceInstance).toBeTruthy();
    expect(eventSourceInstance!.url).toContain('stream/logs/123');

    // Simulate incoming log
    const logData = { source: 'stdout', content: 'Hello World' };
    eventSourceInstance!.simulateMessage(logData);

    // Assert log is in the DOM
    const logsOutput = document.getElementById('logs-output');
    expect(logsOutput.textContent).toContain('Hello World');
    expect(logsOutput.children.length).toBe(1);
    expect(logsOutput.children[0].className).toBe('log-stdout');
    
    const input = document.getElementById('stdin-input');
    expect(input.disabled).toBe(false);
  });

  it('should populate debug textareas when logs arrive', async () => {
    const agent = { id: 'debug-agent', name: 'Debug Agent', status: 'running' };
    
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [agent]
    });

    const appModule = await import('../../src/web/app.js');
    appModule.initApp();
    await new Promise(r => setTimeout(r, 0));

    // Select agent
    const list = document.getElementById('agent-list');
    list.children[0].click();
    
    // Simulate logs
    eventSourceInstance!.simulateMessage({ source: 'stdout', content: 'Standard Output' });
    eventSourceInstance!.simulateMessage({ source: 'stderr', content: 'Error Output' });

    // Check debug areas (assuming IDs debug-stdout and debug-stderr)
    const debugStdout = document.getElementById('debug-stdout') as HTMLTextAreaElement;
    const debugStderr = document.getElementById('debug-stderr') as HTMLTextAreaElement;

    // The fields might not exist yet if I haven't implemented them, so this test will fail (TDD)
    expect(debugStdout).toBeTruthy();
    expect(debugStderr).toBeTruthy();
    
    expect(debugStdout.value).toContain('Standard Output');
    expect(debugStderr.value).toContain('Error Output');
  });

  it('should render session/update content as logs', async () => {
    const agent = { id: 'acp-agent', name: 'ACP Agent', status: 'running' };
    
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [agent]
    });

    const appModule = await import('../../src/web/app.js');
    appModule.initApp();
    await new Promise(r => setTimeout(r, 0));

    const list = document.getElementById('agent-list');
    list.children[0].click();

    // Simulate session/update notification (as it would be emitted by logEvents in server)
    // Actually the server emits it as a 'log' event to the SSE.
    // server.ts logic: 
    // const entry = agent.addLog(content.text, 'stdout');
    // logEvents.emit(`logs-${agent.data.id}`, entry);
    // So the frontend receives it as a standard log message via SSE.
    
    eventSourceInstance!.simulateMessage({ source: 'stdout', content: 'Streaming output chunk' });

    const logsOutput = document.getElementById('logs-output');
    expect(logsOutput.textContent).toContain('Streaming output chunk');
  });
});
