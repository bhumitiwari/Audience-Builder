import express, { Request, Response } from 'express';
import cors from 'cors';
import { getDatabase, seedDatabase } from './db.js';
import { evaluateAudience, AudienceRequest } from './evaluator.js';

export const db = getDatabase();


const countRow = db.prepare('SELECT count(*) as c FROM users').get() as { c: number };
if (countRow.c === 0) {
  console.log('[Database] Seeding initial synthetic data...');
  seedDatabase(db);
}

export const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.url} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /v1/audiences/preview
app.post('/v1/audiences/preview', (req: Request, res: Response) => {
  const body = req.body as Partial<AudienceRequest>;

  // Validation
  const errors: { field?: string; message: string }[] = [];

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push({ field: 'name', message: 'name is required and cannot be empty' });
  }

  if (!body.asOf || typeof body.asOf !== 'string' || isNaN(Date.parse(body.asOf))) {
    errors.push({ field: 'asOf', message: 'asOf must be a valid ISO 8601 date string' });
  }

  if (!Array.isArray(body.conditions) || body.conditions.length === 0) {
    errors.push({ field: 'conditions', message: 'At least one condition must be specified' });
  } else {
    const validEvents = ['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'purchase'];
    const validOperators = ['at_least', 'exactly'];

    body.conditions.forEach((c, idx) => {
      if (!validEvents.includes(c.eventType)) {
        errors.push({ field: `conditions.${idx}.eventType`, message: `eventType must be one of: ${validEvents.join(', ')}` });
      }
      if (!validOperators.includes(c.operator)) {
        errors.push({ field: `conditions.${idx}.operator`, message: `operator must be one of: ${validOperators.join(', ')}` });
      }
      if (typeof c.count !== 'number' || c.count < 0) {
        errors.push({ field: `conditions.${idx}.count`, message: 'count must be an integer >= 0' });
      }
      if (typeof c.withinDays !== 'number' || c.withinDays < 1) {
        errors.push({ field: `conditions.${idx}.withinDays`, message: 'withinDays must be an integer >= 1' });
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: errors,
      },
    });
  }

  try {
    const result = evaluateAudience(db, body as AudienceRequest);
    return res.json(result);
  } catch (err: any) {
    console.error('Evaluation error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Audience evaluation failed' },
    });
  }
});


const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Mable Backend Listening at http://localhost:${PORT}`);
  });
}
