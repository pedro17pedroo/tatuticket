import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Mock subscription data
const MOCK_SUBSCRIPTION = {
  id: 'sub_1',
  plan: 'professional',
  status: 'active',
  billingCycle: 'monthly',
  amount: 99,
  currency: 'brl',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
  trialEnd: null,
  cancelAtPeriodEnd: false,
  usage: {
    agents: { current: 8, limit: 10 },
    tickets: { current: 1245, limit: 2000 },
    storage: { current: 45, limit: 100 }
  },
  nextInvoice: {
    amount: 99,
    date: new Date('2024-02-01')
  }
};

const MOCK_INVOICES = [
  {
    id: 'inv_1',
    amount: 99,
    status: 'paid',
    date: new Date('2024-01-01'),
    description: 'TatuTicket Professional - Janeiro 2024',
    downloadUrl: '/invoices/inv_1.pdf'
  },
  {
    id: 'inv_2',
    amount: 99,
    status: 'paid',
    date: new Date('2023-12-01'),
    description: 'TatuTicket Professional - Dezembro 2023',
    downloadUrl: '/invoices/inv_2.pdf'
  },
  {
    id: 'inv_3',
    amount: 99,
    status: 'paid',
    date: new Date('2023-11-01'),
    description: 'TatuTicket Professional - Novembro 2023',
    downloadUrl: '/invoices/inv_3.pdf'
  }
];

const PLAN_OPTIONS = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 49, yearly: 470 },
    features: ['Até 3 agentes', '500 tickets/mês', 'Email e chat', 'Relatórios básicos'],
    limits: { agents: 3, tickets: 500, storage: 10 }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: { monthly: 99, yearly: 950 },
    features: ['Até 10 agentes', '2000 tickets/mês', 'Automação básica', 'Integrações', 'SLA básico'],
    limits: { agents: 10, tickets: 2000, storage: 100 },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 199, yearly: 1910 },
    features: ['Agentes ilimitados', 'Tickets ilimitados', 'Automação avançada', 'API completa', 'SLA personalizado'],
    limits: { agents: 999, tickets: 99999, storage: 1000 }
  }
];

