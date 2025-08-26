import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authService, type RegisterData } from "@/lib/auth";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan: "freemium" | "pro" | "enterprise";
}

interface OnboardingData extends RegisterData {
  companyName: string;
  companySize: string;
  industry: string;
  plan: string;
  paymentMethod?: string;
  phoneNumber?: string;
}

const steps = [
  { id: 1, title: "Dados da Empresa", description: "Informações básicas da sua empresa" },
  { id: 2, title: "Conta de Admin", description: "Criação da conta administrativa" },
  { id: 3, title: "Plano e Pagamento", description: "Seleção do plano e forma de pagamento" },
  { id: 4, title: "Configuração Inicial", description: "Primeiros passos na plataforma" }
];

const companySizes = [
  { value: "1-10", label: "1-10 funcionários" },
  { value: "11-50", label: "11-50 funcionários" },
  { value: "51-200", label: "51-200 funcionários" },
  { value: "201-1000", label: "201-1000 funcionários" },
  { value: "1000+", label: "Mais de 1000 funcionários" }
];

const industries = [
  { value: "technology", label: "Tecnologia" },
  { value: "healthcare", label: "Saúde" },
  { value: "finance", label: "Financeiro" },
  { value: "retail", label: "Varejo" },
  { value: "manufacturing", label: "Manufatura" },
  { value: "education", label: "Educação" },
  { value: "consulting", label: "Consultoria" },
  { value: "other", label: "Outro" }
];

const plans = [
  {
    id: "freemium",
    name: "Freemium",
    price: "R$ 0",
    period: "para sempre",
    features: ["Até 3 agentes", "50 tickets/mês", "Base de conhecimento", "Suporte por email"],
    color: "border-gray-300"
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 29",
    period: "por agente/mês",
    features: ["Agentes ilimitados", "Tickets ilimitados", "IA avançada", "SLAs personalizados", "Integrações"],
    color: "border-primary",
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Personalizado",
    period: "",
    features: ["Tudo do Pro", "White-label", "On-premise", "Suporte 24/7", "Manager dedicado"],
    color: "border-purple-500"
  }
];

