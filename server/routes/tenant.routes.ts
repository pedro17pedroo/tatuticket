import { Router } from 'express';
import { TenantController } from '../controllers';
import { validateBody } from '../middlewares';
import { insertTenantSchema } from '@shared/schema';

const router = Router();

router.get('/', TenantController.getAllTenants);
router.post('/', validateBody(insertTenantSchema), TenantController.createTenant);
router.get('/:id', TenantController.getTenantById);
router.put('/:id', TenantController.updateTenant);

export default router;