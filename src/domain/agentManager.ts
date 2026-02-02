import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentSchema } from './agent';
import { AgentManager, CreateAgentParams } from './agentManager';

export class InMemoryAgentManager implements AgentManager {
  private agents: Map<string, Agent> = new Map();

  async createAgent(params: CreateAgentParams): Promise<Agent> {
    const newAgent: Agent = {
      id: uuidv4(),
      name: params.name,
      command: params.command,
      working_directory: params.working_directory,
      status: 'stopped', // Will be updated to running by the process starter usually, but initially created
      created_at: new Date(),
    };

    // Validate using Zod
    AgentSchema.parse(newAgent);

    this.agents.set(newAgent.id, newAgent);
    return newAgent;
  }

  async listAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async updateAgentStatus(id: string, status: Agent['status'], pid?: number, exit_code?: number): Promise<void> {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      if (pid !== undefined) agent.pid = pid;
      if (exit_code !== undefined) agent.exit_code = exit_code;
      this.agents.set(id, agent);
    }
  }
}