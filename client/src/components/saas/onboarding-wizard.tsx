import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building,
  Users,
  Settings,
  CreditCard,
  Rocket,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

interface OnboardingData {
  step: number;
  company: {
    name: string;
    slug: string;
    industry: string;
    size: string;
    description: string;
  };
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
  };
  address: {
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  plan: {
    selected: string;
    billingCycle: 'monthly' | 'yearly';
    features: string[];
  };
  configuration: {
    departments: string[];
    agents: number;
    expectedTickets: number;
    integrations: string[];
  };
}

const INDUSTRIES = [
  { value: 'technology', label: 'Tecnologia' },
  { value: 'healthcare', label: 'Saúde' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'education', label: 'Educação' },
  { value: 'retail', label: 'Varejo' },
  { value: 'manufacturing', label: 'Manufatura' },
  { value: 'services', label: 'Serviços' },
  { value: 'other', label: 'Outro' },
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 funcionários' },
  { value: '11-50', label: '11-50 funcionários' },
  { value: '51-200', label: '51-200 funcionários' },
  { value: '201-500', label: '201-500 funcionários' },
  { value: '500+', label: '500+ funcionários' },
];

const PLAN_OPTIONS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    features: ['Até 3 agentes', '500 tickets/mês', 'Email e chat', 'Relatórios básicos'],
    recommended: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    features: ['Até 10 agentes', '2000 tickets/mês', 'Automação básica', 'Integrações', 'SLA básico'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    features: ['Agentes ilimitados', 'Tickets ilimitados', 'Automação avançada', 'API completa', 'SLA personalizado'],
    recommended: false,
  },
];

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingData) => void;
  isOpen?: boolean;
  onClose?: () => void;
  initialPlan?: string;
}

