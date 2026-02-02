import { describe, it, expect, beforeEach } from 'vitest';
import { AgentManager, InMemoryAgentManager } from '../../src/domain/agentManager'; // Will implement InMemoryAgentManager in T014
import { Agent } from '../../src/domain/agent';

describe('AgentManager', () => {
  let manager: AgentManager;

  beforeEach(() => {
    manager = new InMemoryAgentManager();
  });

  it('should create an agent', async () => {
    const agent = await manager.createAgent({
      name: 'Test Agent',
      command: 'echo "hello"',
      working_directory: '/tmp',
    });

    expect(agent.id).toBeDefined();
    expect(agent.name).toBe('Test Agent');
    expect(agent.command).toBe('echo "hello"');
    expect(agent.status).toBe('stopped'); // Initial status might be stopped until started
    expect(agent.created_at).toBeDefined();
  });

  it('should list agents', async () => {
    await manager.createAgent({ name: 'A1', command: 'c1', working_directory: 'd1' });
    await manager.createAgent({ name: 'A2', command: 'c2', working_directory: 'd2' });

    const agents = await manager.listAgents();
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe('A1');
    expect(agents[1].name).toBe('A2');
  });

  it('should get an agent by id', async () => {
    const created = await manager.createAgent({ name: 'A1', command: 'c1', working_directory: 'd1' });
    const fetched = await manager.getAgent(created.id);
    expect(fetched).toEqual(created);
  });

  it('should return undefined for non-existent agent', async () => {
    const fetched = await manager.getAgent('non-existent-id');
    expect(fetched).toBeUndefined();
  });
});