export function OnboardingWizard({ isOpen, onClose, initialPlan }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyName: "",
    companySize: "",
    industry: "",
    username: "",
    email: "",
    password: "",
    role: "admin",
    plan: initialPlan,
    phoneNumber: "",
    paymentMethod: ""
  });

  const updateData = (field: keyof OnboardingData, value: string) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Register user
      await authService.register({
        username: onboardingData.username,
        email: onboardingData.email,
        password: onboardingData.password,
        role: onboardingData.role
      });

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao TatuTicket! Verifique seu email para ativar sua conta.",
      });
      
      onClose();
      
      // Reset form
      setCurrentStep(1);
      setOnboardingData({
        companyName: "",
        companySize: "",
        industry: "",
        username: "",
        email: "",
        password: "",
        role: "admin",
        plan: initialPlan,
        phoneNumber: "",
        paymentMethod: ""
      });
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.companyName && onboardingData.companySize && onboardingData.industry;
      case 2:
        return onboardingData.username && onboardingData.email && onboardingData.password;
      case 3:
        return onboardingData.plan && (onboardingData.plan === "freemium" || onboardingData.paymentMethod);
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Bem-vindo ao TatuTicket!</DialogTitle>
          <p className="text-gray-600">Vamos configurar sua conta em poucos passos</p>
        </DialogHeader>

        {/* Progress */}
        <div className="my-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`flex items-center ${step.id < steps.length ? 'flex-1' : ''}`}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${currentStep >= step.id 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step.id ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    step.id
                  )}
                </div>
                {step.id < steps.length && (
                  <div className={`
                    h-1 flex-1 mx-4
                    ${currentStep > step.id ? 'bg-primary' : 'bg-gray-200'}
                  `}></div>
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              Passo {currentStep} de {steps.length}: {steps[currentStep - 1].title}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Conte-nos sobre sua empresa</h3>
                <p className="text-gray-600">Essas informações nos ajudam a personalizar sua experiência</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    value={onboardingData.companyName}
                    onChange={(e) => updateData('companyName', e.target.value)}
                    placeholder="Ex: TechCorp Solutions"
                    data-testid="input-company-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companySize">Tamanho da Empresa *</Label>
                  <Select value={onboardingData.companySize} onValueChange={(value) => updateData('companySize', value)}>
                    <SelectTrigger data-testid="select-company-size">
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="industry">Setor/Indústria *</Label>
                  <Select value={onboardingData.industry} onValueChange={(value) => updateData('industry', value)}>
                    <SelectTrigger data-testid="select-industry">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>{industry.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Telefone (Opcional)</Label>
                  <Input
                    id="phoneNumber"
                    value={onboardingData.phoneNumber}
                    onChange={(e) => updateData('phoneNumber', e.target.value)}
                    placeholder="(11) 99999-9999"
                    data-testid="input-phone-number"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Crie sua conta de administrador</h3>
                <p className="text-gray-600">Esta será a conta principal para gerenciar sua organização</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div>
                  <Label htmlFor="username">Nome de Usuário *</Label>
                  <Input
                    id="username"
                    value={onboardingData.username}
                    onChange={(e) => updateData('username', e.target.value)}
                    placeholder="admin_techcorp"
                    data-testid="input-username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">E-mail Corporativo *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={onboardingData.email}
                    onChange={(e) => updateData('email', e.target.value)}
                    placeholder="admin@techcorp.com"
                    data-testid="input-email"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={onboardingData.password}
                    onChange={(e) => updateData('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    data-testid="input-password"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use uma senha forte com pelo menos 8 caracteres
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Escolha seu plano</h3>
                <p className="text-gray-600">Você pode alterar seu plano a qualquer momento</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer transition-all ${
                      onboardingData.plan === plan.id 
                        ? `${plan.color} border-2 shadow-lg` 
                        : 'border border-gray-200 hover:shadow-md'
                    }`}
                    onClick={() => updateData('plan', plan.id)}
                    data-testid={`card-plan-${plan.id}`}
                  >
                    <CardHeader className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.popular && <Badge className="ml-2">Popular</Badge>}
                      </div>
                      <div className="text-2xl font-bold text-primary">{plan.price}</div>
                      <div className="text-sm text-gray-600">{plan.period}</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <i className="fas fa-check text-green-500 mr-2"></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {onboardingData.plan && onboardingData.plan !== "freemium" && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-4">Forma de Pagamento</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {["Cartão de Crédito", "Boleto Bancário", "PIX"].map((method) => (
                      <button
                        key={method}
                        onClick={() => updateData('paymentMethod', method)}
                        className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                          onboardingData.paymentMethod === method
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 hover:border-primary'
                        }`}
                        data-testid={`payment-method-${method.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <i className="fas fa-rocket text-4xl text-primary mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">Tudo pronto!</h3>
                <p className="text-gray-600">Sua conta será criada e você receberá um email de confirmação</p>
              </div>
              
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Resumo da Configuração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong>Empresa:</strong> {onboardingData.companyName}
                    </div>
                    <div>
                      <strong>Setor:</strong> {industries.find(i => i.value === onboardingData.industry)?.label}
                    </div>
                    <div>
                      <strong>Tamanho:</strong> {companySizes.find(s => s.value === onboardingData.companySize)?.label}
                    </div>
                    <div>
                      <strong>Plano:</strong> {plans.find(p => p.id === onboardingData.plan)?.name}
                    </div>
                    <div>
                      <strong>Admin:</strong> {onboardingData.username}
                    </div>
                    <div>
                      <strong>E-mail:</strong> {onboardingData.email}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-primary mb-2">Próximos Passos:</h4>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Confirme seu email clicando no link enviado</li>
                    <li>Configure departamentos e equipes</li>
                    <li>Adicione agentes à sua organização</li>
                    <li>Configure SLAs e integrações</li>
                    <li>Crie seu primeiro ticket</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1}
            data-testid="button-previous-step"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Anterior
          </Button>

          {currentStep < steps.length ? (
            <Button 
              onClick={nextStep} 
              disabled={!canProceed()}
              data-testid="button-next-step"
            >
              Próximo
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          ) : (
            <Button 
              onClick={handleFinish} 
              disabled={!canProceed() || isLoading}
              data-testid="button-finish-onboarding"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Criando conta...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Finalizar
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}