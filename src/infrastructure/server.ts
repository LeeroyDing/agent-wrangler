import express from 'express';
import type { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { InMemoryAgentManager } from '../domain/agentManager';
import { ProcessWrapper } from './process';

const app = express();
app.use(express.json());
app.use(express.static('src/web'));

const agentManager = new InMemoryAgentManager();
// Map to hold active process instances: agentId -> ProcessWrapper
const activeProcesses = new Map<string, ProcessWrapper>();

// GET /api/agents
app.get('/api/agents', async (req: Request, res: Response) => {
  const agents = await agentManager.listAgents();
  res.json(agents);
});

// POST /api/agents
const CreateAgentSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  working_directory: z.string().min(1),
});

app.post('/api/agents', async (req: Request, res: Response) => {
  try {
    const params = CreateAgentSchema.parse(req.body);
    const agent = await agentManager.createAgent(params);

    const processWrapper = new ProcessWrapper(params.command, [], params.working_directory);
    const pid = processWrapper.start();

    if (pid) {
      await agentManager.updateAgentStatus(agent.id, 'running', pid);
      activeProcesses.set(agent.id, processWrapper);

      processWrapper.on('exit', (code) => {
        agentManager.updateAgentStatus(agent.id, code === 0 ? 'stopped' : 'error', undefined, code || 0);
        // Note: We might keep the process wrapper around for logs buffer, but here we just update status
        // activeProcesses.delete(agent.id); // Maybe don't delete immediately if we want to read logs later?
      });
      
      // We'll hook up logs in US2
    } else {
        await agentManager.updateAgentStatus(agent.id, 'error');
    }

    // Refetch agent to get updated status/pid
    const updatedAgent = await agentManager.getAgent(agent.id);
    res.status(201).json(updatedAgent);

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: (error as any).errors });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// GET /api/agents/:id
app.get('/api/agents/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ error: 'Missing id' });
    return;
  }
  const agent = await agentManager.getAgent(id);
  if (agent) {
    res.json(agent);
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// POST /api/agents/:id/stdin
app.post('/api/agents/:id/stdin', async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not Implemented' });
});

// GET /api/history/command
app.get('/api/history/command', async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not Implemented' });
});

// GET /stream/logs/:id
app.get('/stream/logs/:id', async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Not Implemented' });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app, agentManager, activeProcesses };