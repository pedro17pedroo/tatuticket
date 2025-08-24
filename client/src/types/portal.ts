export type PortalType = 'saas' | 'organization' | 'customer' | 'admin';

export interface PortalProgress {
  status: string;
  percentage: number;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResolutionTime: number;
}

export interface GlobalStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalTickets: number;
}

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
