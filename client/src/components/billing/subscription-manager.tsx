import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  DollarSign,
  Building,
  Zap,
  Shield,
  Star
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

interface UsageMetrics {
  tickets: { current: number; limit: number; };
  users: { current: number; limit: number; };
  storage: { current: number; limit: number; }; // in GB
  apiCalls: { current: number; limit: number; };
}

interface BillingHistory {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    tickets: number;
    users: number;
    storage: number;
    apiCalls: number;
  };
  popular?: boolean;
}

const AVAILABLE_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 29,
    interval: 'month',
    features: [
      'Up to 500 tickets/month',
      '5 team members',
      '10GB storage',
      'Email support',
      'Basic analytics'
    ],
    limits: {
      tickets: 500,
      users: 5,
      storage: 10,
      apiCalls: 1000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses with advanced needs',
    price: 99,
    interval: 'month',
    features: [
      'Up to 2,000 tickets/month',
      '25 team members',
      '100GB storage',
      'Priority support',
      'Advanced analytics',
      'Custom workflows',
      'API access'
    ],
    limits: {
      tickets: 2000,
      users: 25,
      storage: 100,
      apiCalls: 10000
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with complex requirements',
    price: 299,
    interval: 'month',
    features: [
      'Unlimited tickets',
      'Unlimited team members',
      '1TB storage',
      '24/7 premium support',
      'Advanced analytics & reporting',
      'Custom workflows & automation',
      'Full API access',
      'SSO integration',
      'Custom SLAs'
    ],
    limits: {
      tickets: -1, // unlimited
      users: -1,   // unlimited
      storage: 1000,
      apiCalls: 100000
    }
  }
];

const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub_1234567890',
  tenantId: 'tenant_abc123',
  planId: 'professional',
  planName: 'Professional',
  status: 'active',
  currentPeriodStart: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-02-01'),
  nextBillingDate: new Date('2025-02-01'),
  amount: 99,
  currency: 'USD',
  interval: 'month',
  cancelAtPeriodEnd: false
};

const MOCK_USAGE: UsageMetrics = {
  tickets: { current: 1247, limit: 2000 },
  users: { current: 18, limit: 25 },
  storage: { current: 45.2, limit: 100 },
  apiCalls: { current: 7540, limit: 10000 }
};

const MOCK_BILLING_HISTORY: BillingHistory[] = [
  {
    id: 'inv_001',
    date: new Date('2025-01-01'),
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - January 2025',
    invoiceUrl: '/invoices/inv_001.pdf'
  },
  {
    id: 'inv_002',
    date: new Date('2024-12-01'),
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - December 2024',
    invoiceUrl: '/invoices/inv_002.pdf'
  },
  {
    id: 'inv_003',
    date: new Date('2024-11-01'),
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - November 2024',
    invoiceUrl: '/invoices/inv_003.pdf'
  }
];

