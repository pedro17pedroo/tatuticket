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

  static deleteTenant = catchAsync(async (req: Request, res: Response) => {
    await TenantService.deleteTenant(req.params.id);
    res.status(204).send();
  });

  static updateTenantStatus = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.body;
    const tenant = await TenantService.updateTenantStatus(req.params.id, status);
    res.json(tenant);
  });

  static updateTenantPlan = catchAsync(async (req: Request, res: Response) => {
    const { plan } = req.body;
    const tenant = await TenantService.updateTenantPlan(req.params.id, plan);
    res.json(tenant);
  });

  static overrideTenantSettings = catchAsync(async (req: Request, res: Response) => {
    const settings = req.body;
    const tenant = await TenantService.overrideTenantSettings(req.params.id, settings);
    res.json(tenant);
  });

  static getTenantUsers = catchAsync(async (req: Request, res: Response) => {
    const users = await TenantService.getTenantUsers(req.params.id);
    res.json(users);
  });

  static suspendTenant = catchAsync(async (req: Request, res: Response) => {
    const tenant = await TenantService.suspendTenant(req.params.id);
    res.json(tenant);
  });

  static activateTenant = catchAsync(async (req: Request, res: Response) => {
    const tenant = await TenantService.activateTenant(req.params.id);
    res.json(tenant);
  });

  static getTenantAudit = catchAsync(async (req: Request, res: Response) => {
    const auditLogs = await TenantService.getTenantAuditLogs(req.params.id);
    res.json(auditLogs);
  });

  static getTenantAnalytics = catchAsync(async (req: Request, res: Response) => {
    const analytics = await TenantService.getTenantAnalytics(req.params.id);
    res.json(analytics);
  });
}