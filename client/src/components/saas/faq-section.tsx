import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const faqData = [
  {
    question: "O que é o TatuTicket?",
    answer: "TatuTicket é uma plataforma completa de gestão de tickets multi-tenant, projetada para revolucionar o suporte ao cliente. Com IA avançada, SLAs flexíveis e analytics poderosas, oferecemos uma solução modular que se adapta às necessidades de qualquer empresa."
  },
  {
    question: "Quais são os planos disponíveis?",
    answer: "Oferecemos 3 planos: Freemium (gratuito até 50 tickets/mês), Pro (R$ 29/agente/mês) e Enterprise (personalizado). Cada plano inclui funcionalidades específicas para diferentes necessidades empresariais."
  },
  {
    question: "O TatuTicket funciona offline?",
    answer: "Sim! Como Progressive Web App (PWA), o TatuTicket funciona offline e pode ser instalado no seu dispositivo como um app nativo, garantindo produtividade mesmo sem conexão com internet."
  },
  {
    question: "Como funciona a IA do TatuTicket?",
    answer: "Nossa IA analisa tickets automaticamente, categoriza por prioridade, sugere respostas, detecta sentimento do cliente e oferece insights preditivos para otimizar o atendimento e antecipar problemas."
  },
  {
    question: "O sistema é seguro?",
    answer: "Absolutamente. Utilizamos criptografia AES-256, isolamento multi-tenant completo e somos totalmente compatíveis com LGPD e GDPR. Seus dados estão protegidos com os mais altos padrões de segurança."
  },
  {
    question: "Posso integrar com outros sistemas?",
    answer: "Sim! Oferecemos APIs RESTful completas, webhooks e integrações nativas com mais de 100 ferramentas populares como Slack, Jira, CRM e sistemas ERP."
  },
  {
    question: "Existe versão on-premise?",
    answer: "Sim! O plano Enterprise inclui a opção de instalação on-premise para empresas que preferem manter dados em sua própria infraestrutura por questões de conformidade ou controle."
  },
  {
    question: "Como funcionam os SLAs?",
    answer: "Oferecemos modelos flexíveis: SLA tradicional (custos fixos), Bolsa de Horas (pagamento por uso) e Híbrido (combinação de ambos). Monitoramento em tempo real com alertas automáticos."
  }
];

export function FAQSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<number[]>([]);

  const filteredFAQ = faqData.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Encontre respostas para as dúvidas mais comuns
          </p>
          <div className="max-w-md mx-auto">
            <Input
              type="search"
              placeholder="Buscar na FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-faq-search"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredFAQ.map((item, index) => (
            <Card key={index} className="shadow-sm">
              <Collapsible open={openItems.includes(index)}>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleItem(index)}
                    data-testid={`faq-question-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-left">
                        {item.question}
                      </CardTitle>
                      <i className={`fas ${openItems.includes(index) ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400`}></i>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {filteredFAQ.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
            <p className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma pergunta encontrada
            </p>
            <p className="text-gray-500">
              Tente usar outros termos de busca
            </p>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Não encontrou o que procurava?
          </p>
          <Button size="lg" data-testid="button-contact-support">
            <i className="fas fa-headset mr-2"></i>
            Falar com Suporte
          </Button>
        </div>
      </div>
    </section>
  );
}