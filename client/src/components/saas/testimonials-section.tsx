import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
  companySize: string;
  plan: "freemium" | "pro" | "enterprise";
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Ana Silva",
    company: "TechCorp Brasil",
    role: "CTO",
    content: "O TatuTicket revolucionou nosso suporte! A IA categoriza automaticamente 95% dos tickets e o sistema de SLAs com bolsa de horas é perfeito para nossos contratos. Economizamos 40% do tempo de gestão.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=100&h=100",
    companySize: "50-200",
    plan: "pro"
  },
  {
    id: "2", 
    name: "Carlos Mendes",
    company: "StartupXYZ",
    role: "Founder & CEO",
    content: "Como startup, o plano freemium nos permitiu começar sem custos e crescer organicamente. Quando precisamos escalar, a migração para o Pro foi instantânea. Suporte excepcional!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=100&h=100",
    companySize: "1-10",
    plan: "freemium"
  },
  {
    id: "3",
    name: "Maria Santos",
    company: "Banco Digital Plus",
    role: "Head of Operations",
    content: "A segurança e conformidade LGPD são impecáveis. O isolamento multi-tenant nos permite servir diferentes BUs com total tranquilidade. O on-premise foi fundamental para aprovação da auditoria.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1559941236-ccc2ba017d8a?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=100&h=100",
    companySize: "1000+",
    plan: "enterprise"
  },
  {
    id: "4",
    name: "Pedro Costa",
    company: "E-commerce Global",
    role: "Customer Success Manager",
    content: "Nosso CSAT subiu de 3.2 para 4.7 em 6 meses! O Portal do Cliente com autoatendimento reduziu tickets básicos em 60%. A base de conhecimento com IA é incrível.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=100&h=100",
    companySize: "201-1000",
    plan: "pro"
  },
  {
    id: "5",
    name: "Juliana Oliveira", 
    company: "SaaS Innovation",
    role: "VP of Support",
    content: "O sistema de escalação automática por SLA salvou nossos contratos enterprise. Nunca mais perdemos um deadline crítico. Os insights preditivos nos ajudam a antecipar problemas.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=100&h=100",
    companySize: "51-200",
    plan: "enterprise"
  },
  {
    id: "6",
    name: "Roberto Lima",
    company: "Consultoria Tech",
    role: "Managing Partner",
    content: "A bolsa de horas é genial para nossa operação de consultoria. Vendemos pacotes de horas que são consumidas automaticamente. O ROI foi positivo desde o primeiro mês!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=100&h=100",
    companySize: "11-50",
    plan: "pro"
  }
];

const getPlanBadge = (plan: string) => {
  const planMap = {
    freemium: { label: "Freemium", className: "bg-gray-100 text-gray-800" },
    pro: { label: "Pro", className: "bg-primary/10 text-primary" },
    enterprise: { label: "Enterprise", className: "bg-purple-100 text-purple-800" }
  };
  
  return planMap[plan as keyof typeof planMap] || planMap.freemium;
};

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-xl text-gray-600">
            Mais de 1000+ empresas já transformaram seu suporte com o TatuTicket
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex space-x-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <i key={i} className="fas fa-star text-yellow-400 text-sm"></i>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <blockquote className="text-gray-600 mb-4 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.company}</p>
                    <p className="text-sm text-gray-500">{testimonial.companySize} funcionários</p>
                  </div>
                  
                  <Badge className={getPlanBadge(testimonial.plan).className}>
                    {getPlanBadge(testimonial.plan).label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Junte-se a essas empresas de sucesso
                </h3>
                <p className="text-gray-600">
                  Teste grátis por 14 dias. Não precisa cartão de crédito.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  data-testid="button-start-trial-testimonials"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  Começar Teste Grátis
                </button>
                <button 
                  className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/5 transition-colors"
                  data-testid="button-schedule-demo-testimonials"
                >
                  <i className="fas fa-calendar mr-2"></i>
                  Agendar Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificações e Conformidade</h3>
            <p className="text-gray-600">Segurança e conformidade que você pode confiar</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-shield-check text-2xl text-green-600"></i>
              </div>
              <p className="font-medium text-gray-900">LGPD</p>
              <p className="text-sm text-gray-600">Conforme</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-lock text-2xl text-blue-600"></i>
              </div>
              <p className="font-medium text-gray-900">ISO 27001</p>
              <p className="text-sm text-gray-600">Certificado</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-key text-2xl text-purple-600"></i>
              </div>
              <p className="font-medium text-gray-900">AES-256</p>
              <p className="text-sm text-gray-600">Criptografia</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-cloud-upload-alt text-2xl text-orange-600"></i>
              </div>
              <p className="font-medium text-gray-900">99.9%</p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}