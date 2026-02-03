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

  emitMessage(data: any) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb({ data }));
    }
  }
}
global.EventSource = EventSourceMock as any;

const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => store[key] = value.toString(),
        clear: () => store = {},
        removeItem: (key: string) => delete store[key],
        key: (index: number) => Object.keys(store)[index],
        length: 0
    };
})();
// @ts-ignore
global.sessionStorage = sessionStorageMock;

describe('Frontend App', () => {
  let dom: JSDOM;
  let window: any;
  let document: any;

  beforeEach(async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => []
    });
    sessionStorageMock.clear();

    const html = fs.readFileSync(path.resolve(__dirname, '../../src/web/index.html'), 'utf-8');
    dom = new JSDOM(html, {
      url: 'http://localhost:3000',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    window = dom.window;
    document = window.document;
    
    window.fetch = fetchMock;
    window.EventSource = EventSourceMock;
    
    Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock,
        writable: true
    });
    window.alert = vi.fn();

    global.window = window;
    global.document = document;
    
    const appModule = await import('../../src/web/app.js');
    appModule.initApp();
    
    await new Promise(r => setTimeout(r, 0));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and render agents on load', async () => {
    expect(fetchMock).toHaveBeenCalledWith('api/agents');
  });

  it('should switch to create form when New Agent clicked', () => {
    const btn = document.getElementById('btn-new-agent');
    btn.click();
    
    expect(document.getElementById('new-agent-form').style.display).toBe('block');
    expect(document.getElementById('agent-detail').style.display).toBe('none');
  });

  it('should create agent and update list', async () => {
    const newAgent = { id: '2', name: 'New Agent', status: 'stopped' };
    
    fetchMock
        .mockResolvedValueOnce({
            ok: true,
            json: async () => newAgent
        })
        .mockResolvedValueOnce({
            ok: true,
            json: async () => [newAgent]
        });

    document.getElementById('name').value = 'New Agent';
    document.getElementById('command').value = 'echo test';
    document.getElementById('working_directory').value = '.';

    const form = document.getElementById('create-agent-form');
    const handler = form.onsubmit;
    
    // @ts-ignore
    global.FormData = class {
        constructor() {}
        entries() {
            return Object.entries({
                name: 'New Agent',
                command: 'echo test',
                working_directory: '.'
            });
        }
    };

    await handler({ 
        preventDefault: () => {}, 
        target: form 
    });

    expect(fetchMock).toHaveBeenCalledTimes(3); 
    const list = document.getElementById('agent-list');
    expect(list.children.length).toBe(1);
    expect(list.children[0].textContent).toContain('New Agent');
  });
});