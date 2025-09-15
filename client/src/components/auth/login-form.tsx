import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authService, type LoginData } from "@/lib/auth";

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginForm({ isOpen, onClose, onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login(formData);
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o portal apropriado...",
      });
      onSuccess();
    } catch (error: any) {
      // Extract user-friendly error message
      let errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      
      if (error.message) {
        if (error.message.includes("Invalid credentials")) {
          errorMessage = "Email ou senha incorretos. Tente novamente.";
        } else if (error.message.includes("Account is disabled")) {
          errorMessage = "Sua conta está desativada. Entre em contato com o suporte.";
        } else if (error.message.includes("required")) {
          errorMessage = "Por favor, preencha todos os campos obrigatórios.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        }
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Login - TatuTicket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              data-testid="input-login-email"
            />
          </div>
          <div>
            <Label htmlFor="login-password">Senha</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              data-testid="input-login-password"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            data-testid="button-submit-login"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          
          <div className="text-center mt-4">
            <Button 
              type="button"
              variant="link" 
              className="text-sm"
              onClick={onClose}
              data-testid="button-cancel-login"
            >
              Cancelar
            </Button>
          </div>
        </form>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Contas de Demonstração:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div><strong>Super Admin:</strong> admin@tatuticket.com / admin123</div>
            <div><strong>Empresa:</strong> empresa@test.com / empresa123</div>
            <div><strong>Cliente:</strong> cliente@test.com / cliente123</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
