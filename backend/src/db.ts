import { DatabaseSync } from 'node:sqlite';

export type EventType = 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_started' | 'purchase';

export function getDatabase(dbPath = 'mable.db'): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  initSchema(db);
  return db;
}

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      anonymous_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonymous_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (anonymous_id) REFERENCES users(anonymous_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_lookup ON events(anonymous_id, event_type, timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_type_time ON events(event_type, timestamp);
  `);
}

export function seedDatabase(db: DatabaseSync): void {
  db.exec('DELETE FROM events; DELETE FROM users;');

  const insertUser = db.prepare('INSERT INTO users (anonymous_id, created_at) VALUES (?, ?)');
  const insertEvent = db.prepare('INSERT INTO events (anonymous_id, event_type, timestamp) VALUES (?, ?, ?)');

  const users = [
    'anon_101', 'anon_102', 'anon_103', 'anon_104', 'anon_105',
    'anon_106', 'anon_107', 'anon_108', 'anon_109', 'anon_110', 'anon_111'
  ];
  for (const id of users) {
    insertUser.run(id, '2026-09-01T00:00:00.000Z');
  }

  const events: [string, EventType, string][] = [
    // anon_101: MATCH (3 product_views in 7d window, 0 purchases)
    ['anon_101', 'page_view', '2026-09-25T09:00:00.000Z'],
    ['anon_101', 'product_view', '2026-09-25T10:00:00.000Z'],
    ['anon_101', 'product_view', '2026-09-26T14:30:00.000Z'],
    ['anon_101', 'product_view', '2026-09-28T18:15:00.000Z'],

    // anon_102: MATCH (exactly 2 product_views in 7d window, 0 purchases)
    ['anon_102', 'product_view', '2026-09-23T11:00:00.000Z'],
    ['anon_102', 'product_view', '2026-09-27T09:30:00.000Z'],
    ['anon_102', 'add_to_cart', '2026-09-27T10:00:00.000Z'],

    // anon_103: NO MATCH (4 views, but 1 purchase in window)
    ['anon_103', 'product_view', '2026-09-23T08:00:00.000Z'],
    ['anon_103', 'product_view', '2026-09-24T12:00:00.000Z'],
    ['anon_103', 'product_view', '2026-09-25T16:00:00.000Z'],
    ['anon_103', 'product_view', '2026-09-26T19:00:00.000Z'],
    ['anon_103', 'purchase', '2026-09-28T12:00:00.000Z'],

    // anon_104: NO MATCH (only 1 product_view)
    ['anon_104', 'product_view', '2026-09-24T15:00:00.000Z'],

    // anon_105: NO MATCH (views occurred > 7 days ago)
    ['anon_105', 'product_view', '2026-09-18T10:00:00.000Z'],
    ['anon_105', 'product_view', '2026-09-21T23:59:59.000Z'],

    // anon_106: MATCH (1 at exact boundary 2026-09-22T00:00:00Z, 1 on 28th)
    ['anon_106', 'product_view', '2026-09-22T00:00:00.000Z'],
    ['anon_106', 'product_view', '2026-09-28T23:59:59.000Z'],

    // anon_107: NO MATCH (1 inside window, 2 after asOf)
    ['anon_107', 'product_view', '2026-09-28T10:00:00.000Z'],
    ['anon_107', 'product_view', '2026-09-30T10:00:00.000Z'],

    // anon_108: MATCH (2 views in window, purchased 15 days ago outside window)
    ['anon_108', 'purchase', '2026-09-14T10:00:00.000Z'],
    ['anon_108', 'product_view', '2026-09-24T11:00:00.000Z'],
    ['anon_108', 'product_view', '2026-09-26T16:00:00.000Z'],

    // anon_109: MATCH (cart abandoner: 3 views, 2 carts, 0 purchases)
    ['anon_109', 'product_view', '2026-09-23T09:10:00.000Z'],
    ['anon_109', 'product_view', '2026-09-24T14:20:00.000Z'],
    ['anon_109', 'add_to_cart', '2026-09-24T14:25:00.000Z'],
    ['anon_109', 'product_view', '2026-09-27T18:00:00.000Z'],

    // anon_110: NO MATCH (only page_view)
    ['anon_110', 'page_view', '2026-09-24T10:00:00.000Z'],
  ];

  for (const [anonId, type, time] of events) {
    insertEvent.run(anonId, type, time);
  }
}
