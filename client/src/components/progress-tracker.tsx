import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { PortalType, PortalProgress } from "@/types/portal";

interface ProgressTrackerProps {
  currentPortal: PortalType;
  progress: PortalProgress;
}

const implementationStatus = {
  saas: [
    { feature: "Landing page informativa", completed: true },
    { feature: "Seção de funcionalidades", completed: true },
    { feature: "Planos de pricing", completed: true },
    { feature: "Sistema de registro/onboarding", completed: false },
    { feature: "Integração gateway pagamento", completed: false },
    { feature: "Sistema OTP validação", completed: false },
    { feature: "FAQs interativo", completed: false },
    { feature: "Chat suporte pré-venda", completed: false },
  ],
  organization: [
    { feature: "Dashboard com métricas", completed: true },
    { feature: "Navegação sidebar", completed: true },
    { feature: "Tabela de tickets", completed: true },
    { feature: "CRUD completo tickets", completed: false },
    { feature: "Gestão estrutura organizacional", completed: false },
    { feature: "Sistema SLAs/bolsa de horas", completed: false },
    { feature: "Rastreamento tempo/custos", completed: false },
    { feature: "Base conhecimento interna", completed: false },
    { feature: "Relatórios interativos", completed: false },
    { feature: "Gestão usuários/clientes", completed: false },
  ],
  customer: [
    { feature: "Interface autoatendimento", completed: true },
    { feature: "Cards ações rápidas", completed: true },
    { feature: "Visualização SLA/bolsa", completed: true },
    { feature: "Lista tickets pessoais", completed: true },
    { feature: "Criação de tickets", completed: false },
    { feature: "Chat com agentes", completed: false },
    { feature: "Base conhecimento", completed: false },
    { feature: "Gestão sub-usuários", completed: false },
  ],
  admin: [
    { feature: "Dashboard global", completed: true },
    { feature: "Gestão tenants", completed: true },
    { feature: "Status do sistema", completed: true },
    { feature: "Logs de auditoria", completed: true },
    { feature: "Gestão usuários globais", completed: false },
    { feature: "Configurações módulos", completed: false },
    { feature: "Gestão financeira central", completed: false },
    { feature: "Analytics avançadas", completed: false },
  ],
};

const transversalFeatures = [
  { feature: "Design responsivo", completed: true },
  { feature: "Navegação entre portais", completed: true },
  { feature: "PWA capabilities", completed: false },
  { feature: "Autenticação multi-tenant", completed: false },
  { feature: "Sistema RBAC", completed: false },
  { feature: "Integração IA", completed: false },
  { feature: "APIs RESTful", completed: false },
  { feature: "Sistema gamificação", completed: false },
];

export function ProgressTracker({ currentPortal, progress }: ProgressTrackerProps) {
  const currentFeatures = implementationStatus[currentPortal] || [];
  const completedCount = currentFeatures.filter(f => f.completed).length;
  const totalCount = currentFeatures.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-primary text-white py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between text-sm">
          <span>
            Status de Implementação: 
            <span className="font-semibold ml-1" data-testid="text-implementation-status">
              {progress.status}
            </span>
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="link" 
                className="text-white hover:text-blue-100 p-0 h-auto"
                data-testid="button-progress-details"
              >
                <span className="font-semibold" data-testid="text-completion-percentage">
                  {progress.percentage}% Completo
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Plano de Controle de Implementação</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {Object.entries(implementationStatus).map(([portal, features]) => (
                  <div key={portal}>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 capitalize">
                      Portal {portal === 'saas' ? 'SaaS' : portal === 'organization' ? 'das Organizações/Empresas' : portal === 'customer' ? 'dos Clientes Finais' : 'de Admin'}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <i className={`fas ${feature.completed ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2`}></i>
                          {feature.feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Funcionalidades Transversais</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {transversalFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <i className={`fas ${feature.completed ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2`}></i>
                        {feature.feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">Status Geral da Implementação</h5>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">
                      Progresso Total: <strong>25% Completo</strong>
                    </span>
                    <span className="text-blue-800">
                      Próximas Prioridades: Autenticação, CRUD Tickets, PWA
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-1 bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-500 progress-bar"
            style={{ width: `${progress.percentage}%` }}
            data-testid="progress-bar"
          ></div>
        </div>
      </div>
    </div>
  );
}
