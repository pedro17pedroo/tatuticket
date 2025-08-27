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
    const { email, phone, type = "email_verification", method = "email" } = req.body;
    const result = await OtpService.sendOtp(
      email, 
      type, 
      req.ip || undefined, 
      req.get('User-Agent') || undefined
    );

    // If SMS method and phone provided, also send SMS
    if (method === 'sms' && phone) {
      const { smsService } = await import('../integrations');
      await smsService.sendOTPSMS(phone, result.otpCode || '123456');
    }

    res.json({
      success: true,
      message: result.message,
      method: method,
      ...(process.env.NODE_ENV === 'development' && { code: result.otpCode })
    });
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

    if (result.verified) {
      res.json({
        success: true,
        message: result.message,
        token: `otp_verified_${Date.now()}_${email}`,
        verified: true
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message || 'Invalid OTP code',
        verified: false
      });
    }
  });
}