import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Zap, Crown, Building, ArrowRight, Star } from 'lucide-react';

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
  cta: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfeito para pequenas equipes começando',
    priceMonthly: 29,
    priceYearly: 290,
    cta: 'Começar Grátis',
    features: [
      'Até 5 usuários',
      '500 tickets por mês',
      '1GB de armazenamento',
      'Base de conhecimento básica',
      'Relatórios essenciais',
      'Suporte por email',
      'Integrações básicas',
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
    description: 'Para equipes que precisam de mais recursos',
    priceMonthly: 79,
    priceYearly: 790,
    isPopular: true,
    cta: 'Testar 14 Dias Grátis',
    features: [
      'Até 25 usuários',
      '2.000 tickets por mês',
      '10GB de armazenamento',
      'Base de conhecimento avançada',
      'SLA personalizado',
      'Automações básicas',
      'Relatórios avançados',
      'Suporte prioritário',
      'Integrações avançadas',
      'API REST',
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
    description: 'Solução completa para grandes organizações',
    priceMonthly: 199,
    priceYearly: 1990,
    cta: 'Falar com Vendas',
    features: [
      'Usuários ilimitados',
      'Tickets ilimitados',
      '100GB de armazenamento',
      'IA integrada para automação',
      'Automações avançadas',
      'API completa + Webhooks',
      'SSO e SAML',
      'Conformidade Lei de Proteção de Dados Angola',
      'Suporte 24/7',
      'Gerente de conta dedicado',
      'Onboarding personalizado',
      'Treinamento da equipe',
    ],
    limits: {
      users: -1, // Unlimited
      tickets: -1, // Unlimited
      storage: '100GB',
    },
  },
];

const COMPARISON_FEATURES = [
  { category: 'Usuários e Limites', features: [
    { name: 'Usuários simultâneos', starter: '5', professional: '25', enterprise: 'Ilimitado' },
    { name: 'Tickets por mês', starter: '500', professional: '2.000', enterprise: 'Ilimitados' },
    { name: 'Armazenamento', starter: '1GB', professional: '10GB', enterprise: '100GB' },
    { name: 'Departamentos', starter: '3', professional: '10', enterprise: 'Ilimitados' },
  ]},
  { category: 'Recursos Core', features: [
    { name: 'Sistema de tickets', starter: true, professional: true, enterprise: true },
    { name: 'Base de conhecimento', starter: 'Básica', professional: 'Avançada', enterprise: 'Completa com IA' },
    { name: 'SLA Management', starter: false, professional: true, enterprise: true },
    { name: 'Automações', starter: false, professional: 'Básicas', enterprise: 'Avançadas com IA' },
  ]},
  { category: 'Análise e Relatórios', features: [
    { name: 'Relatórios básicos', starter: true, professional: true, enterprise: true },
    { name: 'Relatórios personalizados', starter: false, professional: true, enterprise: true },
    { name: 'Analytics em tempo real', starter: false, professional: false, enterprise: true },
    { name: 'Dashboards executivos', starter: false, professional: false, enterprise: true },
  ]},
  { category: 'Integrações', features: [
    { name: 'Email e chat', starter: true, professional: true, enterprise: true },
    { name: 'API REST', starter: false, professional: 'Limitada', enterprise: 'Completa' },
    { name: 'Webhooks', starter: false, professional: false, enterprise: true },
    { name: 'SSO / SAML', starter: false, professional: false, enterprise: true },
  ]},
  { category: 'Suporte', features: [
    { name: 'Suporte por email', starter: true, professional: true, enterprise: true },
    { name: 'Suporte prioritário', starter: false, professional: true, enterprise: true },
    { name: 'Suporte 24/7', starter: false, professional: false, enterprise: true },
    { name: 'Gerente de conta', starter: false, professional: false, enterprise: true },
  ]},
];

