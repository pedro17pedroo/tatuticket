import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface OnboardingData {
  // Step 1: Company Info
  companyName: string;
  companySize: string;
  industry: string;
  
  // Step 2: Contact Info  
  fullName: string;
  email: string;
  phone: string;
  position: string;
  
  // Step 3: Security Setup
  password: string;
  confirmPassword: string;
  otpCode: string;
  isEmailVerified: boolean;
  
  // Step 4: Plan Selection
  selectedPlan: "freemium" | "pro" | "enterprise";
  
  // Step 5: Requirements
  expectedTickets: string;
  integrations: string[];
  priorities: string[];
  
  // Step 6: Payment (for paid plans)
  paymentMethod?: "card" | "boleto" | "pix";
}

const companySizes = [
  { value: "1-10", label: "1-10 funcionários" },
  { value: "11-50", label: "11-50 funcionários" },
  { value: "51-200", label: "51-200 funcionários" },
  { value: "201-1000", label: "201-1000 funcionários" },
  { value: "1000+", label: "Mais de 1000 funcionários" }
];

const industries = [
  { value: "technology", label: "Tecnologia" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "healthcare", label: "Saúde" },
  { value: "finance", label: "Financeiro" },
  { value: "education", label: "Educação" },
  { value: "retail", label: "Varejo" },
  { value: "manufacturing", label: "Manufatura" },
  { value: "other", label: "Outro" }
];

const availableIntegrations = [
  { id: "slack", label: "Slack", icon: "fa-slack" },
  { id: "jira", label: "Jira", icon: "fa-jira" },
  { id: "zapier", label: "Zapier", icon: "fa-bolt" },
  { id: "whatsapp", label: "WhatsApp", icon: "fa-whatsapp" },
  { id: "email", label: "Email/SMTP", icon: "fa-envelope" },
  { id: "webhook", label: "Webhooks", icon: "fa-code" }
];

const priorities = [
  { id: "ai", label: "Automação com IA", icon: "fa-robot" },
  { id: "sla", label: "SLAs Rigorosos", icon: "fa-clock" },
  { id: "analytics", label: "Relatórios Avançados", icon: "fa-chart-bar" },
  { id: "mobile", label: "Suporte Mobile", icon: "fa-mobile-alt" },
  { id: "api", label: "Integrações API", icon: "fa-plug" },
  { id: "security", label: "Segurança Máxima", icon: "fa-shield-alt" }
];

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: "freemium" | "pro" | "enterprise";
}

