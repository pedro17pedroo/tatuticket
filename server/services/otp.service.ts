import { storage } from '../storage';
import { InsertOtpCode } from '@shared/schema';
import { AppError } from '../middlewares/error.middleware';
import { notificationService } from '../integrations';
import { logger } from '../utils/logger.util';

export class OtpService {
  static async sendOtp(email: string, type: string = "email_verification", ipAddress?: string, userAgent?: string): Promise<{ message: string, otpCode?: string }> {
    if (!email) {
      throw new AppError('Email is required', 400);
    }
    
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Save OTP to database
    await storage.createOtpCode({
      email,
      code,
      type,
      expiresAt
    });
    
    // Send OTP via configured notification channels
    await notificationService.notifyOTP(
      { email, phone: undefined }, // Could add phone support
      code
    );

    logger.info(`OTP sent to ${email}`, { type, expiresAt });
    
    await storage.createAuditLog({
      userId: null,
      tenantId: null,
      action: "otp_sent",
      resourceType: "otp",
      resourceId: null,
      metadata: { email, type },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    return { 
      message: "OTP sent successfully",
      // In demo mode, return the code for testing
      ...(process.env.NODE_ENV === "development" && { otpCode: code })
    };
  }

  static async verifyOtp(email: string, code: string, type: string = "email_verification", ipAddress?: string, userAgent?: string): Promise<{ message: string, verified: boolean }> {
    if (!email || !code) {
      throw new AppError('Email and code are required', 400);
    }
    
    // Verify OTP
    const otpRecord = await storage.verifyOtpCode(email, code, type);
    
    if (!otpRecord) {
      await storage.createAuditLog({
        userId: null,
        tenantId: null,
        action: "otp_verification_failed",
        resourceType: "otp",
        resourceId: null,
        metadata: { email, type, reason: "invalid_or_expired" },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
      
      throw new AppError('Invalid or expired OTP code', 400);
    }
    
    // Check attempt limit
    if ((otpRecord.attempts || 0) >= 3) {
      throw new AppError('Too many attempts. Please request a new OTP.', 400);
    }
    
    // Mark OTP as used
    await storage.markOtpAsUsed(otpRecord.id);
    
    await storage.createAuditLog({
      userId: null,
      tenantId: null,
      action: "otp_verified",
      resourceType: "otp",
      resourceId: otpRecord.id,
      metadata: { email, type },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    return { message: "OTP verified successfully", verified: true };
  }

  static async cleanupExpiredOtps(): Promise<void> {
    await storage.cleanupExpiredOtps();
  }
}