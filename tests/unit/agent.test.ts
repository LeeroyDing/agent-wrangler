import { describe, it, expect, beforeEach } from 'vitest';
import { AgentInstance } from '../../src/domain/agent'; // I will create this class to handle logic

describe('Agent Log Buffering', () => {
  let agent: AgentInstance;

  beforeEach(() => {
    agent = new AgentInstance({
      id: '1',
      name: 'Test',
      command: 'echo',
      working_directory: '.',
      status: 'running',
      created_at: new Date()
    }, 5); // Limit to 5 lines for testing
  });

  it('should store logs and respect the limit', () => {
    agent.addLog('line 1', 'stdout');
    agent.addLog('line 2', 'stdout');
    agent.addLog('line 3', 'stdout');
    agent.addLog('line 4', 'stdout');
    agent.addLog('line 5', 'stdout');
    
    let logs = agent.getLogs();
    expect(logs).toHaveLength(5);
    expect(logs[0].content).toBe('line 1');
    expect(logs[4].content).toBe('line 5');

    // Add 6th line, line 1 should be gone
    agent.addLog('line 6', 'stdout');
    logs = agent.getLogs();
    expect(logs).toHaveLength(5);
    expect(logs[0].content).toBe('line 2');
    expect(logs[4].content).toBe('line 6');
  });

  it('should distinguish between stdout and stderr', () => {
    agent.addLog('out', 'stdout');
    agent.addLog('err', 'stderr');
    const logs = agent.getLogs();
    expect(logs[0].source).toBe('stdout');
    expect(logs[1].source).toBe('stderr');
  });
});
