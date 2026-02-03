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
    const processWrapper = new ProcessWrapper(params.command, [], params.working_directory);
    
    try {
      const pid = processWrapper.start();
      if (pid) {
        agent.setStatus('running', pid);
        activeProcesses.set(agent.data.id, processWrapper);

        processWrapper.on('stdout', (data) => {
          const entry = agent.addLog(data, 'stdout');
          logEvents.emit(`logs-${agent.data.id}`, entry);
        });

        processWrapper.on('stderr', (data) => {
          const entry = agent.addLog(data, 'stderr');
          logEvents.emit(`logs-${agent.data.id}`, entry);
        });

        processWrapper.on('acp', (msg) => {
          if (msg.type === 'status') {
            agent.setStatus(msg.status);
            logEvents.emit(`status-${agent.data.id}`, agent.data.status);
          }
        });

        processWrapper.on('exit', (code) => {
          agent.setStatus(code === 0 ? 'stopped' : 'error', undefined, code || 0);
          logEvents.emit(`status-${agent.data.id}`, agent.data.status);
        });
      } else {
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
  const process = activeProcesses.get(id);
  if (!process) return res.status(404).json({ error: 'Process not found' });
  
  const { input } = req.body;
  try {
    process.write(input);
    res.status(204).end();
  } catch (err) {
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

  req.on('close', () => {
    logEvents.off(`logs-${id}`, logListener);
    logEvents.off(`status-${id}`, statusListener);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app, agentManager, activeProcesses };