export function OnboardingWizard({ isOpen, onClose, initialPlan = "freemium" }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyName: "",
    companySize: "",
    industry: "",
    fullName: "",
    email: "",
    phone: "",
    position: "",
    password: "",
    confirmPassword: "",
    otpCode: "",
    isEmailVerified: false,
    selectedPlan: initialPlan,
    expectedTickets: "",
    integrations: [],
    priorities: []
  });

  const totalSteps = 7; // All plans now go through the payment step (step 6) and completion (step 7)
  const progress = (currentStep / totalSteps) * 100;

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      // Create tenant
      const tenantResponse = await apiRequest("POST", "/api/tenants", {
        name: data.companyName,
        slug: data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        plan: data.selectedPlan,
        status: "active",
        settings: {
          industry: data.industry,
          companySize: data.companySize,
          expectedTickets: data.expectedTickets,
          integrations: data.integrations,
          priorities: data.priorities
        }
      });
      
      const tenant = await tenantResponse.json();
      
      // Create admin user for the tenant
      const userResponse = await apiRequest("POST", "/api/auth/register", {
        username: data.fullName,
        email: data.email,
        password: data.password,
        role: "admin",
        tenantId: tenant.id
      });
      
      return { tenant, user: await userResponse.json() };
    },
    onSuccess: (data) => {
      toast({
        title: "Conta criada com sucesso! 🎉",
        description: `Bem-vindo ao TatuTicket, ${onboardingData.fullName}! Verifique seu email para ativar sua conta.`,
      });
      
      // In production, redirect to email verification or login
      setCurrentStep(totalSteps + 1); // Success step
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step - create account
      setIsLoading(true);
      try {
        await createAccountMutation.mutateAsync(onboardingData);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.companyName && onboardingData.companySize && onboardingData.industry;
      case 2:
        return onboardingData.fullName && onboardingData.email && onboardingData.position;
      case 3:
        return onboardingData.password && 
               onboardingData.confirmPassword && 
               onboardingData.password === onboardingData.confirmPassword &&
               onboardingData.password.length >= 6 &&
               onboardingData.isEmailVerified;
      case 4:
        return onboardingData.selectedPlan;
      case 5:
        return true; // Optional step
      case 6:
        return onboardingData.selectedPlan === "freemium" || onboardingData.paymentMethod;
      default:
        return true;
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const toggleIntegration = (integrationId: string) => {
    const current = onboardingData.integrations;
    const updated = current.includes(integrationId)
      ? current.filter(id => id !== integrationId)
      : [...current, integrationId];
    updateData({ integrations: updated });
  };

  const togglePriority = (priorityId: string) => {
    const current = onboardingData.priorities;
    const updated = current.includes(priorityId)
      ? current.filter(id => id !== priorityId)
      : [...current, priorityId];
    updateData({ priorities: updated });
  };

  // OTP functions
  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/send-otp", {
        email,
        type: "email_verification"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setOtpSent(true);
      toast({
        title: "Código enviado!",
        description: `Enviamos um código de verificação para ${onboardingData.email}`,
      });
      
      // In development, show the OTP code for testing
      if (data.otpCode) {
        toast({
          title: "Código para teste",
          description: `Use o código: ${data.otpCode}`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar código",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        email,
        code,
        type: "email_verification"
      });
      return response.json();
    },
    onSuccess: () => {
      updateData({ isEmailVerified: true });
      toast({
        title: "Email verificado!",
        description: "Seu email foi verificado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Código inválido",
        description: error.message || "Verifique o código e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSendOtp = () => {
    if (onboardingData.email) {
      setIsSendingOtp(true);
      sendOtpMutation.mutate(onboardingData.email);
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    if (onboardingData.email && onboardingData.otpCode) {
      verifyOtpMutation.mutate({
        email: onboardingData.email,
        code: onboardingData.otpCode
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <i className="fas fa-building text-3xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold">Informações da Empresa</h3>
              <p className="text-gray-600">Conte-nos sobre sua empresa</p>
            </div>
            
            <div>
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={onboardingData.companyName}
                onChange={(e) => updateData({ companyName: e.target.value })}
                placeholder="Ex: TechCorp Solutions"
                data-testid="input-company-name"
              />
            </div>
            
            <div>
              <Label htmlFor="companySize">Tamanho da Empresa *</Label>
              <Select value={onboardingData.companySize} onValueChange={(value) => updateData({ companySize: value })}>
                <SelectTrigger data-testid="select-company-size">
                  <SelectValue placeholder="Selecione o tamanho..." />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map(size => (
                    <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="industry">Setor *</Label>
              <Select value={onboardingData.industry} onValueChange={(value) => updateData({ industry: value })}>
                <SelectTrigger data-testid="select-industry">
                  <SelectValue placeholder="Selecione o setor..." />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry.value} value={industry.value}>{industry.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <i className="fas fa-user text-3xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold">Seus Dados</h3>
              <p className="text-gray-600">Informações do responsável pela conta</p>
            </div>
            
            <div>
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={onboardingData.fullName}
                onChange={(e) => updateData({ fullName: e.target.value })}
                placeholder="João Silva"
                data-testid="input-full-name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Corporativo *</Label>
              <Input
                id="email"
                type="email"
                value={onboardingData.email}
                onChange={(e) => updateData({ email: e.target.value })}
                placeholder="joao@empresa.com"
                data-testid="input-email"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={onboardingData.phone}
                onChange={(e) => updateData({ phone: e.target.value })}
                placeholder="(11) 99999-9999"
                data-testid="input-phone"
              />
            </div>
            
            <div>
              <Label htmlFor="position">Cargo *</Label>
              <Input
                id="position"
                value={onboardingData.position}
                onChange={(e) => updateData({ position: e.target.value })}
                placeholder="Gerente de TI"
                data-testid="input-position"
              />
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <i className="fas fa-shield-alt text-3xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold">Configuração de Segurança</h3>
              <p className="text-gray-600">Defina sua senha e verifique seu email</p>
            </div>
            
            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={onboardingData.password}
                onChange={(e) => updateData({ password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                data-testid="input-password"
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={onboardingData.confirmPassword}
                onChange={(e) => updateData({ confirmPassword: e.target.value })}
                placeholder="Digite a senha novamente"
                data-testid="input-confirm-password"
              />
              {onboardingData.password && onboardingData.confirmPassword && 
               onboardingData.password !== onboardingData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">As senhas não coincidem</p>
              )}
            </div>
            
            <div className="border-t pt-4">
              <Label>Verificação de Email *</Label>
              <div className="space-y-3 mt-2">
                <div className="flex gap-2">
                  <Input
                    value={onboardingData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <Button
                    onClick={handleSendOtp}
                    disabled={!onboardingData.email || isSendingOtp || sendOtpMutation.isPending}
                    variant="outline"
                    data-testid="button-send-otp"
                  >
                    {sendOtpMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Enviando...
                      </>
                    ) : otpSent ? (
                      "Reenviar"
                    ) : (
                      "Enviar Código"
                    )}
                  </Button>
                </div>
                
                {otpSent && (
                  <div className="flex gap-2">
                    <Input
                      value={onboardingData.otpCode}
                      onChange={(e) => updateData({ otpCode: e.target.value })}
                      placeholder="Digite o código de 6 dígitos"
                      maxLength={6}
                      data-testid="input-otp-code"
                    />
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={!onboardingData.otpCode || verifyOtpMutation.isPending || onboardingData.isEmailVerified}
                      data-testid="button-verify-otp"
                    >
                      {verifyOtpMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Verificando...
                        </>
                      ) : onboardingData.isEmailVerified ? (
                        <>
                          <i className="fas fa-check mr-2"></i>
                          Verificado
                        </>
                      ) : (
                        "Verificar"
                      )}
                    </Button>
                  </div>
                )}
                
                {onboardingData.isEmailVerified && (
                  <div className="flex items-center text-green-600 text-sm">
                    <i className="fas fa-check-circle mr-2"></i>
                    Email verificado com sucesso!
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <i className="fas fa-star text-3xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold">Escolha seu Plano</h3>
              <p className="text-gray-600">Selecione o plano ideal para sua empresa</p>
            </div>
            
            <div className="grid gap-4">
              {[
                { id: "freemium", name: "Freemium", price: "R$ 0", desc: "Até 3 agentes, 50 tickets/mês" },
                { id: "pro", name: "Pro", price: "R$ 29", desc: "Agentes ilimitados, IA avançada", popular: true },
                { id: "enterprise", name: "Enterprise", price: "Custom", desc: "White-label, on-premise, suporte 24/7" }
              ].map(plan => (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "cursor-pointer transition-all",
                    onboardingData.selectedPlan === plan.id ? "border-primary bg-blue-50" : "hover:shadow-md",
                    plan.popular && "border-2 border-primary"
                  )}
                  onClick={() => updateData({ selectedPlan: plan.id as any })}
                  data-testid={`plan-${plan.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        onboardingData.selectedPlan === plan.id ? "bg-primary border-primary" : "border-gray-300"
                      )}></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{plan.name}</h4>
                          {plan.popular && <span className="bg-primary text-white px-2 py-1 rounded text-xs">Popular</span>}
                        </div>
                        <p className="text-lg font-bold text-primary">{plan.price}</p>
                        <p className="text-sm text-gray-600">{plan.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <i className="fas fa-sliders-h text-3xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold">Suas Necessidades</h3>
              <p className="text-gray-600">Ajude-nos a personalizar sua experiência</p>
            </div>
            
            <div>
              <Label htmlFor="expectedTickets">Volume esperado de tickets por mês</Label>
              <Select value={onboardingData.expectedTickets} onValueChange={(value) => updateData({ expectedTickets: value })}>
                <SelectTrigger data-testid="select-expected-tickets">
                  <SelectValue placeholder="Selecione o volume..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-100">0-100 tickets</SelectItem>
                  <SelectItem value="101-500">101-500 tickets</SelectItem>
                  <SelectItem value="501-1000">501-1000 tickets</SelectItem>
                  <SelectItem value="1000+">Mais de 1000 tickets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Integrações de interesse (selecione quantas quiser)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {availableIntegrations.map(integration => (
                  <div 
                    key={integration.id} 
                    className={cn(
                      "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                      onboardingData.integrations.includes(integration.id) ? "border-primary bg-blue-50" : "hover:bg-gray-50"
                    )}
                    onClick={() => toggleIntegration(integration.id)}
                    data-testid={`integration-${integration.id}`}
                  >
                    <Checkbox 
                      checked={onboardingData.integrations.includes(integration.id)}
                      onChange={() => {}}
                    />
                    <i className={`fab ${integration.icon} text-gray-600`}></i>
                    <span className="text-sm font-medium">{integration.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Prioridades (selecione suas principais necessidades)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {priorities.map(priority => (
                  <div 
                    key={priority.id} 
                    className={cn(
                      "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                      onboardingData.priorities.includes(priority.id) ? "border-primary bg-blue-50" : "hover:bg-gray-50"
                    )}
                    onClick={() => togglePriority(priority.id)}
                    data-testid={`priority-${priority.id}`}
                  >
                    <Checkbox 
                      checked={onboardingData.priorities.includes(priority.id)}
                      onChange={() => {}}
                    />
                    <i className={`fas ${priority.icon} text-gray-600`}></i>
                    <span className="text-sm font-medium">{priority.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <i className="fas fa-credit-card text-3xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold">Pagamento</h3>
              <p className="text-gray-600">Complete seu plano {onboardingData.selectedPlan.toUpperCase()}</p>
            </div>
            
            {onboardingData.selectedPlan === "freemium" ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <i className="fas fa-gift text-green-500 text-2xl"></i>
                  <div>
                    <h4 className="font-semibold text-green-800">Plano Gratuito</h4>
                    <p className="text-green-700">Sua conta gratuita será criada imediatamente!</p>
                  </div>
                </div>
              </div>
            ) : onboardingData.selectedPlan === "enterprise" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <i className="fas fa-handshake text-blue-500 text-2xl"></i>
                  <div>
                    <h4 className="font-semibold text-blue-800">Plano Enterprise</h4>
                    <p className="text-blue-700">Nossa equipe entrará em contato para uma proposta personalizada.</p>
                    <div className="mt-4 p-4 bg-white rounded border">
                      <h5 className="font-medium mb-2">Informações para contato:</h5>
                      <div className="text-sm space-y-1">
                        <p><strong>Empresa:</strong> {onboardingData.companyName}</p>
                        <p><strong>Email:</strong> {onboardingData.email}</p>
                        <p><strong>Telefone:</strong> {onboardingData.phone}</p>
                        <p><strong>Volume esperado:</strong> {onboardingData.expectedTickets} tickets/mês</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="border-primary bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">Plano Pro</h4>
                        <p className="text-sm text-gray-600">Agentes ilimitados • IA avançada • Integrações</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">R$ 29</p>
                        <p className="text-sm text-gray-600">por agente/mês</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div>
                  <Label>Método de pagamento</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { value: "card", label: "Cartão", icon: "fa-credit-card" },
                      { value: "boleto", label: "Boleto", icon: "fa-barcode" },
                      { value: "pix", label: "PIX", icon: "fa-mobile-alt" }
                    ].map(method => (
                      <div
                        key={method.value}
                        className={cn(
                          "flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors",
                          onboardingData.paymentMethod === method.value ? "border-primary bg-blue-50" : "hover:bg-gray-50"
                        )}
                        onClick={() => updateData({ paymentMethod: method.value as any })}
                        data-testid={`payment-${method.value}`}
                      >
                        <i className={`fas ${method.icon} text-lg mb-2 text-gray-600`}></i>
                        <span className="text-sm font-medium">{method.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {onboardingData.paymentMethod === "card" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label htmlFor="cardNumber">Número do cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="**** **** **** ****"
                        data-testid="input-card-number"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry">Validade</Label>
                        <Input
                          id="cardExpiry"
                          placeholder="MM/AA"
                          data-testid="input-card-expiry"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvc">CVC</Label>
                        <Input
                          id="cardCvc"
                          placeholder="***"
                          maxLength={3}
                          data-testid="input-card-cvc"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <i className="fas fa-check-circle text-3xl text-green-500 mb-4"></i>
              <h3 className="text-xl font-semibold">Configuração Concluída!</h3>
              <p className="text-gray-600">Sua conta está sendo criada...</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <i className="fas fa-info-circle text-green-500 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-green-800">Próximos Passos</h4>
                  <ul className="text-green-700 text-sm space-y-1 mt-2">
                    <li>• Você receberá um email de confirmação</li>
                    <li>• Sua conta será ativada em poucos minutos</li>
                    <li>• Você será redirecionado para o portal da empresa</li>
                    <li>• Um tour inicial será apresentado</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-600">Criando sua conta...</p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-8">
            <i className="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Conta Criada com Sucesso! 🎉</h3>
            <p className="text-gray-600 mb-6">
              Enviamos um email de verificação para <strong>{onboardingData.email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Próximos Passos:</h4>
              <ul className="text-left text-blue-700 space-y-1">
                <li>✓ Verifique seu email e ative sua conta</li>
                <li>✓ Faça login no Portal Organizacional</li>
                <li>✓ Configure sua estrutura (departamentos, agentes)</li>
                <li>✓ Integre com suas ferramentas favoritas</li>
              </ul>
            </div>
            <Button onClick={onClose} className="w-full" data-testid="button-get-started">
              Começar a Usar o TatuTicket
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" data-testid="dialog-onboarding">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-rocket mr-2 text-primary"></i>
            Bem-vindo ao TatuTicket
          </DialogTitle>
        </DialogHeader>
        
        {currentStep <= totalSteps && (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Etapa {currentStep} de {totalSteps}</span>
                <span>{Math.round(progress)}% completo</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </>
        )}
        
        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>
        
        {/* Navigation Buttons */}
        {currentStep <= totalSteps && (
          <div className="flex gap-4 pt-4 border-t mt-auto flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex-1"
              data-testid="button-back"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Voltar
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!isStepValid() || isLoading}
              className="flex-1"
              data-testid="button-next"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Criando...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Finalizar
                </>
              ) : (
                <>
                  Próximo
                  <i className="fas fa-chevron-right ml-2"></i>
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}