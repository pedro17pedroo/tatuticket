import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { InsertUser, type User } from '@shared/schema';
import { AppError } from '../middlewares/error.middleware';
import { config } from '../config/app.config';
import { notificationService } from '../integrations';
import { logger } from '../utils/logger.util';

export class AuthService {
  private static readonly JWT_SECRET = config.jwt.secret;
  private static readonly JWT_EXPIRES_IN = config.jwt.expiresIn;

  static generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  static async registerUser(userData: InsertUser): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Create user
    const user = await storage.createUser(userData);
    
    // Generate token
    const token = this.generateToken(user);
    
    // Create audit log
    await storage.createAuditLog({
      userId: user.id,
      tenantId: user.tenantId,
      action: "user_registered",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email },
      ipAddress: null,
      userAgent: null,
    });

    // Send welcome notification
    await notificationService.notifyWelcome({
      email: user.email,
      name: user.username
    });

    logger.authEvent('user_registered', user.id, { email: user.email });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async loginUser(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<{ user: Omit<User, 'password'>, token: string }> {
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await storage.getUserByEmail(email);
    
    if (!user || user.password !== password) {
      // Create failed login audit log
      await storage.createAuditLog({
        userId: null,
        tenantId: user?.tenantId || null,
        action: "login_failed",
        resourceType: "user",
        resourceId: user?.id || null,
        metadata: { email, reason: "invalid_credentials" },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is disabled', 401);
    }
    
    // Create successful login audit log
    await storage.createAuditLog({
      userId: user.id,
      tenantId: user.tenantId,
      action: "login_successful",
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  static async getDemoCredentials() {
    return {
      superAdmin: { email: "admin@tatuticket.com", password: "admin123", role: "super_admin" },
      empresa: { email: "empresa@test.com", password: "empresa123", role: "admin" },
      cliente: { email: "cliente@test.com", password: "cliente123", role: "user" },
      agent: { email: "maria.santos@techcorp.com", password: "agent123", role: "agent" },
      manager: { email: "ana.costa@techcorp.com", password: "manager123", role: "manager" }
    };
  }
}