export function SubscriptionManager() {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription = MOCK_SUBSCRIPTION, isLoading } = useQuery({
    queryKey: ['/api/subscriptions', 'tenant-1'],
    enabled: true,
  });

  const { data: invoices = MOCK_INVOICES } = useQuery({
    queryKey: ['/api/subscriptions/invoices', 'tenant-1'],
    enabled: true,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ action, planId, billingCycle }: { 
      action: string; 
      planId?: string; 
      billingCycle?: 'monthly' | 'yearly' 
    }) => {
      const response = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          action,
          newPlan: planId,
          billingCycle
        }),
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ 
        title: 'Assinatura atualizada!',
        description: getSuccessMessage(result.action)
      });
      setIsUpgradeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar assinatura',
        description: 'Tente novamente ou entre em contato com o suporte',
        variant: 'destructive'
      });
    },
  });

  const getSuccessMessage = (action: string) => {
    switch (action) {
      case 'upgrade': return 'Plano atualizado com sucesso!';
      case 'downgrade': return 'Plano alterado. Mudanças entrarão em vigor no próximo ciclo.';
      case 'canceled': return 'Assinatura cancelada. Você pode usar o serviço até o fim do período atual.';
      case 'reactivated': return 'Assinatura reativada com sucesso!';
      default: return 'Alteração realizada com sucesso!';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const calculateUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'text-green-600';
    if (percentage < 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentPlan = PLAN_OPTIONS.find(plan => plan.id === subscription.plan);
  const daysUntilRenewal = Math.ceil(
    (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="subscription-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Assinatura</h2>
          <p className="text-muted-foreground">
            Gerencie seu plano, faturamento e uso
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Baixar Fatura
          </Button>
          <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upgrade-plan">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Alterar Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Alterar Plano de Assinatura</DialogTitle>
                <DialogDescription>
                  Escolha o plano ideal para suas necessidades
                </DialogDescription>
              </DialogHeader>
              <PlanUpgradeDialog 
                currentPlan={subscription.plan}
                selectedPlan={selectedPlan}
                billingCycle={billingCycle}
                onPlanSelect={setSelectedPlan}
                onBillingCycleChange={setBillingCycle}
                onConfirm={() => {
                  const action = selectedPlan === subscription.plan ? 'maintain' :
                    PLAN_OPTIONS.findIndex(p => p.id === selectedPlan) > 
                    PLAN_OPTIONS.findIndex(p => p.id === subscription.plan) ? 'upgrade' : 'downgrade';
                  
                  updateSubscriptionMutation.mutate({ 
                    action, 
                    planId: selectedPlan, 
                    billingCycle 
                  });
                }}
                isPending={updateSubscriptionMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Subscription Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPlan?.name}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(subscription.amount)}/{subscription.billingCycle === 'monthly' ? 'mês' : 'ano'}
            </p>
            <div className="mt-2">
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status === 'active' ? 'Ativo' : 
                 subscription.status === 'trialing' ? 'Período de Teste' : 'Cancelado'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Cobrança</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(subscription.nextInvoice.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              em {daysUntilRenewal} dias ({subscription.currentPeriodEnd.toLocaleDateString('pt-BR')})
            </p>
            {subscription.cancelAtPeriodEnd && (
              <Badge variant="destructive" className="mt-2">
                Cancelamento agendado
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Uso</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Agentes:</span>
                <span className={getUsageColor(calculateUsagePercentage(subscription.usage.agents.current, subscription.usage.agents.limit))}>
                  {subscription.usage.agents.current}/{subscription.usage.agents.limit}
                </span>
              </div>
              <Progress 
                value={calculateUsagePercentage(subscription.usage.agents.current, subscription.usage.agents.limit)} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage" data-testid="tab-usage">Uso</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">Faturamento</TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">Planos</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso Atual do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agents Usage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Agentes</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subscription.usage.agents.current} de {subscription.usage.agents.limit}
                  </span>
                </div>
                <Progress 
                  value={calculateUsagePercentage(subscription.usage.agents.current, subscription.usage.agents.limit)} 
                  className="h-3" 
                />
                <p className="text-xs text-muted-foreground">
                  Você está usando {calculateUsagePercentage(subscription.usage.agents.current, subscription.usage.agents.limit).toFixed(1)}% do limite de agentes
                </p>
              </div>

              {/* Tickets Usage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Tickets (este mês)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subscription.usage.tickets.current} de {subscription.usage.tickets.limit}
                  </span>
                </div>
                <Progress 
                  value={calculateUsagePercentage(subscription.usage.tickets.current, subscription.usage.tickets.limit)} 
                  className="h-3" 
                />
                <p className="text-xs text-muted-foreground">
                  {subscription.usage.tickets.limit - subscription.usage.tickets.current} tickets restantes neste período
                </p>
              </div>

              {/* Storage Usage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Armazenamento</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subscription.usage.storage.current}GB de {subscription.usage.storage.limit}GB
                  </span>
                </div>
                <Progress 
                  value={calculateUsagePercentage(subscription.usage.storage.current, subscription.usage.storage.limit)} 
                  className="h-3" 
                />
                <p className="text-xs text-muted-foreground">
                  {subscription.usage.storage.limit - subscription.usage.storage.current}GB de espaço disponível
                </p>
              </div>

              {/* Usage Warnings */}
              {calculateUsagePercentage(subscription.usage.tickets.current, subscription.usage.tickets.limit) > 80 && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <div>
                        <h3 className="font-medium text-orange-800 dark:text-orange-200">
                          Limite de tickets próximo
                        </h3>
                        <p className="text-sm text-orange-600 dark:text-orange-300">
                          Você está próximo do limite mensal de tickets. Considere fazer upgrade do seu plano.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-500' : 
                        invoice.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h4 className="font-medium" data-testid={`invoice-description-${invoice.id}`}>
                          {invoice.description}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {invoice.date.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' : 
                          invoice.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {invoice.status === 'paid' ? 'Pago' : 
                           invoice.status === 'pending' ? 'Pendente' : 'Falhou'}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`download-invoice-${invoice.id}`}>
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_OPTIONS.map((plan) => (
              <Card key={plan.id} className={`relative ${
                plan.id === subscription.plan ? 'ring-2 ring-primary' : ''
              } ${plan.popular ? 'border-primary' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    Mais Popular
                  </Badge>
                )}
                {plan.id === subscription.plan && (
                  <Badge variant="secondary" className="absolute -top-2 right-4">
                    Plano Atual
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {formatCurrency(plan.price[billingCycle])}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600">
                        Economize {formatCurrency(plan.price.monthly * 12 - plan.price.yearly)} por ano
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {plan.id !== subscription.plan ? (
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setIsUpgradeDialogOpen(true);
                      }}
                      data-testid={`select-plan-${plan.id}`}
                    >
                      {PLAN_OPTIONS.findIndex(p => p.id === plan.id) > 
                       PLAN_OPTIONS.findIndex(p => p.id === subscription.plan) ? 
                        'Fazer Upgrade' : 'Fazer Downgrade'}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled>
                      Plano Atual
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Subscription Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações da Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscription.cancelAtPeriodEnd ? (
              <Button 
                variant="outline"
                onClick={() => updateSubscriptionMutation.mutate({ action: 'reactivate' })}
                disabled={updateSubscriptionMutation.isPending}
                data-testid="button-reactivate-subscription"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reativar Assinatura
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => updateSubscriptionMutation.mutate({ action: 'cancel', billingCycle: 'end_of_period' as any })}
                disabled={updateSubscriptionMutation.isPending}
                data-testid="button-cancel-subscription"
              >
                <Clock className="w-4 h-4 mr-2" />
                Cancelar no Final do Período
              </Button>
            )}
            
            <Button variant="outline" data-testid="button-update-payment">
              <CreditCard className="w-4 h-4 mr-2" />
              Atualizar Método de Pagamento
            </Button>
            
            <Button variant="outline" data-testid="button-billing-portal">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Portal de Faturamento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Plan Upgrade Dialog Component
function PlanUpgradeDialog({ 
  currentPlan, 
  selectedPlan, 
  billingCycle, 
  onPlanSelect, 
  onBillingCycleChange,
  onConfirm,
  isPending
}: {
  currentPlan: string;
  selectedPlan: string;
  billingCycle: 'monthly' | 'yearly';
  onPlanSelect: (planId: string) => void;
  onBillingCycleChange: (cycle: 'monthly' | 'yearly') => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onBillingCycleChange('monthly')}
          >
            Mensal
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onBillingCycleChange('yearly')}
          >
            Anual <Badge variant="secondary" className="ml-1">-20%</Badge>
          </Button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLAN_OPTIONS.map((plan) => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
            } ${plan.id === currentPlan ? 'border-blue-200 bg-blue-50' : ''}`}
            onClick={() => onPlanSelect(plan.id)}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="text-2xl font-bold">
                R$ {plan.price[billingCycle]}
                <span className="text-sm font-normal text-muted-foreground">
                  /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                </span>
              </div>
              {plan.id === currentPlan && (
                <Badge variant="outline">Plano Atual</Badge>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <DialogFooter>
        <Button 
          onClick={onConfirm}
          disabled={isPending || selectedPlan === currentPlan}
          data-testid="button-confirm-plan-change"
        >
          {isPending ? 'Processando...' : 'Confirmar Alteração'}
        </Button>
      </DialogFooter>
    </div>
  );
}