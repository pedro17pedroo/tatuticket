import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User, Building, Phone, Mail, MessageSquare, X } from "lucide-react";

const demoFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  company: z.string().optional(),
  phone: z.string().optional(),
  preferredDate: z.string().min(1, "Por favor, selecione uma data"),
  preferredTime: z.string().min(1, "Por favor, selecione um horário"),
  message: z.string().optional(),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

interface DemoFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoForm({ isOpen, onClose }: DemoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      toast({
        title: "Demo agendada com sucesso!",
        description: "Nossa equipe entrará em contacto em breve para confirmar os detalhes.",
      });

      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting demo request:', error);
      toast({
        title: "Erro ao agendar demo",
        description: "Tente novamente ou contacte o nosso suporte.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Agendar Demo</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              data-testid="button-close-demo-form"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Preencha o formulário abaixo e nossa equipe entrará em contacto para agendar sua demonstração personalizada.
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome completo *
            </Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              {...form.register("name")}
              data-testid="input-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...form.register("email")}
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Company Field */}
          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Empresa
            </Label>
            <Input
              id="company"
              placeholder="Nome da sua empresa"
              {...form.register("company")}
              data-testid="input-company"
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
            <Input
              id="phone"
              placeholder="+244 xxx xxx xxx"
              {...form.register("phone")}
              data-testid="input-phone"
            />
          </div>

          {/* Preferred Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data preferida *
              </Label>
              <Input
                id="preferredDate"
                type="date"
                {...form.register("preferredDate")}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-preferred-date"
              />
              {form.formState.errors.preferredDate && (
                <p className="text-sm text-red-600">{form.formState.errors.preferredDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário preferido *
              </Label>
              <select
                id="preferredTime"
                {...form.register("preferredTime")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="select-preferred-time"
              >
                <option value="">Selecione o horário</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
              </select>
              {form.formState.errors.preferredTime && (
                <p className="text-sm text-red-600">{form.formState.errors.preferredTime.message}</p>
              )}
            </div>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagem adicional
            </Label>
            <Textarea
              id="message"
              placeholder="Conte-nos sobre suas necessidades específicas ou dúvidas..."
              rows={3}
              {...form.register("message")}
              data-testid="textarea-message"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-demo"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90"
              data-testid="button-submit-demo"
            >
              {isSubmitting ? "Enviando..." : "Agendar Demo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}