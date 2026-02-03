import { z } from 'zod';

export const AgentStatusSchema = z.enum(['running', 'error', 'stopped', 'waiting_input']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  command: z.string().min(1),
  working_directory: z.string().min(1),
  status: AgentStatusSchema,
  pid: z.number().int().optional(),
  session_id: z.string().optional(),
  exit_code: z.number().int().optional(),
  created_at: z.date(),
});

export type Agent = z.infer<typeof AgentSchema>;

export const LogEntrySchema = z.object({
  timestamp: z.date(),
  source: z.enum(['stdout', 'stderr']),
  content: z.string(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

export class AgentInstance {
  private logs: LogEntry[] = [];
  public data: Agent;

  constructor(data: Agent, private logLimit: number = 1000) {
    this.data = data;
  }

  addLog(content: string, source: 'stdout' | 'stderr') {
    const entry: LogEntry = {
      timestamp: new Date(),
      source,
      content
    };
    this.logs.push(entry);
    if (this.logs.length > this.logLimit) {
      this.logs.shift(); // Remove oldest
    }
    return entry;
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  setStatus(status: AgentStatus, pid?: number, exit_code?: number) {
    this.data.status = status;
    if (pid !== undefined) this.data.pid = pid;
    if (exit_code !== undefined) this.data.exit_code = exit_code;
  }

  setSessionId(sessionId: string) {
    this.data.session_id = sessionId;
  }
}