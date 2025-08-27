import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, Users, CreditCard, CheckCircle, ArrowRight, ArrowLeft, 
  Star, Zap, Shield, Globe, Mail, Phone, Lock, Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
  period: 'monthly' | 'yearly';
  savings?: number;
}

interface OrganizationInfo {
  companyName: string;
  industry: string;
  size: string;
  country: string;
  website: string;
  description: string;
}

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
}

interface PaymentInfo {
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'organization',
    title: 'Informações da Empresa',
    description: 'Conte-nos sobre sua organização',
    icon: Building
  },
  {
    id: 'user',
    title: 'Informações do Usuário',
    description: 'Seus dados pessoais e profissionais',
    icon: Users
  },
  {
    id: 'plan',
    title: 'Escolha seu Plano',
    description: 'Selecione o plano ideal para sua empresa',
    icon: Star
  },
  {
    id: 'payment',
    title: 'Pagamento',
    description: 'Configure seu método de pagamento',
    icon: CreditCard
  },
  {
    id: 'confirmation',
    title: 'Confirmação',
    description: 'Revise e confirme suas informações',
    icon: CheckCircle
  }
];

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'monthly',
    features: [
      'Até 3 agentes',
      '500 tickets/mês',
      'Base de conhecimento',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 89,
    period: 'monthly',
    recommended: true,
    features: [
      'Até 10 agentes',
      '2.000 tickets/mês',
      'Automação avançada',
      'Integrações API',
      'Relatórios avançados',
      'Suporte prioritário',
      'SLA personalizado'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    period: 'monthly',
    features: [
      'Agentes ilimitados',
      'Tickets ilimitados',
      'IA avançada',
      'White-label',
      'Integração LDAP',
      'Suporte dedicado',
      'SLA garantido 99.9%',
      'Treinamento personalizado'
    ]
  }
];

