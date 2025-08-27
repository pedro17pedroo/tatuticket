import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
  CheckCircle,
  XCircle,
  CalendarDays,
  DollarSign,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SLAUsage {
  planLimit: number;
  currentUsage: number;
  exceeded: number;
  excessCost: number;
  costPerHour: number;
  billingPeriod: {
    start: Date;
    end: Date;
  };
}

interface ExcessBill {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  excessHours: number;
  totalCost: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  createdAt: Date;
  invoiceUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'boleto' | 'pix';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

const MOCK_SLA_USAGE: SLAUsage = {
  planLimit: 160, // 160 horas SLA por mês
  currentUsage: 187, // 187 horas usadas
  exceeded: 27, // 27 horas excedidas
  excessCost: 675, // R$ 675 em excedentes
  costPerHour: 25, // R$ 25 por hora excedida
  billingPeriod: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31')
  }
};

const MOCK_EXCESS_BILLS: ExcessBill[] = [
  {
    id: 'bill_001',
    period: { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
    excessHours: 27,
    totalCost: 675,
    status: 'pending',
    dueDate: new Date('2025-02-15'),
    createdAt: new Date('2025-02-01'),
    invoiceUrl: '/invoices/excess_bill_001.pdf'
  },
  {
    id: 'bill_002',
    period: { start: new Date('2024-12-01'), end: new Date('2024-12-31') },
    excessHours: 15,
    totalCost: 375,
    status: 'paid',
    dueDate: new Date('2025-01-15'),
    createdAt: new Date('2025-01-01'),
    invoiceUrl: '/invoices/excess_bill_002.pdf'
  },
  {
    id: 'bill_003',
    period: { start: new Date('2024-11-01'), end: new Date('2024-11-30') },
    excessHours: 8,
    totalCost: 200,
    status: 'paid',
    dueDate: new Date('2024-12-15'),
    createdAt: new Date('2024-12-01'),
    invoiceUrl: '/invoices/excess_bill_003.pdf'
  }
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'card',
    last4: '4532',
    brand: 'visa',
    isDefault: true
  },
  {
    id: 'pm_002',
    type: 'boleto',
    isDefault: false
  }
];

