import { describe, it, expect, vi, beforeEach } from 'vitest';
import { previewAudience } from './api.js';

describe('Frontend API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts audience request and returns result', async () => {
    const mockData = {
      name: 'Test',
      asOf: '2026-09-29T00:00:00.000Z',
      total: 1,
      members: [{ anonymousId: 'anon_101', evidence: [{ eventType: 'product_view', observedCount: 2 }] }],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await previewAudience({
      name: 'Test',
      asOf: '2026-09-29T00:00:00.000Z',
      conditions: [{ eventType: 'product_view', operator: 'at_least', count: 2, withinDays: 7 }],
    });

    expect(result.total).toBe(1);
    expect(result.members[0].anonymousId).toBe('anon_101');
  });

  it('throws friendly error on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection failed'));

    await expect(
      previewAudience({
        name: 'Test',
        asOf: '2026-09-29T00:00:00.000Z',
        conditions: [],
      })
    ).rejects.toThrow('Cannot connect to backend');
  });
});
