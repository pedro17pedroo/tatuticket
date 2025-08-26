import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv';
  reportType: 'tickets' | 'analytics' | 'sla' | 'agents' | 'customers';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  filters: {
    status?: string[];
    priority?: string[];
    department?: string[];
    assignee?: string[];
  };
  fields: string[];
  includeCharts: boolean;
  emailDelivery?: {
    enabled: boolean;
    recipients: string[];
    schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
  };
}

const reportTypes = [
  { value: 'tickets', label: 'Relatório de Tickets', icon: 'fas fa-ticket-alt' },
  { value: 'analytics', label: 'Análise de Performance', icon: 'fas fa-chart-line' },
  { value: 'sla', label: 'Relatório de SLA', icon: 'fas fa-clock' },
  { value: 'agents', label: 'Performance dos Agentes', icon: 'fas fa-users' },
  { value: 'customers', label: 'Satisfação do Cliente', icon: 'fas fa-smile' }
];

const exportFormats = [
  { value: 'pdf', label: 'PDF', icon: 'fas fa-file-pdf', description: 'Relatório formatado para apresentação' },
  { value: 'excel', label: 'Excel', icon: 'fas fa-file-excel', description: 'Planilha para análise de dados' },
  { value: 'csv', label: 'CSV', icon: 'fas fa-file-csv', description: 'Dados estruturados para import' }
];

const availableFields = {
  tickets: [
    { id: 'ticketNumber', label: 'Número do Ticket' },
    { id: 'subject', label: 'Assunto' },
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Prioridade' },
    { id: 'assignee', label: 'Responsável' },
    { id: 'customer', label: 'Cliente' },
    { id: 'createdAt', label: 'Data de Criação' },
    { id: 'resolvedAt', label: 'Data de Resolução' },
    { id: 'responseTime', label: 'Tempo de Resposta' },
    { id: 'resolutionTime', label: 'Tempo de Resolução' }
  ],
  analytics: [
    { id: 'period', label: 'Período' },
    { id: 'totalTickets', label: 'Total de Tickets' },
    { id: 'resolvedTickets', label: 'Tickets Resolvidos' },
    { id: 'avgResponseTime', label: 'Tempo Médio de Resposta' },
    { id: 'avgResolutionTime', label: 'Tempo Médio de Resolução' },
    { id: 'customerSatisfaction', label: 'Satisfação do Cliente' },
    { id: 'slaCompliance', label: 'Cumprimento de SLA' }
  ],
  sla: [
    { id: 'customer', label: 'Cliente' },
    { id: 'slaType', label: 'Tipo de SLA' },
    { id: 'target', label: 'Meta' },
    { id: 'actual', label: 'Real' },
    { id: 'compliance', label: 'Conformidade' },
    { id: 'violations', label: 'Violações' },
    { id: 'remainingHours', label: 'Horas Restantes' }
  ],
  agents: [
    { id: 'agentName', label: 'Nome do Agente' },
    { id: 'ticketsAssigned', label: 'Tickets Atribuídos' },
    { id: 'ticketsResolved', label: 'Tickets Resolvidos' },
    { id: 'avgResponseTime', label: 'Tempo Médio de Resposta' },
    { id: 'customerRating', label: 'Avaliação do Cliente' },
    { id: 'workload', label: 'Carga de Trabalho' }
  ],
  customers: [
    { id: 'customerName', label: 'Nome do Cliente' },
    { id: 'totalTickets', label: 'Total de Tickets' },
    { id: 'avgRating', label: 'Avaliação Média' },
    { id: 'lastInteraction', label: 'Última Interação' },
    { id: 'slaStatus', label: 'Status do SLA' }
  ]
};

