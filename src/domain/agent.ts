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
