import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, Filter, Calendar as CalendarIcon, Download, 
  Eye, AlertTriangle, Shield, User, Database, Settings, 
  Clock, CheckCircle, XCircle, Activity, FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'failed_login' | 'suspicious_activity' | 'data_breach' | 'privilege_escalation' | 'unusual_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  tenantId?: string;
  description: string;
  ipAddress: string;
  resolved: boolean;
  assignedTo?: string;
}

export function AuditSystem() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs', selectedCategory, selectedSeverity, searchTerm, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange.from) params.append('from', dateRange.from.toISOString());
      if (dateRange.to) params.append('to', dateRange.to.toISOString());
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar logs de auditoria');
      const result = await response.json();
      return result.data;
    }
  });

  // Fetch security events
  const { data: securityEvents, isLoading: isLoadingEvents } = useQuery<SecurityEvent[]>({
    queryKey: ['/api/admin/security-events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/security-events');
      if (!response.ok) throw new Error('Falha ao carregar eventos de segurança');
      const result = await response.json();
      return result.data;
    }
  });

  // Mock data fallback
  const mockAuditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: new Date('2025-01-27T10:30:00'),
      userId: 'user-123',
      userEmail: 'admin@techcorp.com',
      tenantId: 'tenant-1',
      tenantName: 'TechCorp Solutions',
      action: 'UPDATE_USER_PERMISSIONS',
      resource: 'user',
      resourceId: 'user-456',
      details: { 
        oldRole: 'agent', 
        newRole: 'manager',
        permissions: ['ticket.read', 'ticket.write', 'user.read']
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success',
      severity: 'medium',
      category: 'authorization'
    },
    {
      id: '2',
      timestamp: new Date('2025-01-27T09:15:00'),
      userId: 'user-789',
      userEmail: 'manager@startup.com',
      tenantId: 'tenant-2',
      tenantName: 'StartupXYZ',
      action: 'DELETE_TICKET',
      resource: 'ticket',
      resourceId: 'ticket-123',
      details: { 
        ticketSubject: 'Urgent billing issue',
        reason: 'Duplicate ticket'
      },
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      result: 'success',
      severity: 'high',
      category: 'data_modification'
    },
    {
      id: '3',
      timestamp: new Date('2025-01-27T08:45:00'),
      userId: 'user-999',
      userEmail: 'unknown@suspicious.com',
      tenantId: 'tenant-1',
      tenantName: 'TechCorp Solutions',
      action: 'LOGIN_ATTEMPT',
      resource: 'authentication',
      resourceId: 'session-failed',
      details: { 
        reason: 'Invalid credentials',
        attempts: 5
      },
      ipAddress: '45.128.76.23',
      userAgent: 'curl/7.68.0',
      result: 'failure',
      severity: 'critical',
      category: 'authentication'
    }
  ];

  const mockSecurityEvents: SecurityEvent[] = [
    {
      id: '1',
      timestamp: new Date('2025-01-27T11:00:00'),
      type: 'failed_login',
      severity: 'high',
      userId: 'user-999',
      tenantId: 'tenant-1',
      description: '5 tentativas de login falharam em 2 minutos',
      ipAddress: '45.128.76.23',
      resolved: false
    },
    {
      id: '2',
      timestamp: new Date('2025-01-27T10:30:00'),
      type: 'suspicious_activity',
      severity: 'medium',
      userId: 'user-123',
      tenantId: 'tenant-1',
      description: 'Acesso a dados sensíveis fora do horário comercial',
      ipAddress: '192.168.1.100',
      resolved: true,
      assignedTo: 'security-team'
    }
  ];

  const logs = auditLogs || mockAuditLogs;
  const events = securityEvents || mockSecurityEvents;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Shield className="h-4 w-4" />;
      case 'authorization': return <User className="h-4 w-4" />;
      case 'data_access': return <Eye className="h-4 w-4" />;
      case 'data_modification': return <Database className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'security': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const exportAuditLogs = () => {
    // Implementation for exporting audit logs
    console.log('Exporting audit logs...');
  };

  return (
    <div className="space-y-6" data-testid="audit-system">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Auditoria</h2>
          <p className="text-muted-foreground">Monitoramento e logs de atividade do sistema</p>
        </div>
        <Button onClick={exportAuditLogs} data-testid="button-export-audit">
          <Download className="h-4 w-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-logs"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="authentication">Autenticação</SelectItem>
                <SelectItem value="authorization">Autorização</SelectItem>
                <SelectItem value="data_access">Acesso a Dados</SelectItem>
                <SelectItem value="data_modification">Modificação de Dados</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-48" data-testid="select-severity">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Severidades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" data-testid="button-date-filter">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Período
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs" data-testid="tab-audit-logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security-events">Eventos de Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Logs de Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(log.timestamp, 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.userEmail}</p>
                            <p className="text-xs text-muted-foreground">{log.ipAddress}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.tenantName}</p>
                            <p className="text-xs text-muted-foreground">{log.tenantId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {log.action}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.resource}</p>
                            <p className="text-xs text-muted-foreground">{log.resourceId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getResultIcon(log.result)}
                            <span className="capitalize">{log.result}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getCategoryIcon(log.category)}
                            <span className="capitalize">{log.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" data-testid={`button-view-log-${log.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Eventos de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event.id} className={`border-l-4 ${
                      event.severity === 'critical' ? 'border-l-red-500' :
                      event.severity === 'high' ? 'border-l-orange-500' :
                      event.severity === 'medium' ? 'border-l-yellow-500' :
                      'border-l-blue-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getSeverityColor(event.severity)}>
                                {event.severity}
                              </Badge>
                              <Badge variant="outline">{event.type.replace('_', ' ')}</Badge>
                              {event.resolved ? (
                                <Badge className="bg-green-100 text-green-800">Resolvido</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Ativo</Badge>
                              )}
                            </div>
                            <h3 className="font-medium mb-1">{event.description}</h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Timestamp: {format(event.timestamp, 'dd/MM/yyyy HH:mm:ss')}</p>
                              <p>IP: {event.ipAddress}</p>
                              {event.assignedTo && <p>Atribuído para: {event.assignedTo}</p>}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-investigate-${event.id}`}>
                              Investigar
                            </Button>
                            {!event.resolved && (
                              <Button size="sm" data-testid={`button-resolve-${event.id}`}>
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}