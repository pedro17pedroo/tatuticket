import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authService, type RegisterData } from "@/lib/auth";
import { FAQSection } from "@/components/saas/faq-section";
import { OnboardingWizard } from "@/components/saas/onboarding-wizard";
import { TestimonialsSection } from "@/components/saas/testimonials-section";
import { PricingPlans } from "@/components/saas/pricing-plans";
import type { PricingPlan } from "@/types/portal";

const features = [
  {
    icon: "fa-robot",
    title: "IA Avançada",
    description: "Automação inteligente, categorização automática e análise de sentimento para otimizar seu fluxo de trabalho.",
    color: "bg-primary"
  },
  {
    icon: "fa-clock",
    title: "SLAs Flexíveis",
    description: "Gestão avançada de SLAs com bolsa de horas, modelos híbridos e monitoramento em tempo real.",
    color: "bg-green-500"
  },
  {
    icon: "fa-chart-line",
    title: "Analytics Avançadas",
    description: "Relatórios interativos, dashboards personalizáveis e insights preditivos para tomada de decisão.",
    color: "bg-accent"
  },
  {
    icon: "fa-shield-alt",
    title: "Segurança Máxima",
    description: "Isolamento multi-tenant, criptografia AES-256 e conformidade total com LGPD/GDPR.",
    color: "bg-purple-500"
  },
  {
    icon: "fa-mobile-alt",
    title: "PWA Nativa",
    description: "Progressive Web App que funciona offline, instalável e otimizada para qualquer dispositivo.",
    color: "bg-indigo-500"
  },
  {
    icon: "fa-plug",
    title: "Integrações",
    description: "APIs RESTful, webhooks e integrações nativas com mais de 100 ferramentas populares.",
    color: "bg-red-500"
  }
];

const pricingPlans: PricingPlan[] = [
  {
    id: "freemium",
    name: "Freemium",
    price: "R$ 0",
    description: "por mês • até 50 tickets",
    features: [
      "Até 3 agentes",
      "50 tickets/mês",
      "Base de conhecimento",
      "Suporte por email"
    ],
    buttonText: "Começar Grátis",
    buttonAction: () => {}
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 29",
    description: "por agente/mês • tickets ilimitados",
    features: [
      "Agentes ilimitados",
      "Tickets ilimitados",
      "IA avançada",
      "SLAs personalizados",
      "Integrações avançadas"
    ],
    popular: true,
    buttonText: "Teste 14 Dias Grátis",
    buttonAction: () => {}
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "On-premise disponível",
    features: [
      "Tudo do Pro",
      "White-label",
      "On-premise",
      "Suporte 24/7",
      "Manager dedicado"
    ],
    buttonText: "Falar com Vendas",
    buttonAction: () => {}
  }
];

export function SaasPortal() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"freemium" | "pro" | "enterprise">("freemium");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [registerForm, setRegisterForm] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    role: "user"
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.register(registerForm);
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para ativar sua conta.",
      });
      setIsOnboardingOpen(false);
      setRegisterForm({ username: "", email: "", password: "", role: "user" });
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Revolucione sua <span className="text-yellow-300">Gestão de Tickets</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-blue-100">
                Plataforma modular, multi-tenant e impulsionada por IA para transformar seu suporte ao cliente
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100"
                  onClick={() => {
                    setSelectedPlan("pro");
                    setIsOnboardingOpen(true);
                  }}
                  data-testid="button-free-trial"
                >
                  Teste Grátis 14 Dias
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary"
                  data-testid="button-schedule-demo"
                >
                  Agendar Demo
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Dashboard analytics preview" 
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Poderosas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Uma plataforma completa com tudo que você precisa para oferecer suporte excepcional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                    <i className={`fas ${feature.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingPlans />

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8">
            Pronto para Transformar seu Suporte?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Junte-se a mais de 1000+ empresas que já revolucionaram seu atendimento
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              onClick={() => {
                setSelectedPlan("freemium");
                setIsOnboardingOpen(true);
              }}
              data-testid="button-create-account"
            >
              Criar Conta Grátis
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary"
              data-testid="button-live-demo"
            >
              Ver Demo Ao Vivo
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* FAQ Section */}
      <FAQSection />

      {/* Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialPlan={selectedPlan}
      />
    </div>
  );
}
