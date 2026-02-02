import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/infrastructure/server';

describe('Server Integration Flow', () => {
  it('should create a new agent via API', async () => {
    const response = await request(app)
      .post('/api/agents')
      .send({
        name: 'Integration Agent',
        command: 'echo "integration"',
        working_directory: process.cwd(),
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('Integration Agent');
  });

  it('should list created agents', async () => {
    await request(app).post('/api/agents').send({
      name: 'Listable Agent',
      command: 'true',
      working_directory: '.',
    });

    const response = await request(app).get('/api/agents');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    const agent = response.body.find((a: any) => a.name === 'Listable Agent');
    expect(agent).toBeDefined();
  });

  it('should send stdin to agent', async () => {
    // We use a command that waits for input
    const createRes = await request(app).post('/api/agents').send({
      name: 'Interactive Agent',
      command: 'node -e "process.stdin.on(\'data\', (d) => console.log(\'GOT:\' + d))"',
      working_directory: '.',
    });
    
    const id = createRes.body.id;
    const response = await request(app)
      .post(`/api/agents/${id}/stdin`)
      .send({ input: 'hello world' });

    expect(response.status).toBe(204);
  });
});