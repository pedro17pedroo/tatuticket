import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface OTPVerificationProps {
  email: string;
  phone?: string;
  onVerified: (token: string) => void;
  onResend?: () => void;
}

export function OTPVerification({ email, phone, onVerified, onResend }: OTPVerificationProps) {
  const [otpCode, setOtpCode] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>(phone ? 'sms' : 'email');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Código Inválido",
        description: "Digite o código de 6 dígitos que você recebeu.",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Simulate OTP verification
      if (otpCode === '123456') {
        // Mock successful verification
        const mockToken = `otp_verified_${Date.now()}`;
        onVerified(mockToken);
        
        toast({
          title: "Código Verificado!",
          description: "Sua conta foi verificada com sucesso."
        });
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      toast({
        title: "Código Incorreto",
        description: "O código digitado está incorreto ou expirou. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      // Simulate resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Código Reenviado",
        description: `Um novo código foi enviado para ${method === 'email' ? email : phone}.`
      });

      // Start countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      onResend?.();
    } catch (error) {
      toast({
        title: "Erro no Envio",
        description: "Não foi possível reenviar o código. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleMethodChange = async (newMethod: 'email' | 'sms') => {
    if (newMethod === 'sms' && !phone) {
      toast({
        title: "Telefone Necessário",
        description: "Você precisa fornecer um número de telefone para receber SMS.",
        variant: "destructive"
      });
      return;
    }

    setMethod(newMethod);
    
    // Auto resend with new method
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Método Alterado",
        description: `Um código foi enviado via ${newMethod === 'email' ? 'email' : 'SMS'}.`
      });
    } catch (error) {
      console.error('Error changing method:', error);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className={`fas ${method === 'email' ? 'fa-envelope' : 'fa-sms'} text-2xl text-primary`}></i>
        </div>
        <CardTitle>Verificação de Código</CardTitle>
        <p className="text-sm text-gray-600">
          {method === 'email' 
            ? `Enviamos um código de 6 dígitos para ${email}`
            : `Enviamos um código de 6 dígitos via SMS para ${phone}`
          }
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seleção de Método (se telefone disponível) */}
        {phone && (
          <div>
            <Label>Método de Verificação</Label>
            <Select value={method} onValueChange={handleMethodChange}>
              <SelectTrigger data-testid="select-otp-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center">
                    <i className="fas fa-envelope mr-2"></i>
                    Email ({email})
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center">
                    <i className="fas fa-sms mr-2"></i>
                    SMS ({phone})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Campo do Código OTP */}
        <div>
          <Label>Código de Verificação</Label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="text-center text-2xl font-mono tracking-widest"
              data-testid="input-otp-code"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <i className="fas fa-shield-alt text-gray-400"></i>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Digite os 6 dígitos recebidos {method === 'email' ? 'por email' : 'por SMS'}
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <Button
            onClick={handleVerifyOTP}
            disabled={isVerifying || otpCode.length !== 6}
            className="w-full"
            data-testid="button-verify-otp"
          >
            {isVerifying ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Verificando...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>
                Verificar Código
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={countdown > 0}
              className="text-sm"
              data-testid="button-resend-otp"
            >
              {countdown > 0 ? (
                <>Reenviar em {countdown}s</>
              ) : (
                <>
                  <i className="fas fa-redo mr-2"></i>
                  Reenviar Código
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dica de Segurança */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <i className="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Dica de Segurança</p>
              <p className="text-yellow-700">
                Nunca compartilhe este código com ninguém. Nossa equipe nunca solicitará este código.
              </p>
            </div>
          </div>
        </div>

        {/* Para demonstração - mostrar código de teste */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-600 mr-2 mt-0.5"></i>
            <div className="text-sm">
              <p className="font-medium text-blue-800">Demonstração</p>
              <p className="text-blue-700">
                Para teste, use o código: <strong>123456</strong>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}