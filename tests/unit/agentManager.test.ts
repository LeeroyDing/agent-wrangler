import { describe, it, expect, beforeEach } from 'vitest';
import { AgentManager, InMemoryAgentManager } from '../../src/domain/agentManager';
import { AgentInstance } from '../../src/domain/agent';

describe('AgentManager', () => {
  let manager: AgentManager;

  beforeEach(() => {
    manager = new InMemoryAgentManager();
  });

  it('should create an agent', async () => {
    const instance = await manager.createAgent({
      name: 'Test Agent',
      command: 'echo "hello"',
      working_directory: '/tmp',
    });

    const agent = instance.data;
    expect(agent.id).toBeDefined();
    expect(agent.name).toBe('Test Agent');
    expect(agent.command).toBe('echo "hello"');
    expect(agent.status).toBe('stopped');
    expect(agent.created_at).toBeDefined();
  });

  it('should list agents', async () => {
    await manager.createAgent({ name: 'A1', command: 'c1', working_directory: 'd1' });
    await manager.createAgent({ name: 'A2', command: 'c2', working_directory: 'd2' });

    const agents = await manager.listAgents();
    expect(agents).toHaveLength(2);
    expect(agents[0].data.name).toBe('A1');
    expect(agents[1].data.name).toBe('A2');
  });

  it('should get an agent by id', async () => {
    const created = await manager.createAgent({ name: 'A1', command: 'c1', working_directory: 'd1' });
    const fetched = await manager.getAgent(created.data.id);
    expect(fetched).toEqual(created);
  });

  it('should return undefined for non-existent agent', async () => {
    const fetched = await manager.getAgent('non-existent-id');
    expect(fetched).toBeUndefined();
  });
});