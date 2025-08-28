import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FAQSection } from "@/components/saas/faq-section";
import { AICustomerChatbot } from '@/components/saas/AICustomerChatbot';
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
    description: "Isolamento multi-tenant, criptografia AES-256 e conformidade total com Lei de Proteção de Dados de Angola.",
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
    price: "Kz 0",
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
    price: "Kz 14.500",
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
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { toast } = useToast();

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
                  onClick={() => window.location.href = '/register'}
                  data-testid="button-free-trial"
                >
                  Teste Grátis 14 Dias
                </Button>
                <Button 
                  size="lg"
                  className="h-11 rounded-md px-8 border-2 border-white hover:bg-white hover:text-primary text-[#ffffff] bg-[#0076d6]"
                  onClick={() => window.location.href = '/register?demo=true'}
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
              onClick={() => window.location.href = '/register'}
              data-testid="button-create-account"
            >
              Criar Conta Grátis
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary"
              onClick={() => window.location.href = '/register?demo=true'}
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-xl font-bold">TatuTicket</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Revolucione sua gestão de tickets com nossa plataforma modular e inteligente.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Preços</a></li>
                <li><a href="/register" className="text-gray-400 hover:text-white transition-colors">Teste Grátis</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrações</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tutoriais</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status do Serviço</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contactar Suporte</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Imprensa</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Parceiros</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col md:flex-row text-sm text-gray-400 space-y-2 md:space-y-0 md:space-x-6">
                <span>&copy; {new Date().getFullYear()} TatuTicket. Todos os direitos reservados.</span>
                <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
              </div>
              <div className="flex items-center text-sm text-gray-400 mt-4 md:mt-0">
                <span>Feito com</span>
                <i className="fas fa-heart text-red-500 mx-1"></i>
                <span>em Angola</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Customer Chatbot */}
      <AICustomerChatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
      />
    </div>
  );
}
