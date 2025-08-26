import { Request, Response } from 'express';
import { UserService } from '../services';
import { catchAsync } from '../middlewares';

export class UserController {
  static getUsers = catchAsync(async (req: Request, res: Response) => {
    const { tenantId, role } = req.query;
    const users = await UserService.getUsers(tenantId as string, role as string);
    res.json(users);
  });

  static createUser = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.createUser(
      req.body,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.status(201).json(user);
  });

  static getUserById = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.params.id);
    res.json(user);
  });

  static updateUser = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.updateUser(
      req.params.id,
      req.body,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.json(user);
  });
}