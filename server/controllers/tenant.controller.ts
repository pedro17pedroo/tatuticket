import { Request, Response } from 'express';
import { TenantService } from '../services';
import { catchAsync } from '../middlewares';

export class TenantController {
  static getAllTenants = catchAsync(async (req: Request, res: Response) => {
    const tenants = await TenantService.getAllTenants();
    res.json(tenants);
  });

  static createTenant = catchAsync(async (req: Request, res: Response) => {
    const tenant = await TenantService.createTenant(
      req.body,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.status(201).json(tenant);
  });

  static getTenantById = catchAsync(async (req: Request, res: Response) => {
    const tenant = await TenantService.getTenantById(req.params.id);
    res.json(tenant);
  });

  static updateTenant = catchAsync(async (req: Request, res: Response) => {
    const tenant = await TenantService.updateTenant(req.params.id, req.body);
    res.json(tenant);
  });
}