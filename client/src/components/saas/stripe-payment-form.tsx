import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { PricingPlan } from '@/types/portal';

interface StripePaymentFormProps {
  selectedPlan: PricingPlan;
  onSuccess: (subscriptionId: string) => void;
  onCancel: () => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
  },
};

export function StripePaymentForm({ selectedPlan, onSuccess, onCancel }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'boleto' | 'pix'>('card');
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    taxId: '', // CNPJ
    address: {
      street: '',
      number: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Erro",
        description: "Sistema de pagamento não carregado. Tente novamente.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'card') {
        await handleCardPayment();
      } else if (paymentMethod === 'boleto') {
        await handleBoletoPayment();
      } else if (paymentMethod === 'pix') {
        await handlePixPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erro no Pagamento",
        description: "Houve um erro ao processar seu pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    const cardElement = elements!.getElement(CardElement);
    if (!cardElement) return;

    // Create payment method
    const { error, paymentMethod } = await stripe!.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        address: {
          line1: `${formData.address.street}, ${formData.address.number}`,
          city: formData.address.city,
          state: formData.address.state,
          postal_code: formData.address.zipCode,
          country: 'BR'
        }
      },
    });

    if (error) {
      toast({
        title: "Erro no Cartão",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Create subscription
    const apiResponse = await apiRequest('POST', '/api/payments/create-subscription', {
      email: formData.email,
      planId: selectedPlan.id,
      companyName: formData.companyName,
      paymentMethodId: paymentMethod.id,
      billingInfo: formData
    });
    const response = await apiResponse.json();

    if (response.requiresAction) {
      // Handle 3D Secure
      const { error: confirmError } = await stripe!.confirmCardPayment(
        response.clientSecret
      );

      if (confirmError) {
        toast({
          title: "Falha na Autenticação",
          description: confirmError.message,
          variant: "destructive"
        });
        return;
      }
    }

    toast({
      title: "Pagamento Confirmado!",
      description: "Sua assinatura foi ativada com sucesso."
    });

    onSuccess(response.subscriptionId);
  };

  const handleBoletoPayment = async () => {
    const apiResponse = await apiRequest('POST', '/api/payments/create-boleto', {
      email: formData.email,
      planId: selectedPlan.id,
      companyName: formData.companyName,
      billingInfo: formData
    });
    const response = await apiResponse.json();

    if (response.boletoUrl) {
      // Open boleto in new window
      window.open(response.boletoUrl, '_blank');
      
      toast({
        title: "Boleto Gerado",
        description: "O boleto foi gerado. Sua assinatura será ativada após o pagamento."
      });
      
      // For demo purposes, we'll simulate success
      setTimeout(() => {
        onSuccess(response.subscriptionId);
      }, 2000);
    }
  };

  const handlePixPayment = async () => {
    const apiResponse = await apiRequest('POST', '/api/payments/create-pix', {
      email: formData.email,
      planId: selectedPlan.id,
      companyName: formData.companyName,
      billingInfo: formData
    });
    const response = await apiResponse.json();

    if (response.pixQrCode) {
      // Show PIX QR code in modal/alert
      toast({
        title: "PIX Gerado",
        description: "Use o código PIX para finalizar o pagamento."
      });
      
      // For demo purposes, we'll simulate success
      setTimeout(() => {
        onSuccess(response.subscriptionId);
      }, 3000);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Finalizar Assinatura</span>
          <span className="text-lg text-primary font-bold">{selectedPlan.price}/mês</span>
        </CardTitle>
        <p className="text-sm text-gray-600">Plano: {selectedPlan.name}</p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados da Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  required
                  data-testid="input-company-name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Corporativo *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  data-testid="input-phone"
                />
              </div>
              
              <div>
                <Label htmlFor="taxId">CNPJ</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  placeholder="00.000.000/0001-00"
                  data-testid="input-tax-id"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Forma de Pagamento</h3>
            
            <Select value={paymentMethod} onValueChange={(value: 'card' | 'boleto' | 'pix') => setPaymentMethod(value)}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Escolha a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Cartão de Crédito</SelectItem>
                <SelectItem value="boleto">Boleto Bancário</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Payment Form */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <Label>Dados do Cartão</Label>
              <div className="p-3 border rounded-md">
                <CardElement options={cardElementOptions} />
              </div>
            </div>
          )}

          {/* Boleto Information */}
          {paymentMethod === 'boleto' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Pagamento via Boleto</h4>
              <p className="text-sm text-blue-800">
                O boleto será gerado e você receberá por email. 
                Sua assinatura será ativada em até 2 dias úteis após a confirmação do pagamento.
              </p>
            </div>
          )}

          {/* PIX Information */}
          {paymentMethod === 'pix' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Pagamento via PIX</h4>
              <p className="text-sm text-green-800">
                Você receberá um código PIX para pagamento instantâneo.
                Sua assinatura será ativada imediatamente após a confirmação.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
              data-testid="button-cancel-payment"
            >
              Cancelar
            </Button>
            
            <Button 
              type="submit" 
              disabled={!stripe || loading}
              className="flex-1"
              data-testid="button-confirm-payment"
            >
              {loading ? 'Processando...' : `Confirmar Pagamento ${selectedPlan.price}/mês`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}