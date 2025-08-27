import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'tickets' | 'agents' | 'customers' | 'sla' | 'financial';
  format: 'pdf' | 'excel' | 'csv';
  fields: string[];
  filters: any;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  createdAt: Date;
  lastGenerated?: Date;
}

interface ReportExport {
  id: string;
  templateId: string;
  templateName: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  generatedAt: Date;
  requestedBy: string;
  recordCount?: number;
}

const reportTypes = [
  { id: 'tickets', label: 'Relatório de Tickets', icon: 'fas fa-ticket-alt', description: 'Análise detalhada de tickets por período, status, categoria' },
  { id: 'agents', label: 'Performance de Agentes', icon: 'fas fa-users', description: 'Métricas de produtividade e qualidade dos agentes' },
  { id: 'customers', label: 'Análise de Clientes', icon: 'fas fa-building', description: 'Satisfação, SLA e utilização por cliente' },
  { id: 'sla', label: 'Compliance de SLA', icon: 'fas fa-clock', description: 'Cumprimento de SLAs e tempos de resposta' },
  { id: 'financial', label: 'Relatório Financeiro', icon: 'fas fa-chart-line', description: 'Análise de custos, faturamento e ROI' }
];

const availableFields = {
  tickets: [
    'id', 'subject', 'status', 'priority', 'category', 'customer', 'assignedAgent', 
    'createdAt', 'resolvedAt', 'responseTime', 'resolutionTime', 'satisfaction'
  ],
  agents: [
    'name', 'department', 'ticketsResolved', 'avgResponseTime', 'avgResolutionTime', 
    'customerSatisfaction', 'activeHours', 'productivity'
  ],
  customers: [
    'name', 'ticketsCount', 'avgSatisfaction', 'slaCompliance', 'totalSpent', 
    'hoursUsed', 'lastInteraction'
  ],
  sla: [
    'slaName', 'customer', 'tickets', 'breaches', 'complianceRate', 
    'avgResponseTime', 'avgResolutionTime'
  ],
  financial: [
    'customer', 'plan', 'monthlyRevenue', 'ticketCost', 'profitMargin', 
    'hoursConsumed', 'additionalCharges'
  ]
};

