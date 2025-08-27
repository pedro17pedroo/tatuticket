import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Clock, AlertTriangle, CheckCircle, Download, Receipt, Calendar, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SLAUsage {
  id: string;
  month: string;
  plannedHours: number;
  usedHours: number;
  excessHours: number;
  status: 'within_limit' | 'exceeded' | 'warning';
  costPerExcessHour: number;
  totalExcessCost: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  paymentMethod?: string;
  paidAt?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export function ExcessBillingSystem() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();

  // Mock data - In real app, this would come from API
  const slaUsageData: SLAUsage[] = [
    {
      id: '1',
      month: '2025-01',
      plannedHours: 40,
      usedHours: 52,
      excessHours: 12,
      status: 'exceeded',
      costPerExcessHour: 15,
      totalExcessCost: 180
    },
    {
      id: '2',
      month: '2024-12',
      plannedHours: 40,
      usedHours: 38,
      excessHours: 0,
      status: 'within_limit',
      costPerExcessHour: 15,
      totalExcessCost: 0
    },
    {
      id: '3',
      month: '2024-11',
      plannedHours: 40,
      usedHours: 45,
      excessHours: 5,
      status: 'exceeded',
      costPerExcessHour: 15,
      totalExcessCost: 75
    }
  ];

  const invoicesData: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2025-001',
      date: '2025-01-27',
      dueDate: '2025-02-10',
      amount: 180,
      status: 'pending',
      description: 'Excesso SLA - Janeiro 2025 (12 horas)'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-045',
      date: '2024-11-30',
      dueDate: '2024-12-15',
      amount: 75,
      status: 'paid',
      description: 'Excesso SLA - Novembro 2024 (5 horas)',
      paymentMethod: 'Cartão ****4242',
      paidAt: '2024-12-05'
    }
  ];

  const paymentMethodsData: PaymentMethod[] = [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      isDefault: true
    }
  ];

  const { data: slaUsage = slaUsageData } = useQuery<SLAUsage[]>({
    queryKey: ['/api/billing/sla-usage', selectedPeriod],
    enabled: true
  });

  const { data: invoices = invoicesData } = useQuery<Invoice[]>({
    queryKey: ['/api/billing/invoices'],
    enabled: true
  });

  const { data: paymentMethods = paymentMethodsData } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/billing/payment-methods'],
    enabled: true
  });

  const payInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      // In real app, this would call Stripe API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/invoices'] });
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      toast({
        title: "Pagamento Processado",
        description: "Sua fatura foi paga com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro no Pagamento",
        description: "Não foi possível processar o pagamento",
        variant: "destructive",
      });
    }
  });

  const currentMonth = slaUsage.find(usage => usage.month === '2025-01');
  const totalExcessCost = slaUsage.reduce((sum, usage) => sum + usage.totalExcessCost, 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'within_limit': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'exceeded': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'within_limit': return 'Dentro do Limite';
      case 'warning': return 'Atenção';
      case 'exceeded': return 'Excedido';
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  return (
    <div className="space-y-6" data-testid="excess-billing-system">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Excesso SLA</h1>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod} data-testid="select-period">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês Atual</SelectItem>
            <SelectItem value="last_3">Últimos 3 Meses</SelectItem>
            <SelectItem value="last_6">Últimos 6 Meses</SelectItem>
            <SelectItem value="year">Ano Completo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-current-usage">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Uso Atual</p>
                <p className="text-xl font-bold">
                  {currentMonth?.usedHours || 0}h / {currentMonth?.plannedHours || 0}h
                </p>
              </div>
            </div>
            <Progress 
              value={currentMonth ? (currentMonth.usedHours / currentMonth.plannedHours) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card data-testid="card-excess-hours">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Excesso do Mês</p>
                <p className="text-xl font-bold text-red-600">
                  {currentMonth?.excessHours || 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-amount">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Pendente</p>
                <p className="text-xl font-bold">
                  R$ {pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-cost">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Período</p>
                <p className="text-xl font-bold">R$ {totalExcessCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {currentMonth?.status === 'exceeded' && (
        <Alert className="border-red-200 bg-red-50" data-testid="alert-excess">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Você excedeu seu limite de SLA em {currentMonth.excessHours} horas neste mês. 
            Um valor adicional de R$ {currentMonth.totalExcessCost.toFixed(2)} será cobrado.
          </AlertDescription>
        </Alert>
      )}

      {pendingInvoices.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50" data-testid="alert-pending">
          <Receipt className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Você tem {pendingInvoices.length} fatura(s) pendente(s) no valor total de R$ {pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}.
          </AlertDescription>
        </Alert>
      )}

      {/* Histórico de Uso SLA */}
      <Card data-testid="card-sla-history">
        <CardHeader>
          <CardTitle>Histórico de Uso SLA</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Horas Planejadas</TableHead>
                <TableHead>Horas Utilizadas</TableHead>
                <TableHead>Excesso</TableHead>
                <TableHead>Custo Adicional</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaUsage.map((usage) => (
                <TableRow key={usage.id} data-testid={`row-usage-${usage.id}`}>
                  <TableCell>
                    {new Date(usage.month + '-01').toLocaleDateString('pt-BR', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell>{usage.plannedHours}h</TableCell>
                  <TableCell>{usage.usedHours}h</TableCell>
                  <TableCell className={usage.excessHours > 0 ? 'text-red-600 font-medium' : ''}>
                    {usage.excessHours}h
                  </TableCell>
                  <TableCell className={usage.totalExcessCost > 0 ? 'text-red-600 font-medium' : ''}>
                    R$ {usage.totalExcessCost.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(usage.status)}>
                      {getStatusText(usage.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Faturas */}
      <Card data-testid="card-invoices">
        <CardHeader>
          <CardTitle>Faturas de Excesso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                  <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell className="font-medium">R$ {invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusText(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-download-${invoice.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {invoice.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentDialog(true);
                          }}
                          data-testid={`button-pay-${invoice.id}`}
                        >
                          Pagar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent data-testid="dialog-payment">
          <DialogHeader>
            <DialogTitle>Processar Pagamento</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Detalhes da Fatura</h3>
                <p><strong>Número:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>Descrição:</strong> {selectedInvoice.description}</p>
                <p><strong>Valor:</strong> R$ {selectedInvoice.amount.toFixed(2)}</p>
                <p><strong>Vencimento:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Método de Pagamento</h3>
                {paymentMethods.map(method => (
                  <div key={method.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{method.brand} ****{method.last4}</p>
                      {method.isDefault && (
                        <Badge variant="outline" className="text-xs">Padrão</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                  data-testid="button-cancel-payment"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => payInvoiceMutation.mutate(selectedInvoice.id)}
                  disabled={payInvoiceMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-payment"
                >
                  {payInvoiceMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}