export function OnboardingWizard({ onComplete, isOpen = false, onClose, initialPlan = "freemium" }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    step: 1,
    company: {
      name: '',
      slug: '',
      industry: '',
      size: '',
      description: '',
    },
    contact: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
    },
    address: {
      street: '',
      number: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'BR',
    },
    plan: {
      selected: 'professional',
      billingCycle: 'monthly',
      features: [],
    },
    configuration: {
      departments: [],
      agents: 5,
      expectedTickets: 100,
      integrations: [],
    },
  });

  const { toast } = useToast();

  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: OnboardingData) => {
      // Create tenant and subscription
      const response = await fetch('/api/tenants/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantData),
      });
      if (!response.ok) throw new Error('Failed to create tenant');
      return response.json();
    },
    onSuccess: (result) => {
      toast({ title: 'Organização criada com sucesso!' });
      onComplete?.(data);
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao criar organização', 
        description: 'Tente novamente', 
        variant: 'destructive' 
      });
    },
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setData({ ...data, step: currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setData({ ...data, step: currentStep - 1 });
    }
  };

  const completeOnboarding = () => {
    createTenantMutation.mutate(data);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCompanyNameChange = (name: string) => {
    setData({
      ...data,
      company: {
        ...data.company,
        name,
        slug: generateSlug(name),
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6" data-testid="onboarding-wizard">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Configuração da Organização</CardTitle>
              <p className="text-muted-foreground">
                Etapa {currentStep} de {totalSteps}
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {Math.round(progress)}% concluído
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <CompanyInfoStep 
              data={data} 
              onChange={setData}
              onCompanyNameChange={handleCompanyNameChange}
            />
          )}
          {currentStep === 2 && (
            <ContactInfoStep data={data} onChange={setData} />
          )}
          {currentStep === 3 && (
            <PlanSelectionStep data={data} onChange={setData} />
          )}
          {currentStep === 4 && (
            <ConfigurationStep data={data} onChange={setData} />
          )}
          {currentStep === 5 && (
            <ReviewStep data={data} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 1}
          data-testid="button-prev-step"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        
        {currentStep < totalSteps ? (
          <Button 
            onClick={nextStep}
            data-testid="button-next-step"
          >
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={completeOnboarding}
            disabled={createTenantMutation.isPending}
            data-testid="button-complete-onboarding"
          >
            {createTenantMutation.isPending ? 'Criando...' : 'Finalizar'}
            <Rocket className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Company Information
function CompanyInfoStep({ 
  data, 
  onChange, 
  onCompanyNameChange 
}: { 
  data: OnboardingData; 
  onChange: (data: OnboardingData) => void;
  onCompanyNameChange: (name: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Informações da Empresa</h2>
        <p className="text-muted-foreground">Conte-nos sobre sua organização</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nome da Empresa *</Label>
          <Input
            id="company-name"
            value={data.company.name}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Ex: TechCorp Solutions"
            required
            data-testid="input-company-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-slug">Subdomínio</Label>
          <div className="flex">
            <Input
              id="company-slug"
              value={data.company.slug}
              onChange={(e) => onChange({
                ...data,
                company: { ...data.company, slug: e.target.value }
              })}
              placeholder="techcorp"
              data-testid="input-company-slug"
            />
            <span className="px-3 py-2 bg-muted text-muted-foreground border border-l-0 rounded-r">
              .tatuticket.com
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Setor *</Label>
          <Select
            value={data.company.industry}
            onValueChange={(value) => onChange({
              ...data,
              company: { ...data.company, industry: value }
            })}
          >
            <SelectTrigger data-testid="select-industry">
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry.value} value={industry.value}>
                  {industry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-size">Tamanho da Empresa *</Label>
          <Select
            value={data.company.size}
            onValueChange={(value) => onChange({
              ...data,
              company: { ...data.company, size: value }
            })}
          >
            <SelectTrigger data-testid="select-company-size">
              <SelectValue placeholder="Selecione o tamanho" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição da Empresa</Label>
        <Textarea
          id="description"
          value={data.company.description}
          onChange={(e) => onChange({
            ...data,
            company: { ...data.company, description: e.target.value }
          })}
          placeholder="Descreva brevemente o que sua empresa faz..."
          rows={3}
          data-testid="textarea-company-description"
        />
      </div>
    </div>
  );
}

// Step 2: Contact Information
function ContactInfoStep({ data, onChange }: { 
  data: OnboardingData; 
  onChange: (data: OnboardingData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Informações de Contato</h2>
        <p className="text-muted-foreground">Dados do responsável principal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">Primeiro Nome *</Label>
          <Input
            id="first-name"
            value={data.contact.firstName}
            onChange={(e) => onChange({
              ...data,
              contact: { ...data.contact, firstName: e.target.value }
            })}
            placeholder="João"
            required
            data-testid="input-first-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last-name">Sobrenome *</Label>
          <Input
            id="last-name"
            value={data.contact.lastName}
            onChange={(e) => onChange({
              ...data,
              contact: { ...data.contact, lastName: e.target.value }
            })}
            placeholder="Silva"
            required
            data-testid="input-last-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={data.contact.email}
            onChange={(e) => onChange({
              ...data,
              contact: { ...data.contact, email: e.target.value }
            })}
            placeholder="joao@empresa.com"
            required
            data-testid="input-email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={data.contact.phone}
            onChange={(e) => onChange({
              ...data,
              contact: { ...data.contact, phone: e.target.value }
            })}
            placeholder="(11) 99999-9999"
            data-testid="input-phone"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="position">Cargo *</Label>
          <Input
            id="position"
            value={data.contact.position}
            onChange={(e) => onChange({
              ...data,
              contact: { ...data.contact, position: e.target.value }
            })}
            placeholder="Ex: Gerente de TI"
            required
            data-testid="input-position"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Endereço da Empresa
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              value={data.address.street}
              onChange={(e) => onChange({
                ...data,
                address: { ...data.address, street: e.target.value }
              })}
              placeholder="Rua das Flores"
              required
              data-testid="input-street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              value={data.address.number}
              onChange={(e) => onChange({
                ...data,
                address: { ...data.address, number: e.target.value }
              })}
              placeholder="123"
              required
              data-testid="input-number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={data.address.city}
              onChange={(e) => onChange({
                ...data,
                address: { ...data.address, city: e.target.value }
              })}
              placeholder="São Paulo"
              required
              data-testid="input-city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <Input
              id="state"
              value={data.address.state}
              onChange={(e) => onChange({
                ...data,
                address: { ...data.address, state: e.target.value }
              })}
              placeholder="SP"
              required
              data-testid="input-state"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip">CEP *</Label>
            <Input
              id="zip"
              value={data.address.zipCode}
              onChange={(e) => onChange({
                ...data,
                address: { ...data.address, zipCode: e.target.value }
              })}
              placeholder="01234-567"
              required
              data-testid="input-zip"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Plan Selection
function PlanSelectionStep({ data, onChange }: { 
  data: OnboardingData; 
  onChange: (data: OnboardingData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Escolha seu Plano</h2>
        <p className="text-muted-foreground">Selecione o plano ideal para sua organização</p>
      </div>

      <Tabs 
        value={data.plan.billingCycle} 
        onValueChange={(value: string) => 
          onChange({
            ...data,
            plan: { ...data.plan, billingCycle: value as 'monthly' | 'yearly' }
          })
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly" data-testid="tab-monthly">Mensal</TabsTrigger>
          <TabsTrigger value="yearly" data-testid="tab-yearly">
            Anual <Badge variant="secondary" className="ml-2">-20%</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <PlanCards 
            plans={PLAN_OPTIONS} 
            billingCycle="monthly"
            selectedPlan={data.plan.selected}
            onSelectPlan={(planId) => onChange({
              ...data,
              plan: { ...data.plan, selected: planId }
            })}
          />
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <PlanCards 
            plans={PLAN_OPTIONS.map(plan => ({
              ...plan,
              price: Math.round(plan.price * 12 * 0.8) // 20% discount
            }))} 
            billingCycle="yearly"
            selectedPlan={data.plan.selected}
            onSelectPlan={(planId) => onChange({
              ...data,
              plan: { ...data.plan, selected: planId }
            })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Plan Cards Component
function PlanCards({ 
  plans, 
  billingCycle, 
  selectedPlan, 
  onSelectPlan 
}: {
  plans: typeof PLAN_OPTIONS;
  billingCycle: 'monthly' | 'yearly';
  selectedPlan: string;
  onSelectPlan: (planId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={`relative cursor-pointer transition-all ${
            selectedPlan === plan.id 
              ? 'ring-2 ring-primary shadow-lg' 
              : 'hover:shadow-md'
          } ${plan.recommended ? 'border-primary' : ''}`}
          onClick={() => onSelectPlan(plan.id)}
          data-testid={`plan-card-${plan.id}`}
        >
          {plan.recommended && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              Recomendado
            </Badge>
          )}
          
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                R$ {plan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-green-600">
                  Economize R$ {Math.round(plan.price * 12 * 0.2)} por ano
                </p>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Step 4: Configuration
function ConfigurationStep({ data, onChange }: { 
  data: OnboardingData; 
  onChange: (data: OnboardingData) => void;
}) {
  const [newDepartment, setNewDepartment] = useState('');

  const addDepartment = () => {
    if (newDepartment.trim()) {
      onChange({
        ...data,
        configuration: {
          ...data.configuration,
          departments: [...data.configuration.departments, newDepartment.trim()]
        }
      });
      setNewDepartment('');
    }
  };

  const removeDepartment = (index: number) => {
    onChange({
      ...data,
      configuration: {
        ...data.configuration,
        departments: data.configuration.departments.filter((_, i) => i !== index)
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Configuração Inicial</h2>
        <p className="text-muted-foreground">Configure sua organização</p>
      </div>

      <div className="space-y-6">
        {/* Departments */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Departamentos</h3>
          <div className="flex space-x-2">
            <Input
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="Ex: Suporte Técnico"
              onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
              data-testid="input-new-department"
            />
            <Button onClick={addDepartment} data-testid="button-add-department">
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.configuration.departments.map((dept, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => removeDepartment(index)}
                data-testid={`department-${index}`}
              >
                {dept} ×
              </Badge>
            ))}
          </div>
        </div>

        {/* Team Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="agents">Número inicial de agentes</Label>
            <Input
              id="agents"
              type="number"
              value={data.configuration.agents}
              onChange={(e) => onChange({
                ...data,
                configuration: { ...data.configuration, agents: parseInt(e.target.value) || 0 }
              })}
              min={1}
              max={100}
              data-testid="input-agents-count"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tickets">Tickets esperados por mês</Label>
            <Input
              id="tickets"
              type="number"
              value={data.configuration.expectedTickets}
              onChange={(e) => onChange({
                ...data,
                configuration: { ...data.configuration, expectedTickets: parseInt(e.target.value) || 0 }
              })}
              min={10}
              data-testid="input-expected-tickets"
            />
          </div>
        </div>

        {/* Integrations */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Integrações Desejadas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Slack', 'Microsoft Teams', 'Jira', 'Zendesk', 'WhatsApp', 'Email'].map((integration) => (
              <div key={integration} className="flex items-center space-x-2">
                <Checkbox
                  id={integration}
                  checked={data.configuration.integrations.includes(integration)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange({
                        ...data,
                        configuration: {
                          ...data.configuration,
                          integrations: [...data.configuration.integrations, integration]
                        }
                      });
                    } else {
                      onChange({
                        ...data,
                        configuration: {
                          ...data.configuration,
                          integrations: data.configuration.integrations.filter(i => i !== integration)
                        }
                      });
                    }
                  }}
                  data-testid={`checkbox-${integration.toLowerCase()}`}
                />
                <Label htmlFor={integration} className="text-sm">{integration}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 5: Review
function ReviewStep({ data }: { data: OnboardingData }) {
  const selectedPlan = PLAN_OPTIONS.find(p => p.id === data.plan.selected);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Revisão Final</h2>
        <p className="text-muted-foreground">Confirme suas informações antes de finalizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Nome:</strong> {data.company.name}
            </div>
            <div>
              <strong>Subdomínio:</strong> {data.company.slug}.tatuticket.com
            </div>
            <div>
              <strong>Setor:</strong> {INDUSTRIES.find(i => i.value === data.company.industry)?.label}
            </div>
            <div>
              <strong>Tamanho:</strong> {COMPANY_SIZES.find(s => s.value === data.company.size)?.label}
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Nome:</strong> {data.contact.firstName} {data.contact.lastName}
            </div>
            <div>
              <strong>Email:</strong> {data.contact.email}
            </div>
            <div>
              <strong>Cargo:</strong> {data.contact.position}
            </div>
            {data.contact.phone && (
              <div>
                <strong>Telefone:</strong> {data.contact.phone}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Plano Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Plano:</strong> {selectedPlan?.name}
            </div>
            <div>
              <strong>Valor:</strong> R$ {selectedPlan?.price}/{data.plan.billingCycle === 'monthly' ? 'mês' : 'ano'}
            </div>
            <div>
              <strong>Ciclo:</strong> {data.plan.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Departamentos:</strong> {data.configuration.departments.join(', ') || 'Nenhum'}
            </div>
            <div>
              <strong>Agentes:</strong> {data.configuration.agents}
            </div>
            <div>
              <strong>Tickets/mês:</strong> {data.configuration.expectedTickets}
            </div>
            <div>
              <strong>Integrações:</strong> {data.configuration.integrations.join(', ') || 'Nenhuma'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="font-medium text-green-800">Pronto para começar!</h3>
              <p className="text-sm text-green-600">
                Sua organização será criada e você receberá um email de confirmação em {data.contact.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}