export function PricingPlans() {
  const [isYearly, setIsYearly] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Zap className="h-6 w-6 text-blue-600" />;
      case 'professional': return <Crown className="h-6 w-6 text-purple-600" />;
      case 'enterprise': return <Building className="h-6 w-6 text-orange-600" />;
      default: return <Zap className="h-6 w-6 text-gray-600" />;
    }
  };

  const handlePlanAction = (planId: string) => {
    if (planId === 'enterprise') {
      // Redirect to contact/demo page
      window.location.href = '/contato?plan=enterprise';
    } else {
      // Redirect to signup with plan
      window.location.href = `/cadastro?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`;
    }
  };

  const formatFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <span className="text-gray-300">—</span>;
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Planos que crescem com seu negócio
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Escolha o plano ideal para sua equipe. Todos os planos incluem teste gratuito de 14 dias.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={!isYearly ? 'font-semibold text-gray-900' : 'text-gray-600'}>
          Cobrança Mensal
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isYearly ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          data-testid="toggle-billing"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isYearly ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={isYearly ? 'font-semibold text-gray-900' : 'text-gray-600'}>
          Cobrança Anual
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
            <Star className="h-3 w-3 mr-1" />
            Economize 17%
          </Badge>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PRICING_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.isPopular 
                ? 'ring-2 ring-blue-500 shadow-xl scale-105' 
                : 'hover:shadow-lg transition-shadow'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-blue-600 text-white px-4 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                {getPlanIcon(plan.id)}
              </div>
              
              <div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    R${isYearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{isYearly ? 'ano' : 'mês'}
                  </span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600">
                    Economize R${(plan.priceMonthly * 12) - plan.priceYearly} por ano
                  </p>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Button
                className={`w-full ${
                  plan.isPopular 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : ''
                }`}
                variant={plan.isPopular ? 'default' : 'outline'}
                onClick={() => handlePlanAction(plan.id)}
                data-testid={`button-plan-${plan.id}`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
                  Recursos Inclusos
                </h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Toggle */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowComparison(!showComparison)}
          data-testid="button-toggle-comparison"
        >
          {showComparison ? 'Ocultar' : 'Ver'} Comparação Detalhada
        </Button>
      </div>

      {/* Detailed Comparison Table */}
      {showComparison && (
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Comparação Detalhada de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            {COMPARISON_FEATURES.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  {section.category}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-gray-600">Recurso</th>
                        <th className="text-center py-2 font-medium text-blue-600">Starter</th>
                        <th className="text-center py-2 font-medium text-purple-600">Professional</th>
                        <th className="text-center py-2 font-medium text-orange-600">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.features.map((feature, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 text-sm font-medium text-gray-900">
                            {feature.name}
                          </td>
                          <td className="py-3 text-center">
                            {formatFeatureValue(feature.starter)}
                          </td>
                          <td className="py-3 text-center">
                            {formatFeatureValue(feature.professional)}
                          </td>
                          <td className="py-3 text-center">
                            {formatFeatureValue(feature.enterprise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sectionIndex < COMPARISON_FEATURES.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* FAQ Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Posso mudar de plano a qualquer momento?</h4>
              <p className="text-sm text-gray-600">
                Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                Ajustaremos a cobrança proporcionalmente.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">O teste gratuito requer cartão de crédito?</h4>
              <p className="text-sm text-gray-600">
                Não, você pode começar seu teste de 14 dias gratuitamente sem fornecer 
                informações de pagamento.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Há desconto para organizações sem fins lucrativos?</h4>
              <p className="text-sm text-gray-600">
                Sim, oferecemos desconto de 50% para organizações sem fins lucrativos qualificadas. 
                Entre em contato conosco.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h4>
              <p className="text-sm text-gray-600">
                Sim, você pode cancelar sua assinatura a qualquer momento. Não há multas ou 
                taxas de cancelamento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="text-center space-y-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl">
        <h2 className="text-3xl font-bold">Pronto para transformar seu atendimento?</h2>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Comece hoje mesmo com 14 dias gratuitos. Não é necessário cartão de crédito.
        </p>
        <Button 
          size="lg" 
          className="bg-white text-blue-600 hover:bg-gray-100"
          onClick={() => handlePlanAction('professional')}
          data-testid="button-cta-trial"
        >
          Começar Teste Gratuito
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}