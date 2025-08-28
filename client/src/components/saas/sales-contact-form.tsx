import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, DollarSign, Calendar, X, Loader2, CheckCircle, Phone } from "lucide-react";

const salesContactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Por favor, insira um email válido"),
  phone: z.string().min(9, "Número de telefone inválido").max(20, "Número muito longo"),
  company: z.string().min(1, "Nome da empresa é obrigatório").max(100, "Nome da empresa muito longo"),
  jobTitle: z.string().min(1, "Cargo é obrigatório").max(100, "Cargo muito longo"),
  companySize: z.string().min(1, "Por favor, selecione o tamanho da empresa"),
  industry: z.string().min(1, "Por favor, selecione o setor").max(100, "Setor muito longo"),
  currentTicketVolume: z.string().min(1, "Por favor, selecione o volume atual"),
  budget: z.string().min(1, "Por favor, selecione a faixa de orçamento"),
  timeline: z.string().min(1, "Por favor, selecione o prazo de implementação"),
  requirements: z.string().max(1000, "Requisitos muito longos").optional(),
  challenges: z.string().max(1000, "Desafios muito longos").optional(),
});

type SalesContactData = z.infer<typeof salesContactSchema>;

interface SalesContactFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalesContactForm({ isOpen, onClose }: SalesContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<SalesContactData>({
    resolver: zodResolver(salesContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      companySize: "",
      industry: "",
      currentTicketVolume: "",
      budget: "",
      timeline: "",
      requirements: "",
      challenges: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: SalesContactData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/sales-contacts', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          source: 'pricing_page',
          priority: 'enterprise',
          timestamp: new Date().toISOString(),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to submit sales contact');
      }

      setIsSuccess(true);
      
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Nossa equipe de vendas entrará em contacto dentro de 4 horas úteis.",
      });

      // Auto close after success
      setTimeout(() => {
        form.reset();
        setIsSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting sales contact:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Ocorreu um erro. Tente novamente ou contacte nosso suporte.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setIsSuccess(false);
      onClose();
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Solicitação Enviada!
            </h3>
            <p className="text-gray-600 mb-4">
              Obrigado pelo seu interesse no TatuTicket Enterprise. 
              Nossa equipe de vendas analisará suas necessidades e entrará em contacto 
              dentro de 4 horas úteis.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Resposta em até 4h úteis</span>
              </div>
              <div>Esta janela fechará automaticamente...</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}>
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                Falar com Vendas
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Vamos conversar sobre como o TatuTicket pode atender às necessidades específicas da sua empresa
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full bg-[#fc4e42]"
              disabled={isSubmitting}
              data-testid="button-close-sales-form"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informações de Contacto
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome completo *
                </Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome completo"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("name")}
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email corporativo *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("email")}
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Telefone *
                </Label>
                <Input
                  id="phone"
                  placeholder="+244 9XX XXX XXX"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("phone")}
                  data-testid="input-phone"
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
                  Cargo *
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="ex: CTO, Diretor de TI, Gerente de Suporte"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.jobTitle ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("jobTitle")}
                  data-testid="input-job-title"
                />
                {form.formState.errors.jobTitle && (
                  <p className="text-xs text-red-600">{form.formState.errors.jobTitle.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Empresa
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                  Nome da empresa *
                </Label>
                <Input
                  id="company"
                  placeholder="Nome da sua empresa"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.company ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("company")}
                  data-testid="input-company"
                />
                {form.formState.errors.company && (
                  <p className="text-xs text-red-600">{form.formState.errors.company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                  Setor *
                </Label>
                <Input
                  id="industry"
                  placeholder="ex: Tecnologia, Saúde, Finanças, E-commerce"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.industry ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("industry")}
                  data-testid="input-industry"
                />
                {form.formState.errors.industry && (
                  <p className="text-xs text-red-600">{form.formState.errors.industry.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tamanho da empresa *
                </Label>
                <Select
                  value={form.watch("companySize")}
                  onValueChange={(value) => form.setValue("companySize", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.companySize ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}>
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 funcionários</SelectItem>
                    <SelectItem value="11-50">11-50 funcionários</SelectItem>
                    <SelectItem value="51-200">51-200 funcionários</SelectItem>
                    <SelectItem value="201-500">201-500 funcionários</SelectItem>
                    <SelectItem value="501-1000">501-1000 funcionários</SelectItem>
                    <SelectItem value="1000+">Mais de 1000 funcionários</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.companySize && (
                  <p className="text-xs text-red-600">{form.formState.errors.companySize.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Volume atual de tickets *
                </Label>
                <Select
                  value={form.watch("currentTicketVolume")}
                  onValueChange={(value) => form.setValue("currentTicketVolume", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.currentTicketVolume ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}>
                    <SelectValue placeholder="Volume mensal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-100">0-100 tickets/mês</SelectItem>
                    <SelectItem value="101-500">101-500 tickets/mês</SelectItem>
                    <SelectItem value="501-1000">501-1000 tickets/mês</SelectItem>
                    <SelectItem value="1001-5000">1001-5000 tickets/mês</SelectItem>
                    <SelectItem value="5000+">Mais de 5000 tickets/mês</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.currentTicketVolume && (
                  <p className="text-xs text-red-600">{form.formState.errors.currentTicketVolume.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalhes do Projeto
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Orçamento estimado *
                </Label>
                <Select
                  value={form.watch("budget")}
                  onValueChange={(value) => form.setValue("budget", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.budget ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}>
                    <SelectValue placeholder="Faixa de orçamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-50k">Menos de Kz 50.000/mês</SelectItem>
                    <SelectItem value="50k-100k">Kz 50.000 - 100.000/mês</SelectItem>
                    <SelectItem value="100k-250k">Kz 100.000 - 250.000/mês</SelectItem>
                    <SelectItem value="250k-500k">Kz 250.000 - 500.000/mês</SelectItem>
                    <SelectItem value="500k+">Mais de Kz 500.000/mês</SelectItem>
                    <SelectItem value="to-discuss">A discutir</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.budget && (
                  <p className="text-xs text-red-600">{form.formState.errors.budget.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Prazo de implementação *
                </Label>
                <Select
                  value={form.watch("timeline")}
                  onValueChange={(value) => form.setValue("timeline", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.timeline ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}>
                    <SelectValue placeholder="Quando pretende implementar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Imediatamente</SelectItem>
                    <SelectItem value="1-month">Dentro de 1 mês</SelectItem>
                    <SelectItem value="1-3-months">1-3 meses</SelectItem>
                    <SelectItem value="3-6-months">3-6 meses</SelectItem>
                    <SelectItem value="6-12-months">6-12 meses</SelectItem>
                    <SelectItem value="planning">Ainda estou avaliando</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.timeline && (
                  <p className="text-xs text-red-600">{form.formState.errors.timeline.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informações Adicionais
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-medium text-gray-700">
                  Requisitos específicos (opcional)
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="ex: Integração com Salesforce, instalação on-premise, conformidade específica..."
                  rows={4}
                  className="resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  {...form.register("requirements")}
                  data-testid="textarea-requirements"
                />
                <p className="text-xs text-gray-500">
                  Máximo de 1000 caracteres ({form.watch("requirements")?.length || 0}/1000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenges" className="text-sm font-medium text-gray-700">
                  Principais desafios atuais (opcional)
                </Label>
                <Textarea
                  id="challenges"
                  placeholder="ex: Alto volume de tickets, falta de automação, tempo de resposta lento..."
                  rows={4}
                  className="resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  {...form.register("challenges")}
                  data-testid="textarea-challenges"
                />
                <p className="text-xs text-gray-500">
                  Máximo de 1000 caracteres ({form.watch("challenges")?.length || 0}/1000)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
              data-testid="button-cancel-sales"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200"
              data-testid="button-submit-sales"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </div>
          
          {/* Disclaimer */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Ao enviar, você concorda em ser contactado pela nossa equipe de vendas. 
            <br />Respeitamos a sua privacidade e nunca partilharemos os seus dados.
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}