export function ReportsExport() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [exports, setExports] = useState<ReportExport[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'tickets' as const,
    format: 'pdf' as const,
    fields: [] as string[],
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date()
    },
    filters: {
      status: [],
      priority: [],
      category: [],
      department: [],
      agent: []
    },
    schedule: null as any
  });

  const [exportParams, setExportParams] = useState<{
    templateId: string;
    format: 'pdf' | 'excel' | 'csv';
    dateRange: { start: Date; end: Date };
    customFilters: any;
  }>({
    templateId: '',
    format: 'pdf',
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date()
    },
    customFilters: {}
  });

  React.useEffect(() => {
    loadTemplates();
    loadExports();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiRequest('GET', '/api/reports/templates');
      const templatesData = await response.json();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Mock data for demo
      setTemplates([
        {
          id: '1',
          name: 'Relatório Mensal de Tickets',
          description: 'Análise completa de tickets resolvidos no mês',
          type: 'tickets',
          format: 'pdf',
          fields: ['id', 'subject', 'status', 'priority', 'customer', 'assignedAgent', 'createdAt', 'resolvedAt'],
          filters: { status: ['resolved', 'closed'] },
          schedule: {
            frequency: 'monthly',
            time: '09:00',
            recipients: ['manager@company.com']
          },
          createdAt: new Date('2025-01-15'),
          lastGenerated: new Date('2025-01-26')
        },
        {
          id: '2',
          name: 'Performance Semanal de Agentes',
          description: 'Métricas de produtividade da equipe',
          type: 'agents',
          format: 'excel',
          fields: ['name', 'department', 'ticketsResolved', 'avgResponseTime', 'customerSatisfaction'],
          filters: {},
          schedule: {
            frequency: 'weekly',
            time: '08:00',
            recipients: ['hr@company.com', 'manager@company.com']
          },
          createdAt: new Date('2025-01-10'),
          lastGenerated: new Date('2025-01-22')
        }
      ]);
    }
  };

  const loadExports = async () => {
    try {
      const response = await apiRequest('GET', '/api/reports/exports?limit=20');
      const exportsData = await response.json();
      setExports(exportsData);
    } catch (error) {
      console.error('Error loading exports:', error);
      // Mock data for demo
      setExports([
        {
          id: '1',
          templateId: '1',
          templateName: 'Relatório Mensal de Tickets',
          format: 'pdf',
          status: 'completed',
          downloadUrl: '/api/reports/downloads/report_2025_01.pdf',
          generatedAt: new Date('2025-01-26T09:30:00'),
          requestedBy: 'João Silva',
          recordCount: 1247
        },
        {
          id: '2',
          templateId: '2',
          templateName: 'Performance Semanal de Agentes',
          format: 'excel',
          status: 'completed',
          downloadUrl: '/api/reports/downloads/agents_week_3.xlsx',
          generatedAt: new Date('2025-01-22T08:15:00'),
          requestedBy: 'Maria Santos',
          recordCount: 15
        },
        {
          id: '3',
          templateId: '1',
          templateName: 'Relatório Mensal de Tickets',
          format: 'pdf',
          status: 'generating',
          generatedAt: new Date(),
          requestedBy: 'Carlos Lima'
        }
      ]);
    }
  };

  const createTemplate = async () => {
    try {
      const response = await apiRequest('POST', '/api/reports/templates', newTemplate);
      const template = await response.json();
      setTemplates(prev => [...prev, template]);
      setIsCreatingTemplate(false);
      resetNewTemplate();
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Erro ao criar template. Tente novamente.');
    }
  };

  const exportReport = async () => {
    setIsExporting(true);
    try {
      const response = await apiRequest('POST', '/api/reports/export', exportParams);
      const exportData = await response.json();
      
      if (exportData.downloadUrl) {
        // Direct download
        window.open(exportData.downloadUrl, '_blank');
      } else {
        // Async generation
        setExports(prev => [exportData, ...prev]);
        alert('Relatório está sendo gerado. Você será notificado quando estiver pronto.');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadReport = (downloadUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      type: 'tickets',
      format: 'pdf',
      fields: [],
      dateRange: {
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
      },
      filters: {
        status: [],
        priority: [],
        category: [],
        department: [],
        agent: []
      },
      schedule: null
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      generating: 'secondary',
      failed: 'destructive'
    };
    
    const icons = {
      completed: 'fas fa-check',
      generating: 'fas fa-spinner fa-spin',
      failed: 'fas fa-times'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        <i className={`${icons[status as keyof typeof icons]} mr-1`}></i>
        {status === 'completed' ? 'Concluído' : status === 'generating' ? 'Gerando...' : 'Falhou'}
      </Badge>
    );
  };

  const getFormatIcon = (format: string) => {
    const icons = {
      pdf: 'fas fa-file-pdf text-red-600',
      excel: 'fas fa-file-excel text-green-600',
      csv: 'fas fa-file-csv text-blue-600'
    };
    return icons[format as keyof typeof icons] || 'fas fa-file';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exportação de Relatórios</h2>
          <p className="text-gray-600">Crie e gerencie relatórios personalizados em PDF, Excel e CSV</p>
        </div>

        <div className="flex space-x-2">
          <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <i className="fas fa-plus mr-2"></i>
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Criar Template de Relatório</DialogTitle>
              </DialogHeader>
              {/* Template creation form would go here - truncated for space */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Template</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Relatório Mensal de Tickets"
                  />
                </div>
                <div>
                  <Label>Tipo de Relatório</Label>
                  <Select value={newTemplate.type} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <i className={`${type.icon} mr-2`}></i>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreatingTemplate(false)}>Cancelar</Button>
                <Button onClick={createTemplate}>Criar Template</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setIsExporting(true)}>
            <i className="fas fa-download mr-2"></i>
            Exportar Agora
          </Button>
        </div>
      </div>

      <Tabs defaultValue="quick-export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quick-export">Exportação Rápida</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((type) => (
              <Card key={type.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className={`${type.icon} text-primary text-xl`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{type.label}</h3>
                      <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setExportParams(prev => ({ ...prev, templateId: type.id, format: 'pdf' }));
                          exportReport();
                        }}>
                          <i className="fas fa-file-pdf mr-1 text-red-600"></i>
                          PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setExportParams(prev => ({ ...prev, templateId: type.id, format: 'excel' }));
                          exportReport();
                        }}>
                          <i className="fas fa-file-excel mr-1 text-green-600"></i>
                          Excel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{template.name}</h3>
                        <Badge variant="outline">
                          <i className={getFormatIcon(template.format)}></i>
                          <span className="ml-1 uppercase">{template.format}</span>
                        </Badge>
                        <Badge variant="secondary">
                          {reportTypes.find(t => t.id === template.type)?.label}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📊 {template.fields.length} campos</span>
                        {template.lastGenerated && (
                          <span>🕒 Último: {format(template.lastGenerated, 'dd/MM/yyyy', { locale: ptBR })}</span>
                        )}
                        {template.schedule && (
                          <span>⏰ {template.schedule.frequency}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setExportParams(prev => ({ ...prev, templateId: template.id, format: template.format }));
                        exportReport();
                      }}>
                        <i className="fas fa-play mr-1"></i>
                        Executar
                      </Button>
                      <Button variant="outline" size="sm">
                        <i className="fas fa-edit mr-1"></i>
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Exportações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exports.map((exportItem) => (
                  <div key={exportItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <i className={getFormatIcon(exportItem.format)}></i>
                      </div>
                      <div>
                        <h4 className="font-semibold">{exportItem.templateName}</h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span>Por {exportItem.requestedBy}</span>
                          <span>• {format(exportItem.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          {exportItem.recordCount && (
                            <span>• {exportItem.recordCount.toLocaleString()} registros</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(exportItem.status)}
                      {exportItem.status === 'completed' && exportItem.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(exportItem.downloadUrl!, `${exportItem.templateName}.${exportItem.format}`)}
                        >
                          <i className="fas fa-download mr-1"></i>
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}