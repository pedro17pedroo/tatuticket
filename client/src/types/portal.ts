export type PortalType = 'saas' | 'organization' | 'customer' | 'admin';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonAction: () => void;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  avgResolutionTime: number;
  avgResponseTime: number;
  satisfaction: number;
}

export interface DashboardMetrics {
  tickets: TicketStats;
  agents: {
    total: number;
    online: number;
    busy: number;
    performance: number;
  };
  customers: {
    total: number;
    active: number;
    satisfaction: number;
  };
  sla: {
    compliance: number;
    breaches: number;
    avgResponseTime: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'agent' | 'manager' | 'admin' | 'super_admin';
  tenantId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'freemium' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  settings?: Record<string, any>;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  tenantId: string;
  customerId?: string;
  assigneeId?: string;
  departmentId?: string;
  teamId?: string;
  slaDeadline?: string;
  timeSpent: number;
  cost: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  customer?: {
    name: string;
    email?: string;
  };
  assignee?: {
    username: string;
    email: string;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  managerEmail?: string;
  slaConfig?: Record<string, any>;
  status: 'active' | 'inactive';
  isActive: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  tenantId: string;
  leaderId?: string;
  maxCapacity: number;
  currentSize: number;
  specialties?: string[];
  status: 'active' | 'inactive';
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  tenantId: string;
  tier: 'standard' | 'premium' | 'enterprise';
  hoursBankBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  slug: string;
  tenantId: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    username: string;
    email: string;
  };
}

export interface SlaConfig {
  id: string;
  name: string;
  tenantId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responseTime: number; // in hours
  resolutionTime: number; // in hours
  isActive: boolean;
  createdAt: string;
}

export interface GlobalStats {
  totalTenants: number;
  totalUsers: number;
  totalTickets: number;
  activeToday: number;
  mrr: number;
  uptime: number;
}