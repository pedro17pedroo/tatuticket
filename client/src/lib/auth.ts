import { apiRequest } from "./queryClient";
import { z } from "zod";

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  tenantId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  tenantId: z.string().optional(),
  role: z.string().default("user"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
  };

  private constructor() {
    // Load user from localStorage on initialization
    const savedUser = localStorage.getItem('tatuticket_user');
    if (savedUser) {
      try {
        this.authState.user = JSON.parse(savedUser);
        this.authState.isAuthenticated = true;
      } catch (error) {
        localStorage.removeItem('tatuticket_user');
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginData): Promise<User> {
    const validatedData = loginSchema.parse(credentials);
    
    const response = await apiRequest("POST", "/api/auth/login", validatedData);
    const data = await response.json();
    
    if (data.user) {
      this.authState.user = data.user;
      this.authState.isAuthenticated = true;
      localStorage.setItem('tatuticket_user', JSON.stringify(data.user));
    }
    
    return data.user;
  }

  async register(userData: RegisterData): Promise<User> {
    const validatedData = registerSchema.parse(userData);
    
    const response = await apiRequest("POST", "/api/auth/register", validatedData);
    const data = await response.json();
    
    return data.user;
  }

  logout(): void {
    this.authState.user = null;
    this.authState.isAuthenticated = false;
    localStorage.removeItem('tatuticket_user');
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  hasRole(role: string): boolean {
    return this.authState.user?.role === role;
  }

  hasTenant(): boolean {
    return !!this.authState.user?.tenantId;
  }

  getTenantId(): string | undefined {
    return this.authState.user?.tenantId;
  }

  canAccessPortal(portal: 'saas' | 'organization' | 'customer' | 'admin'): boolean {
    if (!this.isAuthenticated()) {
      return portal === 'saas'; // Only SaaS portal is public
    }

    const user = this.getCurrentUser();
    if (!user) return false;

    switch (portal) {
      case 'saas':
        return true; // Everyone can access SaaS portal
      case 'organization':
        return ['agent', 'manager', 'admin'].includes(user.role) && !!user.tenantId;
      case 'customer':
        return user.role === 'user' && !!user.tenantId;
      case 'admin':
        return user.role === 'super_admin';
      default:
        return false;
    }
  }
}

export const authService = AuthService.getInstance();