export function SLAExceededBilling() {
  const [selectedBill, setSelectedBill] = useState<ExcessBill | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slaUsage = MOCK_SLA_USAGE } = useQuery({
    queryKey: ['/api/billing/sla-usage'],
    enabled: true,
  }) as { data: SLAUsage };

  const { data: excessBills = MOCK_EXCESS_BILLS } = useQuery({
    queryKey: ['/api/billing/excess-bills'],
    enabled: true,
  }) as { data: ExcessBill[] };

  const { data: paymentMethods = MOCK_PAYMENT_METHODS } = useQuery({
    queryKey: ['/api/billing/payment-methods'],
    enabled: true,
  }) as { data: PaymentMethod[] };

  const payExcessBillMutation = useMutation({
    mutationFn: async ({ billId, paymentMethodId }: { billId: string; paymentMethodId: string }) => {
      // Mock payment processing
      return Promise.resolve({ success: true, transactionId: `txn_${Date.now()}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/excess-bills'] });
      toast({ title: 'Pagamento processado com sucesso!' });
      setShowPaymentDialog(false);
      setSelectedBill(null);
    },
    onError: () => {
      toast({ 
        title: 'Erro no pagamento',
        description: 'Tente novamente ou use outro método de pagamento',
        variant: 'destructive' 
      });
    }
  });

  const usagePercentage = (slaUsage.currentUsage / slaUsage.planLimit) * 100;
  const exceededPercentage = usagePercentage > 100 ? usagePercentage - 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getStatusBadge = (status: ExcessBill['status']) => {
    const variants = {
      pending: { variant: 'destructive' as const, icon: Clock, label: 'Pendente' },
      paid: { variant: 'default' as const, icon: CheckCircle, label: 'Pago' },
      overdue: { variant: 'destructive' as const, icon: XCircle, label: 'Vencido' }
    };
    
    const config = variants[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handlePayBill = (bill: ExcessBill) => {
    setSelectedBill(bill);
    setShowPaymentDialog(true);
  };

  const processBillPayment = () => {
    if (!selectedBill || !selectedPaymentMethod) return;
    
    payExcessBillMutation.mutate({
      billId: selectedBill.id,
      paymentMethodId: selectedPaymentMethod
    });
  };

  return (
    <div className="space-y-6" data-testid="sla-exceeded-billing">
      {/* Visão Geral do Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Uso de SLA - Período Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{slaUsage.planLimit}h</div>
              <div className="text-sm text-gray-600">Limite do Plano</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{slaUsage.currentUsage}h</div>
              <div className="text-sm text-gray-600">Horas Utilizadas</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{slaUsage.exceeded}h</div>
              <div className="text-sm text-gray-600">Horas Excedidas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(slaUsage.excessCost)}
              </div>
              <div className="text-sm text-gray-600">Custo Excedente</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do uso</span>
              <span>{Math.round(usagePercentage)}%</span>
            </div>
            <Progress value={Math.min(usagePercentage, 100)} className="h-3" />
            {exceededPercentage > 0 && (
              <>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Excedente</span>
                  <span>+{Math.round(exceededPercentage)}%</span>
                </div>
                <Progress value={exceededPercentage} className="h-2 bg-red-100" />
              </>
            )}
          </div>

          {slaUsage.exceeded > 0 && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Você excedeu seu limite de SLA em {slaUsage.exceeded} horas. 
                Custo adicional: {formatCurrency(slaUsage.excessCost)} 
                (R$ {slaUsage.costPerHour}/hora).
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500 text-center">
            Período: {formatDate(slaUsage.billingPeriod.start)} - {formatDate(slaUsage.billingPeriod.end)}
          </div>
        </CardContent>
      </Card>

      {/* Faturas de Excedente */}
      <Tabs defaultValue="bills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bills" data-testid="tab-bills">
            Faturas de Excedente
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            Histórico de Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bills" className="space-y-4">
          <div className="grid gap-4">
            {excessBills.filter(bill => bill.status === 'pending').map((bill) => (
              <Card key={bill.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Fatura #{bill.id.toUpperCase()}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Período: {formatDate(bill.period.start)} - {formatDate(bill.period.end)}
                      </p>
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">{bill.excessHours}h</div>
                      <div className="text-xs text-gray-600">Horas Excedidas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(bill.totalCost)}
                      </div>
                      <div className="text-xs text-gray-600">Valor Total</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-orange-600">
                        {formatDate(bill.dueDate)}
                      </div>
                      <div className="text-xs text-gray-600">Vencimento</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handlePayBill(bill)}
                      className="flex-1"
                      data-testid={`button-pay-bill-${bill.id}`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar Agora
                    </Button>
                    {bill.invoiceUrl && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(bill.invoiceUrl, '_blank')}
                        data-testid={`button-download-invoice-${bill.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {excessBills.filter(bill => bill.status === 'pending').length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma fatura pendente</h3>
                  <p className="text-gray-600">Todas as suas faturas de excedente estão em dia!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {excessBills.filter(bill => bill.status === 'paid').map((bill) => (
              <Card key={bill.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Receipt className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">#{bill.id.toUpperCase()}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(bill.period.start)} - {formatDate(bill.period.end)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(bill.totalCost)}</div>
                      <div className="text-sm text-gray-600">{bill.excessHours}h excedidas</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(bill.status)}
                      {bill.invoiceUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(bill.invoiceUrl, '_blank')}
                          data-testid={`button-download-paid-invoice-${bill.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Pagamento */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md" data-testid="payment-dialog">
          <DialogHeader>
            <DialogTitle>Pagar Fatura de Excedente</DialogTitle>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Fatura #{selectedBill.id.toUpperCase()}</div>
                <div className="text-2xl font-bold">{formatCurrency(selectedBill.totalCost)}</div>
                <div className="text-sm text-gray-600">{selectedBill.excessHours}h excedidas</div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Método de Pagamento</div>
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    data-testid={`payment-method-${method.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {method.type === 'card' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : method.type === 'boleto' ? (
                          <Receipt className="w-5 h-5" />
                        ) : (
                          <Zap className="w-5 h-5" />
                        )}
                        <div>
                          <div className="font-medium">
                            {method.type === 'card' && `**** ${method.last4}`}
                            {method.type === 'boleto' && 'Boleto Bancário'}
                            {method.type === 'pix' && 'PIX'}
                          </div>
                          {method.brand && (
                            <div className="text-sm text-gray-600 capitalize">{method.brand}</div>
                          )}
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={processBillPayment}
                  disabled={!selectedPaymentMethod || payExcessBillMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-payment"
                >
                  {payExcessBillMutation.isPending ? 'Processando...' : 'Pagar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}