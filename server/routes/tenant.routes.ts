import { Router } from 'express';
import { TenantController } from '../controllers';
import { validateBody } from '../middlewares';
import { insertTenantSchema } from '@shared/schema';

const router = Router();

// Basic tenant management
router.get('/', TenantController.getAllTenants);
router.post('/', validateBody(insertTenantSchema), TenantController.createTenant);
router.get('/:id', TenantController.getTenantById);
router.put('/:id', TenantController.updateTenant);
router.delete('/:id', TenantController.deleteTenant);

// Advanced admin functionalities
router.put('/:id/status', TenantController.updateTenantStatus);
router.put('/:id/plan', TenantController.updateTenantPlan);
router.put('/:id/settings', TenantController.overrideTenantSettings);
router.get('/:id/users', TenantController.getTenantUsers);
router.post('/:id/suspend', TenantController.suspendTenant);
router.post('/:id/activate', TenantController.activateTenant);
router.get('/:id/audit', TenantController.getTenantAudit);
router.get('/:id/analytics', TenantController.getTenantAnalytics);

export default router;