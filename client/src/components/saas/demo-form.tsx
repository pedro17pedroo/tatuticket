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
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User, Building, Phone, Mail, MessageSquare, X, Loader2, CheckCircle } from "lucide-react";

const demoFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Por favor, insira um email válido"),
  company: z.string().min(1, "Nome da empresa é obrigatório").max(100, "Nome da empresa muito longo"),
  phone: z.string().min(9, "Número de telefone inválido").max(20, "Número muito longo"),
  preferredDate: z.string().min(1, "Por favor, selecione uma data"),
  preferredTime: z.string().min(1, "Por favor, selecione um horário"),
  message: z.string().max(500, "Mensagem muito longa").optional(),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

interface DemoFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoForm({ isOpen, onClose }: DemoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      preferredDate: "",
      preferredTime: "",
      message: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: DemoFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/demo-requests', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to submit demo request');
      }

      setIsSuccess(true);
      
      toast({
        title: "Demo agendada com sucesso!",
        description: "Nossa equipe entrará em contacto dentro de 24 horas para confirmar os detalhes.",
      });

      // Auto close after success
      setTimeout(() => {
        form.reset();
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting demo request:', error);
      toast({
        title: "Erro ao agendar demo",
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
              Demo Agendada com Sucesso!
            </h3>
            <p className="text-gray-600 mb-4">
              Obrigado pelo seu interesse no TatuTicket. Nossa equipe entrará em contacto 
              dentro de 24 horas para confirmar os detalhes da demonstração.
            </p>
            <div className="text-sm text-gray-500">
              Esta janela fechará automaticamente...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}>
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                Agendar Demonstração
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Descubra como o TatuTicket pode revolucionar o suporte da sua empresa
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              disabled={isSubmitting}
              data-testid="button-close-demo-form"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informações de Contacto
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 text-gray-500" />
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
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 text-gray-500" />
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
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Field */}
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building className="h-4 w-4 text-gray-500" />
                  Empresa *
                </Label>
                <Input
                  id="company"
                  placeholder="Nome da sua empresa"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.company ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("company")}
                  data-testid="input-company"
                />
                {form.formState.errors.company && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.company.message}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 text-gray-500" />
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
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scheduling Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Agendamento
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Data preferida *
                </Label>
                <Input
                  id="preferredDate"
                  type="date"
                  className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.preferredDate ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  {...form.register("preferredDate")}
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  data-testid="input-preferred-date"
                />
                {form.formState.errors.preferredDate && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.preferredDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTime" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Horário preferido *
                </Label>
                <Select
                  value={form.watch("preferredTime")}
                  onValueChange={(value) => form.setValue("preferredTime", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.preferredTime ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">09:00 - Manhã</SelectItem>
                    <SelectItem value="10:00">10:00 - Manhã</SelectItem>
                    <SelectItem value="11:00">11:00 - Manhã</SelectItem>
                    <SelectItem value="14:00">14:00 - Tarde</SelectItem>
                    <SelectItem value="15:00">15:00 - Tarde</SelectItem>
                    <SelectItem value="16:00">16:00 - Tarde</SelectItem>
                    <SelectItem value="17:00">17:00 - Tarde</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.preferredTime && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {form.formState.errors.preferredTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Informações Adicionais
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                Mensagem (opcional)
              </Label>
              <Textarea
                id="message"
                placeholder="Conte-nos sobre os principais desafios da sua empresa em gestão de tickets, número de agentes, volume de tickets ou qualquer requisito específico..."
                rows={4}
                className={`resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${form.formState.errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                {...form.register("message")}
                data-testid="textarea-message"
              />
              {form.formState.errors.message && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {form.formState.errors.message.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Máximo de 500 caracteres ({form.watch("message")?.length || 0}/500)
              </p>
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
              data-testid="button-cancel-demo"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200"
              data-testid="button-submit-demo"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Demonstração
                </>
              )}
            </Button>
          </div>
          
          {/* Disclaimer */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Ao agendar esta demonstração, você concorda em ser contactado pela nossa equipe comercial. 
            <br />Respeitamos a sua privacidade e nunca partilharemos os seus dados.
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}