import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, Download, CreditCard, CheckCircle, Clock, 
  AlertTriangle, Calendar, DollarSign, Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description: string;
  items: InvoiceItem[];
  downloadUrl?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'plan' | 'overage' | 'addon';
}

export function InvoiceManagement() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch invoices from API
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/customer/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/customer/invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const result = await response.json();
      return result.data || mockInvoices;
    }
  });

  // Mock data for demonstration
  const mockInvoices: Invoice[] = [
    {
      id: 'inv_001',
      number: 'INV-2025-001',
      date: '2025-01-15',
      dueDate: '2025-02-14',
      amount: 299.99,
      currency: 'BRL',
      status: 'paid',
      description: 'Plano Professional - Janeiro 2025',
      items: [
        {
          id: 'item_1',
          description: 'Plano Professional (mensal)',
          quantity: 1,
          unitPrice: 299.99,
          total: 299.99,
          type: 'plan'
        }
      ]
    },
    {
      id: 'inv_002',
      number: 'INV-2025-002',
      date: '2025-01-20',
      dueDate: '2025-02-19',
      amount: 45.50,
      currency: 'BRL',
      status: 'pending',
      description: 'Horas SLA excedentes - Janeiro 2025',
      items: [
        {
          id: 'item_2',
          description: 'Horas SLA excedentes',
          quantity: 7,
          unitPrice: 6.50,
          total: 45.50,
          type: 'overage'
        }
      ]
    },
    {
      id: 'inv_003',
      number: 'INV-2024-012',
      date: '2024-12-15',
      dueDate: '2025-01-14',
      amount: 299.99,
      currency: 'BRL',
      status: 'overdue',
      description: 'Plano Professional - Dezembro 2024',
      items: [
        {
          id: 'item_3',
          description: 'Plano Professional (mensal)',
          quantity: 1,
          unitPrice: 299.99,
          total: 299.99,
          type: 'plan'
        }
      ]
    }
  ];

  const filteredInvoices = (invoices || mockInvoices).filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/customer/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to process payment');

      toast({
        title: "Pagamento processado",
        description: "Sua fatura foi paga com sucesso.",
      });

      // Refresh invoices
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Mock download - in real implementation, this would download a PDF
    toast({
      title: "Download iniciado",
      description: `Baixando fatura ${invoice.number}...`,
    });
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidAmount = filteredInvoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Faturas e Pagamentos</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Histórico Completo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length} faturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valores Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ {unpaidAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(inv => inv.status !== 'paid').length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 Fev</div>
            <p className="text-xs text-muted-foreground">
              R$ 299.99
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por número ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="overdue">Em Atraso</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Faturas</CardTitle>
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
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell className="font-medium">
                    R$ {invoice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status === 'paid' ? 'Paga' : 
                       invoice.status === 'pending' ? 'Pendente' : 
                       invoice.status === 'overdue' ? 'Em Atraso' : 'Cancelada'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                      {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                        <Button
                          size="sm"
                          onClick={() => handlePayInvoice(invoice.id)}
                          className="flex items-center gap-1"
                        >
                          <CreditCard className="h-3 w-3" />
                          Pagar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}