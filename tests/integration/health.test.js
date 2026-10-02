import { describe, it, expect } from 'vitest';
const request = require('supertest');
const { app } = require('../../server/index');

describe('API Integration: Healthcheck /api/health', () => {
  it('debe responder 200 OK con payload de salud estructurado', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.status).toBe('healthy');
    expect(res.body.system).toBe('Milicic FireControl 365');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.time).toBe('string');
    expect(res.body.node).toBeDefined();
  });
});