export function ReportExport() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ExportConfig>({
    format: 'pdf',
    reportType: 'tickets',
    dateRange: { start: null, end: null },
    filters: {},
    fields: [],
    includeCharts: true,
    emailDelivery: {
      enabled: false,
      recipients: [],
      schedule: 'once'
    }
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      fields: checked 
        ? [...prev.fields, fieldId]
        : prev.fields.filter(f => f !== fieldId)
    }));
  };

  const generateReport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (config.emailDelivery?.enabled) {
        toast({
          title: "Relatório Agendado",
          description: `Relatório será enviado por email para ${config.emailDelivery.recipients.length} destinatário(s).`
        });
      } else {
        // Simulate file download
        const fileName = `tatuticket-${config.reportType}-${Date.now()}.${config.format}`;
        
        toast({
          title: "Relatório Gerado",
          description: `${fileName} foi baixado com sucesso!`
        });
        
        // In a real implementation, this would trigger file download
        console.log('Download started:', fileName);
      }
      
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Houve um problema ao gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentFields = availableFields[config.reportType as keyof typeof availableFields] || [];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-download mr-3 text-primary"></i>
          Exportar Relatórios
        </CardTitle>
        <p className="text-gray-600">
          Configure e gere relatórios personalizados em PDF, Excel ou CSV
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tipo do Relatório */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Tipo de Relatório</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportTypes.map((type) => (
              <Card 
                key={type.value}
                className={`cursor-pointer transition-colors ${
                  config.reportType === type.value 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, reportType: type.value as any, fields: [] }))}
                data-testid={`report-type-${type.value}`}
              >
                <CardContent className="p-4 text-center">
                  <i className={`${type.icon} text-2xl text-primary mb-2 block`}></i>
                  <h3 className="font-medium text-sm">{type.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Formato de Exportação */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Formato de Exportação</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exportFormats.map((format) => (
              <Card
                key={format.value}
                className={`cursor-pointer transition-colors ${
                  config.format === format.value 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, format: format.value as any }))}
                data-testid={`format-${format.value}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <i className={`${format.icon} text-xl text-primary`}></i>
                    <div>
                      <h3 className="font-medium">{format.label}</h3>
                      <p className="text-xs text-gray-600">{format.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data Inicial</Label>
            <DatePicker
              selected={config.dateRange.start}
              onSelect={(date: Date | undefined) => setConfig(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: date || null } 
              }))}
              data-testid="date-start"
            />
          </div>
          <div>
            <Label>Data Final</Label>
            <DatePicker
              selected={config.dateRange.end}
              onSelect={(date: Date | undefined) => setConfig(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: date || null } 
              }))}
              data-testid="date-end"
            />
          </div>
        </div>

        <Separator />

        {/* Campos do Relatório */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Campos a Incluir</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentFields.map((field) => (
              <div key={field.id} className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={config.fields.includes(field.id)}
                  onCheckedChange={(checked) => handleFieldToggle(field.id, !!checked)}
                  data-testid={`field-${field.id}`}
                />
                <Label htmlFor={field.id} className="text-sm cursor-pointer">
                  {field.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Opções Avançadas */}
        <div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-4"
            data-testid="button-advanced-options"
          >
            <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'} mr-2`}></i>
            Opções Avançadas
          </Button>

          {showAdvanced && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeCharts: !!checked }))}
                  data-testid="checkbox-include-charts"
                />
                <Label htmlFor="include-charts">Incluir gráficos e visualizações</Label>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-delivery"
                    checked={config.emailDelivery?.enabled || false}
                    onCheckedChange={(checked) => setConfig(prev => ({ 
                      ...prev, 
                      emailDelivery: { ...prev.emailDelivery, enabled: !!checked } 
                    }))}
                    data-testid="checkbox-email-delivery"
                  />
                  <Label htmlFor="email-delivery">Enviar por email</Label>
                </div>

                {config.emailDelivery?.enabled && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <Label>Destinatários (separados por vírgula)</Label>
                      <Input
                        placeholder="email1@empresa.com, email2@empresa.com"
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          emailDelivery: {
                            enabled: prev.emailDelivery?.enabled || false,
                            recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean),
                            schedule: prev.emailDelivery?.schedule || 'once'
                          }
                        }))}
                        data-testid="input-email-recipients"
                      />
                    </div>

                    <div>
                      <Label>Frequência</Label>
                      <Select
                        value={config.emailDelivery?.schedule || 'once'}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          emailDelivery: { ...prev.emailDelivery!, schedule: value as any }
                        }))}
                      >
                        <SelectTrigger data-testid="select-email-schedule">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Uma vez</SelectItem>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Ações */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-600">
            {config.fields.length > 0 && (
              <span>{config.fields.length} campos selecionados</span>
            )}
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-preview">
              <i className="fas fa-eye mr-2"></i>
              Prévia
            </Button>
            
            <Button 
              onClick={generateReport}
              disabled={isExporting || config.fields.length === 0}
              data-testid="button-generate-report"
            >
              {isExporting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Gerando...
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}