import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, Check, X, Calendar, DollarSign, 
  AlertCircle, Zap, Crown, Building, Users 
} from 'lucide-react';
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isPopular?: boolean;
  limits: {
    users: number;
    tickets: number;
    storage: string;
  };
}

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  planId: string;
  planName: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

interface Invoice {
  id: string;
  number: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  created: string;
  dueDate: string;
  pdfUrl?: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para pequenas equipes começando',
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      'Até 5 usuários',
      '500 tickets/mês',
      '1GB de armazenamento',
      'Base de conhecimento básica',
      'Relatórios básicos',
      'Suporte por email',
    ],
    limits: {
      users: 5,
      tickets: 500,
      storage: '1GB',
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Para equipes crescendo rapidamente',
    priceMonthly: 79,
    priceYearly: 790,
    isPopular: true,
    features: [
      'Até 25 usuários',
      '2.000 tickets/mês',
      '10GB de armazenamento',
      'Base de conhecimento avançada',
      'SLA personalizado',
      'Automações básicas',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    limits: {
      users: 25,
      tickets: 2000,
      storage: '10GB',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para organizações que precisam de mais',
    priceMonthly: 199,
    priceYearly: 1990,
    features: [
      'Usuários ilimitados',
      'Tickets ilimitados',
      '100GB de armazenamento',
      'IA integrada',
      'Automações avançadas',
      'API completa',
      'SSO e SAML',
      'Suporte 24/7',
      'Gerente de conta dedicado',
    ],
    limits: {
      users: -1, // Unlimited
      tickets: -1, // Unlimited
      storage: '100GB',
    },
  },
];

function CheckoutForm({ planId, isYearly }: { planId: string; isYearly: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ paymentMethodId }: { paymentMethodId: string }) => {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isYearly,
          paymentMethodId,
          tenantId,
          userId: user?.id,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Assinatura ativada com sucesso!",
        description: "Sua nova assinatura já está ativa e você pode começar a usar todos os recursos.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: user?.name || '',
        email: user?.email || '',
      },
    });

    if (error) {
      toast({
        title: "Erro no cartão",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    createSubscriptionMutation.mutate({ paymentMethodId: paymentMethod.id });
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-subscribe"
      >
        {isProcessing ? 'Processando...' : 'Assinar Agora'}
      </Button>
    </form>
  );
}

export function SubscriptionManager() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  // Fetch current subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<Subscription>({
    queryKey: ['/api/billing/subscription', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/billing/subscription?tenantId=${tenantId}`);
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to fetch subscription');
      }
      if (response.status === 404) return null;
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch billing history
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['/api/billing/invoices', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/billing/invoices?tenantId=${tenantId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura será cancelada no final do período atual.",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      
      if (!response.ok) throw new Error('Failed to reactivate subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Assinatura reativada",
        description: "Sua assinatura continuará normalmente.",
      });
    },
  });

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    setIsCheckoutOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, text: 'Ativa', icon: Check },
      canceled: { variant: 'secondary' as const, text: 'Cancelada', icon: X },
      past_due: { variant: 'destructive' as const, text: 'Em Atraso', icon: AlertCircle },
      trialing: { variant: 'outline' as const, text: 'Teste', icon: Calendar },
      incomplete: { variant: 'destructive' as const, text: 'Incompleta', icon: AlertCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'professional': return <Crown className="h-5 w-5 text-purple-600" />;
      case 'enterprise': return <Building className="h-5 w-5 text-orange-600" />;
      default: return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Assinatura Atual</span>
              {getStatusBadge(subscription.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getPlanIcon(subscription.planId)}
                <div>
                  <h3 className="font-semibold">{subscription.planName}</h3>
                  <p className="text-sm text-gray-600">
                    ${subscription.amount / 100} / {subscription.interval === 'month' ? 'mês' : 'ano'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Próximo pagamento</p>
                <p className="font-semibold">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {subscription.cancelAtPeriodEnd ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => reactivateSubscriptionMutation.mutate()}
                  data-testid="button-reactivate"
                >
                  Reativar Assinatura
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  data-testid="button-cancel"
                >
                  Cancelar Assinatura
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <div className="flex items-center gap-4">
            <span className={!isYearly ? 'font-semibold' : 'text-gray-600'}>Mensal</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={isYearly ? 'font-semibold' : 'text-gray-600'}>
              Anual <Badge variant="secondary" className="ml-1">-17%</Badge>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.isPopular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Mais Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      ${isYearly ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    <span className="text-gray-600">/{isYearly ? 'ano' : 'mês'}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className="w-full"
                    variant={plan.isPopular ? 'default' : 'outline'}
                    onClick={() => handlePlanSelection(plan.id)}
                    disabled={subscription?.planId === plan.id}
                    data-testid={`button-select-${plan.id}`}
                  >
                    {subscription?.planId === plan.id ? 'Plano Atual' : 'Selecionar Plano'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Cobrança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Fatura #{invoice.number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.created).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">${invoice.amount / 100}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    {invoice.pdfUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                          Download PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Assinatura</DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <Elements stripe={stripePromise}>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold">
                    {PRICING_PLANS.find(p => p.id === selectedPlan)?.name}
                  </h3>
                  <p className="text-2xl font-bold">
                    ${isYearly 
                      ? PRICING_PLANS.find(p => p.id === selectedPlan)?.priceYearly
                      : PRICING_PLANS.find(p => p.id === selectedPlan)?.priceMonthly
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    por {isYearly ? 'ano' : 'mês'}
                  </p>
                </div>
                
                <CheckoutForm planId={selectedPlan} isYearly={isYearly} />
              </div>
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}