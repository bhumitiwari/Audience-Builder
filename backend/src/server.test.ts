import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { getDatabase, seedDatabase } from './db.js';
import { evaluateAudience } from './evaluator.js';
import { app } from './server.js';

describe('Mable Backend Tests', () => {
  const db = getDatabase(':memory:');

  beforeEach(() => {
    seedDatabase(db);
  });

  describe('Audience Evaluator', () => {
    it('evaluates canonical scenario (viewed >= 2, purchased == 0 in 7 days)', () => {
      const result = evaluateAudience(db, {
        name: 'Viewed but not purchased',
        asOf: '2026-09-29T00:00:00.000Z',
        conditions: [
          { eventType: 'product_view', operator: 'at_least', count: 2, withinDays: 7 },
          { eventType: 'purchase', operator: 'exactly', count: 0, withinDays: 7 },
        ],
      });

      expect(result.total).toBe(5);
      const ids = result.members.map(m => m.anonymousId);
      expect(ids).toContain('anon_101');
      expect(ids).toContain('anon_102');
      expect(ids).toContain('anon_106');
      expect(ids).not.toContain('anon_103'); 
      expect(ids).not.toContain('anon_104'); 
      expect(ids).not.toContain('anon_105'); 
    });

    it('ignores events occurring after asOf', () => {
      const result = evaluateAudience(db, {
        name: 'Future Event Test',
        asOf: '2026-09-29T00:00:00.000Z',
        conditions: [
          { eventType: 'product_view', operator: 'at_least', count: 2, withinDays: 3 },
        ],
      });
      const ids = result.members.map(m => m.anonymousId);
      expect(ids).not.toContain('anon_107'); 
    });
  });

  describe('HTTP Endpoints', () => {
    it('GET /health returns 200 ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /v1/audiences/preview returns 200 with matched members', async () => {
      const res = await request(app).post('/v1/audiences/preview').send({
        name: 'Test',
        asOf: '2026-09-29T00:00:00.000Z',
        conditions: [
          { eventType: 'purchase', operator: 'at_least', count: 1, withinDays: 7 },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.members[0].anonymousId).toBe('anon_103');
    });

    it('POST /v1/audiences/preview returns 400 on invalid input', async () => {
      const res = await request(app).post('/v1/audiences/preview').send({
        name: '',
        asOf: 'bad-date',
        conditions: [],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
