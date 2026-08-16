import { Router } from 'express';
import postRoutes from './postRoutes.js';
import socialAccountRoutes from './socialAccountRoutes.js';
import leadRoutes from './leadRoutes.js';

const router = Router();

router.use('/posts', postRoutes);
router.use('/social-accounts', socialAccountRoutes);
router.use('/leads', leadRoutes);

router.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

export default router;
