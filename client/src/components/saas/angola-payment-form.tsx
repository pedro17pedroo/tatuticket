import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CreditCard, Phone, Building, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AngolaPaymentFormProps {
  amount: number;
  invoiceId: string;
  onPaymentCreated?: (payment: any) => void;
}

interface PaymentInstructions {
  title: string;
  instructions: string[];
  paymentWindow: string;
  entity?: string;
  accountDetails?: any;
}

export function AngolaPaymentForm({ amount, invoiceId, onPaymentCreated }: AngolaPaymentFormProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [proofFile, setProofFile] = useState<File | null>(null);

  const paymentMethods = [
    {
      id: 'multicaixa_express',
      name: 'Multicaixa Express',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Pagamento via terminal Multicaixa',
      available: true
    },
    {
      id: 'unitel_money',
      name: 'Unitel Money',
      icon: <Phone className="w-5 h-5" />,
      description: 'Transferência via app Unitel Money',
      available: true
    },
    {
      id: 'bank_transfer',
      name: 'Transferência Bancária',
      icon: <Building className="w-5 h-5" />,
      description: 'Transferência direta para conta bancária',
      available: true
    },
    {
      id: 'referencia_pagamento',
      name: 'Pagamento por Referência',
      icon: <Receipt className="w-5 h-5" />,
      description: 'Pagamento via referência bancária',
      available: true
    }
  ];

  const fetchInstructions = async (method: string) => {
    try {
      const response = await fetch(`/api/angola-payments/instructions/${method}?amount=${amount}`);
      const result = await response.json();
      
      if (result.success) {
        setInstructions(result.data);
      }
    } catch (error) {
      console.error('Error fetching instructions:', error);
    }
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setFormData({});
    setProofFile(null);
    fetchInstructions(method);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Apenas PDF e imagens são permitidos',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB',
          variant: 'destructive'
        });
        return;
      }

      setProofFile(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const submitData = new FormData();
      
      const paymentData = {
        invoiceId,
        paymentMethod: selectedMethod,
        amount,
        ...formData
      };

      submitData.append('paymentData', JSON.stringify(paymentData));
      
      if (proofFile) {
        submitData.append('proofOfPayment', proofFile);
      }

      const response = await fetch('/api/angola-payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Pagamento criado com sucesso!',
          description: 'Aguarde a confirmação do pagamento'
        });
        onPaymentCreated?.(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erro ao processar pagamento',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMethodForm = () => {
    switch (selectedMethod) {
      case 'multicaixa_express':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Será gerada uma referência automaticamente. Use-a no terminal Multicaixa.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'unitel_money':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Número de telefone Unitel</Label>
              <Input
                id="phone"
                placeholder="9XX XXX XXX"
                value={formData.unitelPhoneNumber || ''}
                onChange={(e) => setFormData({...formData, unitelPhoneNumber: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="transactionId">ID da Transação (após transferir)</Label>
              <Input
                id="transactionId"
                placeholder="Ex: TXN123456789"
                value={formData.unitelTransactionId || ''}
                onChange={(e) => setFormData({...formData, unitelTransactionId: e.target.value})}
              />
            </div>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Faça a transferência para os dados bancários fornecidos e envie o comprovativo.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="proof">Comprovativo de Pagamento *</Label>
              <div className="mt-2">
                <Input
                  id="proof"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {proofFile && (
                <p className="text-sm text-green-600 mt-2">
                  Arquivo selecionado: {proofFile.name}
                </p>
              )}
            </div>
          </div>
        );

      case 'referencia_pagamento':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Será gerada uma referência automaticamente. Use-a no seu banco online.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pagamento - Angola</CardTitle>
          <CardDescription>
            Valor a pagar: <Badge variant="outline" className="ml-2">Kz {amount.toFixed(2)}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMethod} onValueChange={handleMethodSelect}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {paymentMethods.map((method) => (
                <TabsTrigger
                  key={method.id}
                  value={method.id}
                  disabled={!method.available}
                  className="flex flex-col gap-1 h-auto py-3"
                >
                  {method.icon}
                  <span className="text-xs">{method.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {paymentMethods.map((method) => (
              <TabsContent key={method.id} value={method.id} className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {method.icon}
                        {method.name}
                      </CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderMethodForm()}
                      
                      {selectedMethod && (
                        <Button
                          className="w-full mt-4"
                          onClick={handleSubmit}
                          disabled={isLoading || (selectedMethod === 'bank_transfer' && !proofFile)}
                        >
                          {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Instructions */}
                  {instructions && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Instruções de Pagamento</CardTitle>
                        <CardDescription>
                          Prazo: {instructions.paymentWindow}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2">
                          {instructions.instructions.map((instruction, index) => (
                            <li key={index} className="text-sm">
                              {instruction}
                            </li>
                          ))}
                        </ol>

                        {instructions.entity && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="font-semibold text-sm">Entidade: {instructions.entity}</p>
                          </div>
                        )}

                        {instructions.accountDetails && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                            <h4 className="font-semibold text-sm">Dados Bancários:</h4>
                            <p className="text-sm"><strong>Banco:</strong> {instructions.accountDetails.bankName}</p>
                            <p className="text-sm"><strong>IBAN:</strong> {instructions.accountDetails.iban}</p>
                            <p className="text-sm"><strong>Beneficiário:</strong> {instructions.accountDetails.accountHolder}</p>
                            <p className="text-sm"><strong>SWIFT:</strong> {instructions.accountDetails.swiftCode}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}