export function SubscriptionManager() {
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/billing/subscription'],
    queryFn: async () => {
      // Mock API call
      return MOCK_SUBSCRIPTION;
    },
  });

  const { data: usage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['/api/billing/usage'],
    queryFn: async () => {
      // Mock API call  
      return MOCK_USAGE;
    },
  });

  const { data: billingHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/billing/history'],
    queryFn: async () => {
      // Mock API call
      return MOCK_BILLING_HISTORY;
    },
  });

  const upgradePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to upgrade plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      setShowPlanSelector(false);
      toast({
        title: 'Success',
        description: 'Your plan has been upgraded successfully',
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      setShowCancelDialog(false);
      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription will remain active until the end of the current billing period',
      });
    },
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-red-100 text-red-800">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-100 text-gray-800">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const currentPlan = AVAILABLE_PLANS.find(plan => plan.id === subscription?.planId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-muted-foreground">Manage your billing, usage, and subscription plans</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPlanSelector(true)}
            data-testid="button-change-plan"
          >
            <Settings className="h-4 w-4 mr-2" />
            Change Plan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Current Subscription
                  {getStatusBadge(subscription?.status || 'active')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{subscription?.planName}</h3>
                    <p className="text-muted-foreground">{currentPlan?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatCurrency(subscription?.amount || 0, subscription?.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">per {subscription?.interval}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Current Period</span>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.currentPeriodStart.toLocaleDateString()} - {subscription?.currentPeriodEnd.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Billing Date</span>
                  <span className="text-sm font-medium">
                    {subscription?.nextBillingDate.toLocaleDateString()}
                  </span>
                </div>

                {subscription?.cancelAtPeriodEnd && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Subscription will cancel at period end
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Tickets</span>
                      <span className="text-sm text-muted-foreground">
                        {usage?.tickets.current} / {usage?.tickets.limit === -1 ? '∞' : usage?.tickets.limit}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usage?.tickets.current || 0, usage?.tickets.limit || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Team Members</span>
                      <span className="text-sm text-muted-foreground">
                        {usage?.users.current} / {usage?.users.limit === -1 ? '∞' : usage?.users.limit}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usage?.users.current || 0, usage?.users.limit || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Storage</span>
                      <span className="text-sm text-muted-foreground">
                        {usage?.storage.current}GB / {usage?.storage.limit}GB
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usage?.storage.current || 0, usage?.storage.limit || 1)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">API Calls</span>
                      <span className="text-sm text-muted-foreground">
                        {usage?.apiCalls.current} / {usage?.apiCalls.limit === -1 ? '∞' : usage?.apiCalls.limit}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usage?.apiCalls.current || 0, usage?.apiCalls.limit || 1)}
                      className="h-2"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPlanSelector(true)}
                  data-testid="button-upgrade-plan"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <Badge variant="outline">
                    {Math.round(getUsagePercentage(usage?.tickets.current || 0, usage?.tickets.limit || 1))}%
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">Tickets</h3>
                <p className="text-2xl font-bold mb-2">{usage?.tickets.current.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  of {usage?.tickets.limit === -1 ? 'unlimited' : usage?.tickets.limit.toLocaleString()} limit
                </p>
                <Progress 
                  value={getUsagePercentage(usage?.tickets.current || 0, usage?.tickets.limit || 1)}
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                  <Badge variant="outline">
                    {Math.round(getUsagePercentage(usage?.users.current || 0, usage?.users.limit || 1))}%
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">Team Members</h3>
                <p className="text-2xl font-bold mb-2">{usage?.users.current}</p>
                <p className="text-sm text-muted-foreground">
                  of {usage?.users.limit === -1 ? 'unlimited' : usage?.users.limit} limit
                </p>
                <Progress 
                  value={getUsagePercentage(usage?.users.current || 0, usage?.users.limit || 1)}
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Building className="h-8 w-8 text-purple-600" />
                  <Badge variant="outline">
                    {Math.round(getUsagePercentage(usage?.storage.current || 0, usage?.storage.limit || 1))}%
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">Storage</h3>
                <p className="text-2xl font-bold mb-2">{usage?.storage.current}GB</p>
                <p className="text-sm text-muted-foreground">
                  of {usage?.storage.limit}GB limit
                </p>
                <Progress 
                  value={getUsagePercentage(usage?.storage.current || 0, usage?.storage.limit || 1)}
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="h-8 w-8 text-orange-600" />
                  <Badge variant="outline">
                    {Math.round(getUsagePercentage(usage?.apiCalls.current || 0, usage?.apiCalls.limit || 1))}%
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">API Calls</h3>
                <p className="text-2xl font-bold mb-2">{usage?.apiCalls.current.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  of {usage?.apiCalls.limit === -1 ? 'unlimited' : usage?.apiCalls.limit.toLocaleString()} limit
                </p>
                <Progress 
                  value={getUsagePercentage(usage?.apiCalls.current || 0, usage?.apiCalls.limit || 1)}
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory?.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{bill.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {bill.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(bill.amount)}</p>
                        <div className="flex items-center gap-1">
                          {bill.status === 'paid' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : bill.status === 'pending' ? (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm capitalize ${
                            bill.status === 'paid' ? 'text-green-600' :
                            bill.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {bill.status}
                          </span>
                        </div>
                      </div>
                      {bill.invoiceUrl && (
                        <Button size="sm" variant="outline" data-testid={`button-download-invoice-${bill.id}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AVAILABLE_PLANS.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-center">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardTitle>
                  <div className="text-center">
                    <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${subscription?.planId === plan.id ? 'bg-gray-100' : ''}`}
                    disabled={subscription?.planId === plan.id}
                    onClick={() => {
                      if (subscription?.planId !== plan.id) {
                        setSelectedPlan(plan);
                        upgradePlanMutation.mutate(plan.id);
                      }
                    }}
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    {subscription?.planId === plan.id ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Selector Dialog */}
      <Dialog open={showPlanSelector} onOpenChange={setShowPlanSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_PLANS.map((plan) => (
              <Card key={plan.id} className={`cursor-pointer hover:shadow-md transition-shadow ${
                subscription?.planId === plan.id ? 'border-blue-500' : ''
              }`}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                  <p className="text-2xl font-bold mb-4">{formatCurrency(plan.price)}/{plan.interval}</p>
                  <ul className="space-y-1 text-sm">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4"
                    disabled={subscription?.planId === plan.id}
                    onClick={() => upgradePlanMutation.mutate(plan.id)}
                    data-testid={`button-upgrade-to-${plan.id}`}
                  >
                    {subscription?.planId === plan.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Subscription
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => cancelSubscriptionMutation.mutate()}
                disabled={cancelSubscriptionMutation.isPending}
              >
                {cancelSubscriptionMutation.isPending ? 'Canceling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}