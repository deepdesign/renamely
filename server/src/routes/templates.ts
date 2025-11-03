import { Router } from 'express';
import { getTemplate } from '../services/gelato';
import { errorHandler } from '../util/errors';
import { log } from '../util/logger';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const templateId = req.params.id;
    log(`GET /api/templates/${templateId}`);
    
    const data = await getTemplate(templateId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.use(errorHandler);

export default router;

