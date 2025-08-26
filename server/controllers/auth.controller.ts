import { Request, Response } from 'express';
import { AuthService, OtpService } from '../services';
import { catchAsync } from '../middlewares';

export class AuthController {
  static register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);
    res.status(201).json(result);
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(
      email, 
      password, 
      req.ip || undefined, 
      req.get('User-Agent') || undefined
    );
    res.json(result);
  });

  static getDemoCredentials = catchAsync(async (req: Request, res: Response) => {
    const credentials = await AuthService.getDemoCredentials();
    res.json(credentials);
  });

  static sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, type = "email_verification" } = req.body;
    const result = await OtpService.sendOtp(
      email, 
      type, 
      req.ip || undefined, 
      req.get('User-Agent') || undefined
    );
    res.json(result);
  });

  static verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, code, type = "email_verification" } = req.body;
    const result = await OtpService.verifyOtp(
      email, 
      code, 
      type, 
      req.ip || undefined, 
      req.get('User-Agent') || undefined
    );
    res.json(result);
  });
}