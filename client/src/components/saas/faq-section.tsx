import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: "product" | "pricing" | "technical" | "support";
}

const faqs: FAQ[] = [
  // Product FAQs
  {
    id: "1",
    question: "O que é o TatuTicket?",
    answer: "O TatuTicket é uma plataforma completa de gestão de tickets multi-tenant, projetada para revolucionar o suporte ao cliente. Oferece 4 portais distintos: SaaS (prospecção), Organizacional (gestão interna), Clientes (autoatendimento) e Admin (controle global).",
    category: "product"
  },
  {
    id: "2", 
    question: "Quais são os principais diferenciais do TatuTicket?",
    answer: "IA avançada para automação, SLAs flexíveis com bolsa de horas, analytics preditivas, isolamento multi-tenant, PWA nativa, conformidade LGPD/GDPR, e opção on-premise para empresas que preferem evitar soluções em nuvem.",
    category: "product"
  },
  {
    id: "3",
    question: "O sistema funciona offline?",
    answer: "Sim! O TatuTicket é uma Progressive Web App (PWA) que funciona offline, pode ser instalada como app nativo e envia push notifications. Perfeito para equipes que trabalham em campo.",
    category: "technical"
  },
  
  // Pricing FAQs
  {
    id: "4",
    question: "Quanto custa o TatuTicket?",
    answer: "Temos 3 planos: Freemium (gratuito para até 3 agentes e 50 tickets/mês), Pro (R$ 29/agente/mês com recursos ilimitados), e Enterprise (personalizado com opção on-premise).",
    category: "pricing"
  },
  {
    id: "5",
    question: "Posso testar antes de comprar?",
    answer: "Claro! Oferecemos 14 dias de teste gratuito do plano Pro, sem necessidade de cartão de crédito. Você também pode usar o plano Freemium permanentemente.",
    category: "pricing"
  },
  {
    id: "6",
    question: "Como funciona a cobrança por agente?",
    answer: "No plano Pro, você paga apenas pelos agentes ativos (que fazem login mensalmente). Clientes finais não são contabilizados. No Enterprise, temos modelos flexíveis incluindo cobrança por volume de tickets.",
    category: "pricing"
  },
  
  // Technical FAQs  
  {
    id: "7",
    question: "O TatuTicket tem APIs?",
    answer: "Sim! Oferecemos APIs RESTful completas, webhooks configuráveis e integrações nativas com mais de 100 ferramentas populares (Slack, Jira, Zapier, etc.).",
    category: "technical"
  },
  {
    id: "8",
    question: "É possível personalizar a interface?",
    answer: "Totalmente! Suportamos themes personalizados, white-label completo no Enterprise, e cada tenant pode configurar sua própria identidade visual.",
    category: "technical"
  },
  {
    id: "9",
    question: "Como funciona a IA do sistema?",
    answer: "Nossa IA analisa tickets automaticamente para categorização, priorização, roteamento inteligente, análise de sentimento, sugestões de respostas e insights preditivos para gestores.",
    category: "technical"
  },
  
  // Support FAQs
  {
    id: "10",
    question: "Que tipo de suporte vocês oferecem?",
    answer: "Freemium: email. Pro: email + chat. Enterprise: suporte 24/7 por telefone, email, chat e manager dedicado. Todos os planos incluem documentação completa e tutoriais.",
    category: "support"
  },
  {
    id: "11",
    question: "Vocês fazem migração de dados?",
    answer: "Sim! No plano Enterprise incluímos migração completa de dados de outros sistemas. No Pro, oferecemos assistência para importação via CSV/Excel.",
    category: "support"
  },
  {
    id: "12",
    question: "O sistema é seguro?",
    answer: "Extremamente! Usamos criptografia AES-256, isolamento completo multi-tenant, backups automáticos, conformidade LGPD/GDPR e auditoria completa de todas as ações.",
    category: "support"
  }
];

const categoryLabels = {
  product: "Produto",
  pricing: "Preços",
  technical: "Técnico", 
  support: "Suporte"
};

const categoryIcons = {
  product: "fa-cube",
  pricing: "fa-dollar-sign",
  technical: "fa-cogs",
  support: "fa-life-ring"
};

export function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const categories = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-xl text-gray-600">
            Encontre respostas para as dúvidas mais comuns sobre o TatuTicket
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-6 py-3 rounded-full font-medium transition-colors",
              selectedCategory === "all"
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
            data-testid="filter-all"
          >
            <i className="fas fa-th mr-2"></i>
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-6 py-3 rounded-full font-medium transition-colors",
                selectedCategory === category
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
              data-testid={`filter-${category}`}
            >
              <i className={`fas ${categoryIcons[category]} mr-2`}></i>
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <Card key={faq.id} className="overflow-hidden">
              <Collapsible open={openItems.includes(faq.id)}>
                <CollapsibleTrigger 
                  onClick={() => toggleItem(faq.id)}
                  className="w-full"
                  data-testid={`faq-${faq.id}`}
                >
                  <CardContent className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          faq.category === "product" && "bg-blue-100 text-blue-600",
                          faq.category === "pricing" && "bg-green-100 text-green-600", 
                          faq.category === "technical" && "bg-purple-100 text-purple-600",
                          faq.category === "support" && "bg-orange-100 text-orange-600"
                        )}>
                          <i className={`fas ${categoryIcons[faq.category]}`}></i>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 text-left">
                          {faq.question}
                        </h3>
                      </div>
                      <i className={cn(
                        "fas fa-chevron-down transition-transform",
                        openItems.includes(faq.id) && "transform rotate-180"
                      )}></i>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="pl-14">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Contact Support CTA */}
        <div className="text-center mt-12">
          <Card className="bg-primary text-white">
            <CardContent className="p-8">
              <i className="fas fa-headset text-3xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">
                Não encontrou sua resposta?
              </h3>
              <p className="text-blue-100 mb-6">
                Nossa equipe de suporte está pronta para ajudar você
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  data-testid="button-chat-support"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Chat ao Vivo
                </button>
                <button 
                  className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
                  data-testid="button-email-support"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Enviar Email
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}