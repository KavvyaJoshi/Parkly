import { Router } from 'express';
import { getDbStatus } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'parkly-api',
    status: 'ok',
    database: getDbStatus(),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
