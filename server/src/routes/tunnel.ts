import { Router } from 'express';
import { ENV } from '../util/env';
import { errorHandler } from '../util/errors';

const router = Router();

// Get current tunnel/base URL
router.get('/url', (_req, res) => {
  res.json({ publicBaseUrl: ENV.PUBLIC_BASE_URL });
});

router.use(errorHandler);

export default router;

