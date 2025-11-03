import { Router } from 'express';
import { createFromTemplate, getProduct } from '../services/gelato';
import { errorHandler } from '../util/errors';
import { log } from '../util/logger';

const router = Router();

router.post('/create-from-template', async (req, res, next) => {
  try {
    log('POST /api/products/create-from-template');
    // Body must match the official Gelato schema - do not add undocumented fields
    const data = await createFromTemplate(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    log(`GET /api/products/${productId}`);
    const data = await getProduct(productId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.use(errorHandler);

export default router;

