import { Router } from 'express';
import { UserController } from '../controllers';
import { validateBody, validateQuery } from '../middlewares';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(z.object({
  tenantId: z.string(),
  role: z.string().optional()
})), UserController.getUsers);

router.post('/', validateBody(insertUserSchema), UserController.createUser);

router.get('/:id', UserController.getUserById);

router.put('/:id', UserController.updateUser);

export default router;