import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentSchema, AgentInstance } from './agent';

export interface CreateAgentParams {
  name: string;
  command: string;
  working_directory: string;
}

export interface AgentManager {
  createAgent(params: CreateAgentParams): Promise<AgentInstance>;
  listAgents(): Promise<AgentInstance[]>;
  getAgent(id: string): Promise<AgentInstance | undefined>;
  renameAgent(id: string, name: string): Promise<AgentInstance | undefined>;
}

export class InMemoryAgentManager implements AgentManager {
  private agents: Map<string, AgentInstance> = new Map();

  async createAgent(params: CreateAgentParams): Promise<AgentInstance> {
    const rawAgent: Agent = {
      id: uuidv4(),
      name: params.name,
      command: params.command,
      working_directory: params.working_directory,
      status: 'stopped',
      created_at: new Date(),
    };

    AgentSchema.parse(rawAgent);

    const instance = new AgentInstance(rawAgent);
    this.agents.set(rawAgent.id, instance);
    return instance;
  }

  async listAgents(): Promise<AgentInstance[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: string): Promise<AgentInstance | undefined> {
    return this.agents.get(id);
  }

  async renameAgent(id: string, name: string): Promise<AgentInstance | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    agent.data.name = name;
    return agent;
  }
}