function PaymentForm({ onPaymentSuccess }: { onPaymentSuccess: (paymentMethodId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setProcessing(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
      setProcessing(false);
    } else {
      onPaymentSuccess(paymentMethod.id);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        disabled={!stripe || processing}
        className="w-full"
        data-testid="submit-payment"
      >
        {processing ? 'Processando...' : 'Confirmar Pagamento'}
      </Button>
    </form>
  );
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({
    companyName: '',
    industry: '',
    size: '',
    country: 'Brasil',
    website: '',
    description: ''
  });
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: ''
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    planId: 'professional',
    billingPeriod: 'monthly'
  });
  const [isCompleted, setIsCompleted] = useState(false);

  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      // Step 1: Create Stripe customer and subscription if payment method provided
      let stripeSubscriptionId = null;
      let stripeCustomerId = null;
      
      if (paymentInfo.paymentMethodId && paymentInfo.planId !== 'starter') {
        const stripeResponse = await fetch('/api/billing/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethodId: paymentInfo.paymentMethodId,
            planId: paymentInfo.planId,
            billingPeriod: paymentInfo.billingPeriod,
            customerInfo: {
              email: userInfo.email,
              name: `${userInfo.firstName} ${userInfo.lastName}`,
              companyName: organizationInfo.companyName
            }
          }),
        });

        if (!stripeResponse.ok) {
          throw new Error('Falha ao processar pagamento');
        }

        const stripeData = await stripeResponse.json();
        stripeSubscriptionId = stripeData.subscriptionId;
        stripeCustomerId = stripeData.customerId;
      }

      // Step 2: Create tenant and user account
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email,
          password: 'temp_password_123',
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          role: 'admin',
          tenantName: organizationInfo.companyName,
          tenantSlug: organizationInfo.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          tenantPlan: paymentInfo.planId,
          stripeSubscriptionId,
          stripeCustomerId,
          organizationInfo,
          userInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar conta');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsCompleted(true);
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao TatuTicket. Você será redirecionado para o portal da organização.",
      });
      
      // Redirect to organization portal after 3 seconds
      setTimeout(() => {
        window.location.href = '/organization';
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaymentSuccess = (paymentMethodId: string) => {
    setPaymentInfo(prev => ({ ...prev, paymentMethodId }));
    handleNext();
  };

  const handleComplete = () => {
    const selectedPlan = PLANS.find(p => p.id === paymentInfo.planId);
    
    createTenantMutation.mutate({
      organization: organizationInfo,
      user: userInfo,
      payment: paymentInfo,
      plan: selectedPlan
    });
  };

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const selectedPlan = PLANS.find(p => p.id === paymentInfo.planId);

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center" data-testid="onboarding-success">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Bem-vindo ao TatuTicket!</h1>
            <p className="text-gray-600 mb-4">
              Sua conta foi criada com sucesso. Você será redirecionado para o portal da organização.
            </p>
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" data-testid="onboarding-wizard">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configure sua conta TatuTicket
          </h1>
          <p className="text-gray-600">
            Alguns passos rápidos para começar a transformar seu atendimento
          </p>
        </div>

        {/* Progress */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-4">
            {ONBOARDING_STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center ${index < ONBOARDING_STEPS.length - 1 ? 'flex-1' : ''}`}
                data-testid={`step-indicator-${step.id}`}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2
                  ${index <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}>
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    React.createElement(step.icon, { className: "w-5 h-5" })
                  )}
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4
                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(ONBOARDING_STEPS[currentStep].icon, { className: "w-5 h-5" })}
                {ONBOARDING_STEPS[currentStep].title}
              </CardTitle>
              <p className="text-gray-600">{ONBOARDING_STEPS[currentStep].description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Organization Info */}
              {currentStep === 0 && (
                <div className="space-y-4" data-testid="step-organization">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Nome da Empresa *</Label>
                      <Input
                        id="companyName"
                        value={organizationInfo.companyName}
                        onChange={(e) => setOrganizationInfo(prev => ({ 
                          ...prev, companyName: e.target.value 
                        }))}
                        placeholder="Ex: TechCorp Solutions"
                        required
                        data-testid="input-company-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Setor *</Label>
                      <Select 
                        value={organizationInfo.industry} 
                        onValueChange={(value) => setOrganizationInfo(prev => ({ 
                          ...prev, industry: value 
                        }))}
                      >
                        <SelectTrigger data-testid="select-industry">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Tecnologia</SelectItem>
                          <SelectItem value="finance">Financeiro</SelectItem>
                          <SelectItem value="healthcare">Saúde</SelectItem>
                          <SelectItem value="education">Educação</SelectItem>
                          <SelectItem value="retail">Varejo</SelectItem>
                          <SelectItem value="manufacturing">Manufatura</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="size">Tamanho da Empresa *</Label>
                      <Select 
                        value={organizationInfo.size} 
                        onValueChange={(value) => setOrganizationInfo(prev => ({ 
                          ...prev, size: value 
                        }))}
                      >
                        <SelectTrigger data-testid="select-company-size">
                          <SelectValue placeholder="Número de funcionários" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 funcionários</SelectItem>
                          <SelectItem value="11-50">11-50 funcionários</SelectItem>
                          <SelectItem value="51-200">51-200 funcionários</SelectItem>
                          <SelectItem value="201-1000">201-1000 funcionários</SelectItem>
                          <SelectItem value="1000+">1000+ funcionários</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={organizationInfo.website}
                        onChange={(e) => setOrganizationInfo(prev => ({ 
                          ...prev, website: e.target.value 
                        }))}
                        placeholder="https://exemplo.com"
                        data-testid="input-website"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição da Empresa</Label>
                    <Textarea
                      id="description"
                      value={organizationInfo.description}
                      onChange={(e) => setOrganizationInfo(prev => ({ 
                        ...prev, description: e.target.value 
                      }))}
                      placeholder="Conte-nos brevemente sobre sua empresa e como usará o TatuTicket..."
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: User Info */}
              {currentStep === 1 && (
                <div className="space-y-4" data-testid="step-user">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={userInfo.firstName}
                        onChange={(e) => setUserInfo(prev => ({ 
                          ...prev, firstName: e.target.value 
                        }))}
                        placeholder="João"
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={userInfo.lastName}
                        onChange={(e) => setUserInfo(prev => ({ 
                          ...prev, lastName: e.target.value 
                        }))}
                        placeholder="Silva"
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo(prev => ({ 
                          ...prev, email: e.target.value 
                        }))}
                        placeholder="joao@empresa.com"
                        required
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo(prev => ({ 
                          ...prev, phone: e.target.value 
                        }))}
                        placeholder="+55 11 99999-9999"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Cargo *</Label>
                      <Input
                        id="role"
                        value={userInfo.role}
                        onChange={(e) => setUserInfo(prev => ({ 
                          ...prev, role: e.target.value 
                        }))}
                        placeholder="Ex: Gerente de TI"
                        required
                        data-testid="input-role"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Departamento</Label>
                      <Input
                        id="department"
                        value={userInfo.department}
                        onChange={(e) => setUserInfo(prev => ({ 
                          ...prev, department: e.target.value 
                        }))}
                        placeholder="Ex: Tecnologia"
                        data-testid="input-department"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Plan Selection */}
              {currentStep === 2 && (
                <div className="space-y-6" data-testid="step-plan">
                  <Tabs value={paymentInfo.billingPeriod} onValueChange={(value: string) => 
                    setPaymentInfo(prev => ({ ...prev, billingPeriod: value as 'monthly' | 'yearly' }))
                  }>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="monthly" data-testid="tab-monthly">Mensal</TabsTrigger>
                      <TabsTrigger value="yearly" data-testid="tab-yearly">
                        Anual <Badge variant="secondary" className="ml-1">-20%</Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="monthly" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLANS.map((plan) => (
                          <Card 
                            key={plan.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              paymentInfo.planId === plan.id 
                                ? 'ring-2 ring-blue-600 shadow-lg' 
                                : ''
                            } ${plan.recommended ? 'relative' : ''}`}
                            onClick={() => setPaymentInfo(prev => ({ ...prev, planId: plan.id }))}
                            data-testid={`plan-${plan.id}`}
                          >
                            {plan.recommended && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <Badge className="bg-orange-500 hover:bg-orange-600">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Recomendado
                                </Badge>
                              </div>
                            )}
                            <CardContent className="p-6">
                              <div className="text-center">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <div className="mt-2 mb-4">
                                  <span className="text-3xl font-bold">R$ {plan.price}</span>
                                  <span className="text-gray-600">/mês</span>
                                </div>
                                <ul className="space-y-2 text-sm">
                                  {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="yearly" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLANS.map((plan) => {
                          const yearlyPrice = Math.round(plan.price * 12 * 0.8);
                          const monthlyEquivalent = Math.round(yearlyPrice / 12);
                          
                          return (
                            <Card 
                              key={plan.id}
                              className={`cursor-pointer transition-all hover:shadow-lg ${
                                paymentInfo.planId === plan.id 
                                  ? 'ring-2 ring-blue-600 shadow-lg' 
                                  : ''
                              } ${plan.recommended ? 'relative' : ''}`}
                              onClick={() => setPaymentInfo(prev => ({ ...prev, planId: plan.id }))}
                              data-testid={`plan-yearly-${plan.id}`}
                            >
                              {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <Badge className="bg-orange-500 hover:bg-orange-600">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Recomendado
                                  </Badge>
                                </div>
                              )}
                              <CardContent className="p-6">
                                <div className="text-center">
                                  <h3 className="text-xl font-bold">{plan.name}</h3>
                                  <div className="mt-2 mb-1">
                                    <span className="text-3xl font-bold">R$ {monthlyEquivalent}</span>
                                    <span className="text-gray-600">/mês</span>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-4">
                                    Cobrado anualmente: R$ {yearlyPrice}
                                  </div>
                                  <ul className="space-y-2 text-sm">
                                    {plan.features.map((feature, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Step 4: Payment */}
              {currentStep === 3 && (
                <div className="space-y-6" data-testid="step-payment">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
                    <div className="flex justify-between items-center">
                      <span>Plano {selectedPlan?.name} ({paymentInfo.billingPeriod === 'yearly' ? 'Anual' : 'Mensal'})</span>
                      <span className="font-semibold">
                        R$ {paymentInfo.billingPeriod === 'yearly' 
                          ? Math.round((selectedPlan?.price || 0) * 12 * 0.8 / 12)
                          : selectedPlan?.price
                        }/mês
                      </span>
                    </div>
                    {paymentInfo.billingPeriod === 'yearly' && (
                      <div className="text-sm text-green-600 mt-1">
                        Economia de 20% com pagamento anual
                      </div>
                    )}
                  </div>

                  <Elements stripe={stripePromise}>
                    <PaymentForm onPaymentSuccess={handlePaymentSuccess} />
                  </Elements>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Seus dados de pagamento são processados de forma segura pelo Stripe. 
                      Nós não armazenamos informações de cartão de crédito.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-6" data-testid="step-confirmation">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Quase pronto!</h3>
                    <p className="text-gray-600">
                      Revise suas informações e confirme para criar sua conta
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Empresa</h4>
                      <p>{organizationInfo.companyName}</p>
                      <p className="text-sm text-gray-600">
                        {organizationInfo.industry} • {organizationInfo.size}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Administrador</h4>
                      <p>{userInfo.firstName} {userInfo.lastName}</p>
                      <p className="text-sm text-gray-600">{userInfo.email}</p>
                      <p className="text-sm text-gray-600">{userInfo.role}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Plano Selecionado</h4>
                      <div className="flex justify-between items-center">
                        <span>{selectedPlan?.name} ({paymentInfo.billingPeriod === 'yearly' ? 'Anual' : 'Mensal'})</span>
                        <span className="font-semibold">
                          R$ {paymentInfo.billingPeriod === 'yearly' 
                            ? Math.round((selectedPlan?.price || 0) * 12 * 0.8 / 12)
                            : selectedPlan?.price
                          }/mês
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" data-testid="checkbox-terms" />
                    <Label htmlFor="terms" className="text-sm">
                      Concordo com os{' '}
                      <a href="/terms" className="text-blue-600 hover:underline">
                        Termos de Serviço
                      </a>{' '}
                      e{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline">
                        Política de Privacidade
                      </a>
                    </Label>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  data-testid="button-previous"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  <Button
                    onClick={handleComplete}
                    disabled={createTenantMutation.isPending}
                    data-testid="button-complete"
                  >
                    {createTenantMutation.isPending ? 'Criando conta...' : 'Criar Conta'}
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 0 && (!organizationInfo.companyName || !organizationInfo.industry || !organizationInfo.size)) ||
                      (currentStep === 1 && (!userInfo.firstName || !userInfo.lastName || !userInfo.email || !userInfo.role)) ||
                      (currentStep === 3 && !paymentInfo.paymentMethodId)
                    }
                    data-testid="button-next"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}