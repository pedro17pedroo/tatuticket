import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface PricingPlan {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
  badge?: string;
}

export function PricingPlans() {
  const [isYearly, setIsYearly] = useState(false);

  const plans: PricingPlan[] = [
    {
      name: "Freemium",
      description: "Para pequenas equipes começando",
      price: { monthly: 0, yearly: 0 },
      badge: "Grátis",
      features: [
        { name: "Até 50 tickets/mês", included: true },
        { name: "2 usuários", included: true },
        { name: "1 departamento", included: true },
        { name: "Suporte por email", included: true },
        { name: "Base de conhecimento básica", included: true },
        { name: "SLAs básicos", included: false },
        { name: "Automação com IA", included: false },
        { name: "Relatórios avançados", included: false },
        { name: "Integrações API", included: false },
      ],
      cta: "Começar Grátis"
    },
    {
      name: "Pro",
      description: "Para equipes em crescimento",
      price: { monthly: 29, yearly: 290 },
      popular: true,
      badge: "Mais Popular",
      features: [
        { name: "Até 500 tickets/mês", included: true },
        { name: "10 usuários", included: true },
        { name: "Departamentos ilimitados", included: true },
        { name: "Suporte prioritário", included: true },
        { name: "Base de conhecimento avançada", included: true },
        { name: "SLAs personalizados", included: true },
        { name: "Automação com IA", included: true },
        { name: "Relatórios e analytics", included: true },
        { name: "Integrações básicas", included: true, limit: "5 integrações" },
      ],
      cta: "Iniciar Teste Grátis"
    },
    {
      name: "Enterprise",
      description: "Para grandes organizações",
      price: { monthly: 99, yearly: 990 },
      badge: "Completo",
      features: [
        { name: "Tickets ilimitados", included: true },
        { name: "Usuários ilimitados", included: true },
        { name: "Multi-tenant completo", included: true },
        { name: "Suporte 24/7 dedicado", included: true },
        { name: "Base de conhecimento enterprise", included: true },
        { name: "SLAs avançados + bolsa de horas", included: true },
        { name: "IA completa + análise preditiva", included: true },
        { name: "Relatórios customizados", included: true },
        { name: "Integrações ilimitadas", included: true },
        { name: "SSO + LDAP", included: true },
        { name: "Opção on-premise", included: true },
      ],
      cta: "Falar com Vendas"
    }
  ];

  const getPrice = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return "Grátis";
    const price = isYearly ? plan.price.yearly : plan.price.monthly;
    const period = isYearly ? "ano" : "mês";
    return `Kz ${price.toLocaleString()}/${period}`;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return null;
    const yearlyEquivalent = plan.price.monthly * 12;
    const savings = Math.round(((yearlyEquivalent - plan.price.yearly) / yearlyEquivalent) * 100);
    return isYearly && savings > 0 ? `${savings}% de desconto` : null;
  };

  return (
    <section className="py-20 px-4 bg-gray-50" data-testid="pricing-section">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Planos Flexíveis para Sua Necessidade
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Escolha o plano ideal para sua equipe. Todos os planos incluem teste gratuito de 14 dias.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              Mensal
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              data-testid="billing-toggle"
            />
            <span className={`text-sm ${isYearly ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              Anual
            </span>
            <Badge className="bg-green-100 text-green-800 ml-2">
              Economize até 17%
            </Badge>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105 z-10' : 'hover:shadow-lg'} transition-all duration-300`}
              data-testid={`plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                {!plan.popular && plan.badge && (
                  <Badge variant="outline" className="w-fit mx-auto mb-2">
                    {plan.badge}
                  </Badge>
                )}
                
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </CardTitle>
                
                <p className="text-gray-600 mb-6">
                  {plan.description}
                </p>

                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {getPrice(plan)}
                  </div>
                  {getSavings(plan) && (
                    <div className="text-sm text-green-600 font-medium">
                      {getSavings(plan)}
                    </div>
                  )}
                </div>

                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.popular ? "default" : "outline"}
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                </Button>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Funcionalidades incluídas:
                  </h4>
                  
                  {plan.features.map((feature, featureIndex) => (
                    <div 
                      key={featureIndex} 
                      className="flex items-start space-x-3"
                    >
                      <div className={`mt-1 ${feature.included ? 'text-green-500' : 'text-gray-300'}`}>
                        <i className={`fas ${feature.included ? 'fa-check' : 'fa-times'} text-sm`}></i>
                      </div>
                      <div className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.name}
                        {feature.limit && (
                          <span className="text-xs text-gray-500 block">
                            {feature.limit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <div className="bg-blue-50 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Precisa de algo personalizado?
            </h3>
            <p className="text-gray-600 mb-6">
              Oferecemos soluções enterprise customizadas, instalação on-premise e integrações dedicadas 
              para organizações com requisitos específicos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" data-testid="button-schedule-demo">
                <i className="fas fa-calendar mr-2"></i>
                Agendar Demo
              </Button>
              <Button data-testid="button-contact-sales">
                <i className="fas fa-phone mr-2"></i>
                Falar com Vendas
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-center text-gray-900 mb-8">
            Dúvidas Frequentes sobre Planos
          </h3>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">
                Posso migrar entre planos?
              </h4>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. 
                Ajustamos a cobrança proporcionalmente.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">
                O que acontece se eu exceder os limites?
              </h4>
              <p className="text-gray-600">
                Você receberá notificações antes de atingir os limites. 
                Para tickets extras, cobramos taxa adicional ou sugerimos upgrade.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">
                Existe desconto para organizações sem fins lucrativos?
              </h4>
              <p className="text-gray-600">
                Sim! Oferecemos descontos especiais para ONGs, instituições educacionais 
                e organizações sem fins lucrativos. Entre em contato conosco.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}