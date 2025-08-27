import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Diretora de Customer Success",
    company: "TechCorp Solutions",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b2312d6c?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256",
    quote: "O TatuTicket revolucionou nosso suporte. Reduzimos o tempo de resposta em 60% e nossa satisfação do cliente aumentou para 98%. A IA realmente faz a diferença!",
    rating: 5,
    metrics: {
      improvement: "60% mais rápido",
      satisfaction: "98% CSAT"
    }
  },
  {
    name: "Carlos Mendes",
    role: "CTO",
    company: "StartupX",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256",
    quote: "A modularidade do TatuTicket permitiu implementarmos exatamente o que precisávamos. A versão PWA funciona perfeitamente offline, essencial para nossa equipe móvel.",
    rating: 5,
    metrics: {
      improvement: "100% uptime",
      satisfaction: "Zero downtime"
    }
  },
  {
    name: "Ana Costa",
    role: "Gerente de Operações",
    company: "Enterprise Corp",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256",
    quote: "Os SLAs flexíveis e a bolsa de horas nos deram controle total sobre custos. As analytics ajudam a tomar decisões estratégicas baseadas em dados reais.",
    rating: 5,
    metrics: {
      improvement: "40% economia",
      satisfaction: "Controle total"
    }
  },
  {
    name: "Roberto Santos",
    role: "Head of Support",
    company: "ScaleUp Inc",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256",
    quote: "A segurança e conformidade com a Lei de Proteção de Dados de Angola foram decisivas. O isolamento multi-tenant é perfeito para nossa operação B2B. Recomendo para qualquer empresa séria.",
    rating: 5,
    metrics: {
      improvement: "100% Conforme",
      satisfaction: "Máxima segurança"
    }
  },
  {
    name: "Julia Rodrigues",
    role: "Customer Experience Manager",
    company: "RetailMax",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256",
    quote: "A integração com nossos sistemas existentes foi simples. APIs bem documentadas e suporte excepcional da equipe durante a implementação.",
    rating: 5,
    metrics: {
      improvement: "API completa",
      satisfaction: "Integração fácil"
    }
  },
  {
    name: "Pedro Oliveira",
    role: "Operations Director",
    company: "GlobalTech",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256",
    quote: "O modelo Enterprise on-premise atendeu perfeitamente nossas necessidades de compliance. Performance excelente mesmo com milhares de tickets simultâneos.",
    rating: 5,
    metrics: {
      improvement: "10K+ tickets",
      satisfaction: "Performance máxima"
    }
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Mais de 1000+ empresas já transformaram seu atendimento com o TatuTicket
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`testimonial-${index}`}>
              <CardContent className="p-8">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400"></i>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-gray-600 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                {/* Metrics */}
                <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-primary">{testimonial.metrics.improvement}</div>
                    <div className="text-xs text-gray-500">Melhoria</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-green-600">{testimonial.metrics.satisfaction}</div>
                    <div className="text-xs text-gray-500">Resultado</div>
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center">
                  <Avatar className="w-12 h-12 mr-4">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm font-medium text-primary">{testimonial.company}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">
              Junte-se a essas empresas de sucesso
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Transforme seu suporte hoje mesmo e veja os resultados imediatamente
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" data-testid="button-start-trial">
                Começar Teste Grátis
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors" data-testid="button-see-case-studies">
                Ver Casos de Sucesso
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}