import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Mail, MessageSquare, Shield, RotateCcw, CheckCircle } from 'lucide-react';

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
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Auto-send OTP when component mounts
  useEffect(() => {
    handleSendInitialOTP();
  }, []);

  const handleSendInitialOTP = async () => {
    setIsSending(true);
    try {
      const response = await apiRequest('POST', '/api/auth/send-otp', {
        email,
        phone: method === 'sms' ? phone : undefined,
        type: 'email_verification',
        method: method
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Código Enviado",
          description: `Um código foi enviado ${method === 'email' ? 'por email' : 'via SMS'}.`
        });

        // In development, show the OTP code for testing
        if (result.code && process.env.NODE_ENV === 'development') {
          toast({
            title: "Código de Desenvolvimento",
            description: `Para teste: ${result.code}`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro no Envio",
        description: "Não foi possível enviar o código. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

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
      const response = await apiRequest('POST', '/api/auth/verify-otp', {
        email,
        phone: method === 'sms' ? phone : undefined,
        code: otpCode,
        type: 'email_verification'
      });

      if (response.ok) {
        const result = await response.json();
        onVerified(result.token || `otp_verified_${Date.now()}`);
        
        toast({
          title: "Código Verificado!",
          description: "Sua conta foi verificada com sucesso."
        });
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      // Fallback for development only - accepts 123456
      if (process.env.NODE_ENV === 'development' && otpCode === '123456') {
        const mockToken = `otp_verified_${Date.now()}`;
        onVerified(mockToken);
        
        toast({
          title: "Código Verificado! (Demo)",
          description: "Verificação realizada em modo demonstração."
        });
      } else {
        toast({
          title: "Código Incorreto",
          description: "O código digitado está incorreto ou expirou. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      const response = await apiRequest('POST', '/api/auth/send-otp', {
        email,
        phone: method === 'sms' ? phone : undefined,
        type: 'email_verification',
        method: method
      });

      if (response.ok) {
        toast({
          title: "Código Reenviado",
          description: `Um novo código foi enviado ${method === 'email' ? 'por email' : 'via SMS'}.`
        });
      } else {
        // Fallback for development only
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: "Código Reenviado (Demo)",
            description: `Código de demonstração: 123456`
          });
        } else {
          throw new Error('Failed to send OTP');
        }
      }

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
      const response = await apiRequest('POST', '/api/auth/send-otp', {
        email,
        phone: newMethod === 'sms' ? phone : undefined,
        type: 'email_verification',
        method: newMethod
      });

      if (response.ok) {
        toast({
          title: "Método Alterado",
          description: `Um código foi enviado via ${newMethod === 'email' ? 'email' : 'SMS'}.`
        });
      } else {
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: "Método Alterado (Demo)",
            description: `Use o código: 123456 para demonstração.`
          });
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível alterar o método de envio.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error changing method:', error);
      if (process.env.NODE_ENV === 'development') {
        toast({
          title: "Método Alterado (Demo)",
          description: `Use o código: 123456 para demonstração.`
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível alterar o método de envio.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {method === 'email' ? (
            <Mail className="w-8 h-8 text-primary" />
          ) : (
            <MessageSquare className="w-8 h-8 text-primary" />
          )}
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
                    <Mail className="w-4 h-4 mr-2" />
                    Email ({email})
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
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
              <Shield className="w-4 h-4 text-gray-400" />
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
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
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reenviar Código
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dica de Segurança */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <Shield className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Dica de Segurança</p>
              <p className="text-yellow-700">
                Nunca compartilhe este código com ninguém. Nossa equipe nunca solicitará este código.
              </p>
            </div>
          </div>
        </div>

        {/* Para demonstração - mostrar código de teste apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <Mail className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Demonstração</p>
                <p className="text-blue-700">
                  Para teste, use o código: <strong>123456</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}