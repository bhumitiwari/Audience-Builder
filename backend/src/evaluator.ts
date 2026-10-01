import { DatabaseSync } from 'node:sqlite';
import { EventType } from './db.js';

export interface Condition {
  eventType: EventType;
  operator: 'at_least' | 'exactly';
  count: number;
  withinDays: number;
}

export interface AudienceRequest {
  name: string;
  asOf: string;
  conditions: Condition[];
}

export interface AudienceEvidence {
  eventType: EventType;
  observedCount: number;
}

export interface AudienceMember {
  anonymousId: string;
  evidence: AudienceEvidence[];
}

export interface AudienceResponse {
  name: string;
  asOf: string;
  total: number;
  members: AudienceMember[];
}

export function evaluateAudience(db: DatabaseSync, req: AudienceRequest): AudienceResponse {
  // 1. Get all candidate users
  const userRows = db.prepare('SELECT anonymous_id FROM users ORDER BY anonymous_id ASC').all() as { anonymous_id: string }[];
  const userIds = userRows.map(u => u.anonymous_id);

  // 2. Query event counts per condition
  const countQuery = db.prepare(`
    SELECT anonymous_id, COUNT(*) as count
    FROM events
    WHERE event_type = ? AND timestamp >= ? AND timestamp <= ?
    GROUP BY anonymous_id
  `);

  const conditionMaps: Map<string, number>[] = req.conditions.map(condition => {
    const asOfMs = new Date(req.asOf).getTime();
    const windowStart = new Date(asOfMs - condition.withinDays * 86400000).toISOString();
    const rows = countQuery.all(condition.eventType, windowStart, req.asOf) as { anonymous_id: string; count: number }[];
    
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.anonymous_id, Number(r.count));
    return map;
  });

  // 3. Match users with AND logic across all conditions
  const matchedMembers: AudienceMember[] = [];

  for (const userId of userIds) {
    let matches = true;
    const evidence: AudienceEvidence[] = [];

    for (let i = 0; i < req.conditions.length; i++) {
      const cond = req.conditions[i];
      const count = conditionMaps[i].get(userId) ?? 0;
      evidence.push({ eventType: cond.eventType, observedCount: count });

      if (cond.operator === 'at_least' && count < cond.count) matches = false;
      if (cond.operator === 'exactly' && count !== cond.count) matches = false;
    }

    if (matches) {
      matchedMembers.push({ anonymousId: userId, evidence });
    }
  }

  return {
    name: req.name,
    asOf: req.asOf,
    total: matchedMembers.length,
    members: matchedMembers,
  };
}
