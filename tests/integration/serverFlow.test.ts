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
    // Create one first to ensure list isn't empty (dependent on persistence mock/reset in real app)
    await request(app).post('/api/agents').send({
      name: 'Listable Agent',
      command: 'true',
      working_directory: '.',
    });

    const response = await request(app).get('/api/agents');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    const agent = response.body.find((a: any) => a.name === 'Listable Agent');
    expect(agent).toBeDefined();
  });
});
