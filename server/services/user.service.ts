import { storage } from '../storage';
import { InsertUser, type User } from '@shared/schema';
import { AppError } from '../middlewares/error.middleware';
import crypto from 'crypto';

export class UserService {
  static async getUsers(tenantId: string, role?: string): Promise<Omit<User, 'password'>[]> {
    if (!tenantId) {
      throw new AppError('tenantId is required', 400);
    }
    
    // Get all users for the tenant
    const users = await storage.getUsersByTenant(tenantId);
    
    // Filter by role if specified
    let filteredUsers = users;
    if (role) {
      const roles = role.split(',');
      filteredUsers = users.filter(user => roles.includes(user.role));
    }
    
    // Remove passwords from response
    return filteredUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  static async createUser(userData: InsertUser, ipAddress?: string, userAgent?: string): Promise<Omit<User, 'password'>> {
    // Hash password before storing
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    const user = await storage.createUser(userData);
    
    // Don't return password in response
    const { password, ...userResponse } = user;
    
    await storage.createAuditLog({
      userId: null,
      tenantId: userData.tenantId || null,
      action: "user_created",
      resourceType: "user",
      resourceId: user.id,
      metadata: { username: user.username, role: user.role },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    return userResponse;
  }

  static async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await storage.getUser(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Don't return password
    const { password, ...userResponse } = user;
    return userResponse;
  }

  static async updateUser(id: string, updates: Partial<User>, ipAddress?: string, userAgent?: string): Promise<Omit<User, 'password'>> {
    // If password is empty, remove it from updates
    if (updates.password === "") {
      delete updates.password;
    } else if (updates.password) {
      // Hash new password
      updates.password = await this.hashPassword(updates.password);
    }
    
    const user = await storage.updateUser(id, updates);
    
    // Don't return password
    const { password, ...userResponse } = user;
    
    await storage.createAuditLog({
      userId: id,
      tenantId: user.tenantId,
      action: "user_updated",
      resourceType: "user", 
      resourceId: user.id,
      metadata: { updates: Object.keys(updates) },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
    
    return userResponse;
  }

  private static async hashPassword(password: string): Promise<string> {
    // Generate salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash password with salt using pbkdf2
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(':');
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(hash === derivedKey.toString('hex'));
      });
    });
  }
}