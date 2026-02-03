import express from 'express';
import type { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { InMemoryAgentManager } from '../domain/agentManager';
import { ProcessWrapper } from './process';
import { EventEmitter } from 'events';
import fs from 'fs';

const app = express();
app.use(express.json());
app.use(express.static('src/web'));

const agentManager = new InMemoryAgentManager();
const activeProcesses = new Map<string, ProcessWrapper>();
const logEvents = new EventEmitter();

// GET /api/agents
app.get('/api/agents', async (req: Request, res: Response) => {
  const agents = await agentManager.listAgents();
  res.json(agents.map(a => a.data));
});

// POST /api/agents
const CreateAgentSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  working_directory: z.string().min(1),
});

app.post('/api/agents', async (req: Request, res: Response) => {
  console.log('Received create request:', req.body);
  try {
    const params = CreateAgentSchema.parse(req.body);
    
    // REMOVED STRICT PATH CHECK to allow flexible execution environments
    const agent = await agentManager.createAgent(params);
    console.log(`Agent created in manager: ${agent.data.id}`);

    const processWrapper = new ProcessWrapper(params.command, [], params.working_directory);
    
    try {
      console.log(`Attempting to spawn process for agent ${agent.data.id} with command: "${params.command}" in "${params.working_directory}"`);
      const pid = processWrapper.start();
      if (pid) {
        console.log(`Process spawned successfully. PID: ${pid}`);
        agent.setStatus('running', pid);
        activeProcesses.set(agent.data.id, processWrapper);

        // Send ACP Initialization Handshake
        const initMsg = {
          "jsonrpc": "2.0",
          "id": 0,
          "method": "initialize",
          "params": {
            "protocolVersion": 1,
            "clientCapabilities": {
                "fs": { "readTextFile": true, "writeTextFile": true },
                "terminal": true
            },
            "clientInfo": { "name": "agent-wrangler", "version": "1.0.0" }
          }
        };
        console.log(`Sending Initialize Handshake to agent ${agent.data.id}`);
        try {
            processWrapper.write(JSON.stringify(initMsg));
            // DEBUG LOG: Handshake Request
            const logEntry = agent.addLog(`[ACP-OUT] ${JSON.stringify(initMsg)}`, 'stdout');
            logEvents.emit(`logs-${agent.data.id}`, logEntry);
        } catch (err) {
            console.warn(`Failed to send handshake to agent ${agent.data.id} (process might have exited):`, err);
        }

        processWrapper.on('stdout', (data) => {
          const entry = agent.addLog(data, 'stdout');
          logEvents.emit(`logs-${agent.data.id}`, entry);
        });

        processWrapper.on('stderr', (data) => {
          const entry = agent.addLog(data, 'stderr');
          logEvents.emit(`logs-${agent.data.id}`, entry);
        });

        processWrapper.on('acp', (msg) => {
          // DEBUG LOG: ACP Message Received
          const logEntry = agent.addLog(`[ACP-IN] ${JSON.stringify(msg)}`, 'stdout');
          logEvents.emit(`logs-${agent.data.id}`, logEntry);

          // Handle Handshake Responses
          if (msg.id === 0 && msg.result) {
              console.log(`Agent ${agent.data.id} initialized. Requesting new session...`);
              const sessionNewMsg = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "session/new",
                "params": {
                  "cwd": params.working_directory,
                  "mcpServers": []
                }
              };
              processWrapper.write(JSON.stringify(sessionNewMsg));
              // DEBUG LOG: Session New Request
              const snLog = agent.addLog(`[ACP-OUT] ${JSON.stringify(sessionNewMsg)}`, 'stdout');
              logEvents.emit(`logs-${agent.data.id}`, snLog);

          } else if (msg.id === 1 && msg.result && msg.result.sessionId) {
              console.log(`Agent ${agent.data.id} session established: ${msg.result.sessionId}`);
              agent.setSessionId(msg.result.sessionId);
              agent.setStatus('waiting_input');
              logEvents.emit(`status-${agent.data.id}`, 'waiting_input');
          }

          // Handle Notifications
          if (msg.method === 'session/update') {
              const update = msg.params?.update;
              if (update) {
                  const content = update.content?.content || update.content;
                  if (content && content.type === 'text') {
                      // This is the user-facing content! Log it as 'stdout' so it appears in main view.
                      // We don't prefix it with [ACP-IN] so it passes the frontend filter.
                      const entry = agent.addLog(content.text, 'stdout');
                      logEvents.emit(`logs-${agent.data.id}`, entry);
                  }
              }
          }

          if (msg.type === 'status') {
            agent.setStatus(msg.status);
            logEvents.emit(`status-${agent.data.id}`, agent.data.status);
          }
        });

        processWrapper.on('exit', (code) => {
          console.log(`Process for agent ${agent.data.id} exited with code: ${code}`);
          agent.setStatus(code === 0 ? 'stopped' : 'error', undefined, code || 0);
          logEvents.emit(`status-${agent.data.id}`, agent.data.status);
        });
      } else {
        console.error(`Failed to spawn process for agent ${agent.data.id} (no PID returned)`);
        agent.setStatus('error');
      }
    } catch (spawnError) {
      agent.setStatus('error');
      console.error('Spawn failed:', spawnError);
    }

    res.status(201).json(agent.data);

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.errors);
      res.status(400).json({ error: (error as any).errors });
    } else {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// GET /api/agents/:id
app.get('/api/agents/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const agent = await agentManager.getAgent(id);
  if (agent) {
    res.json(agent.data);
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// POST /api/agents/:id/stdin
app.post('/api/agents/:id/stdin', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const agent = await agentManager.getAgent(id);
  const process = activeProcesses.get(id);
  if (!process || !agent) return res.status(404).json({ error: 'Process or Agent not found' });
  
  const { input } = req.body;
  console.log(`[STDIN] Received input for agent ${id}: "${input}"`);

  try {
    if (agent.data.session_id) {
        // Send as ACP session/prompt
        const promptMsg = {
            "jsonrpc": "2.0",
            "id": Date.now(),
            "method": "session/prompt",
            "params": {
                "sessionId": agent.data.session_id,
                "prompt": [
                    { "type": "text", "text": input }
                ]
            }
        };
        const payload = JSON.stringify(promptMsg);
        console.log(`[ACP-OUT] Sending prompt to agent ${id}: ${payload}`);
        process.write(payload);
        
        // Log to UI
        const logEntry = agent.addLog(`[ACP-OUT] ${payload}`, 'stdout');
        logEvents.emit(`logs-${agent.data.id}`, logEntry);
    } else {
        // Fallback to raw stdin
        console.log(`[STDIN-OUT] Sending raw input to agent ${id}`);
        process.write(input);
    }
    res.status(204).end();
  } catch (err) {
    console.error(`[STDIN-ERR] Failed to send input to agent ${id}:`, err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /stream/logs/:id
app.get('/stream/logs/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const agent = await agentManager.getAgent(id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // @ts-ignore
  if (res.flushHeaders) res.flushHeaders();

  for (const log of agent.getLogs()) {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  }

  const logListener = (log: any) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  };

  const statusListener = (status: string) => {
    res.write(`event: status\ndata: ${status}\n\n`);
  };

  logEvents.on(`logs-${id}`, logListener);
  logEvents.on(`status-${id}`, statusListener);
  
  // Send current status immediately so UI updates even if no event fires
  res.write(`event: status\ndata: ${agent.data.status}\n\n`);
  
  // Keep-alive/Flush
  res.write(`:\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    logEvents.off(`logs-${id}`, logListener);
    logEvents.off(`status-${id}`, statusListener);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app, agentManager, activeProcesses };
