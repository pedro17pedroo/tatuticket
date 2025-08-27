import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, UserPlus, Settings, Shield, Crown, Eye, Lock, Unlock,
  Search, Filter, Download, Upload, Mail, Phone, Calendar,
  Activity, TrendingUp, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent' | 'user';
  tenantId: string;
  tenantName: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin?: string;
  createdAt: string;
  permissions: string[];
  sessionCount: number;
  ticketsAssigned: number;
  avgResponseTime: number;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: 'active' | 'suspended' | 'trial';
  userCount: number;
  maxUsers: number;
  createdAt: string;
  lastActivity: string;
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export function AdvancedUserManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const queryClient = useQueryClient();

  // Mock data - In real app, this would come from API
  const usersData: User[] = [
    {
      id: '1',
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@techcorp.com',
      phone: '+55 11 99999-1111',
      role: 'admin',
      tenantId: 'tenant_1',
      tenantName: 'TechCorp Solutions',
      status: 'active',
      lastLogin: '2025-01-27T14:30:00Z',
      createdAt: '2025-01-15T10:00:00Z',
      permissions: ['manage_users', 'view_reports', 'manage_tickets'],
      sessionCount: 45,
      ticketsAssigned: 23,
      avgResponseTime: 2.5
    },
    {
      id: '2',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@startup.com',
      role: 'manager',
      tenantId: 'tenant_2',
      tenantName: 'StartupXYZ',
      status: 'active',
      lastLogin: '2025-01-27T12:15:00Z',
      createdAt: '2025-01-20T14:30:00Z',
      permissions: ['view_reports', 'manage_tickets'],
      sessionCount: 18,
      ticketsAssigned: 12,
      avgResponseTime: 3.2
    },
    {
      id: '3',
      firstName: 'Carlos',
      lastName: 'Oliveira',
      email: 'carlos@global.com',
      role: 'super_admin',
      tenantId: 'tenant_3',
      tenantName: 'Global Services Inc',
      status: 'active',
      lastLogin: '2025-01-27T15:45:00Z',
      createdAt: '2025-01-10T09:00:00Z',
      permissions: ['all'],
      sessionCount: 89,
      ticketsAssigned: 5,
      avgResponseTime: 1.8
    },
    {
      id: '4',
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana@techcorp.com',
      role: 'agent',
      tenantId: 'tenant_1',
      tenantName: 'TechCorp Solutions',
      status: 'suspended',
      lastLogin: '2025-01-25T16:20:00Z',
      createdAt: '2025-01-22T11:15:00Z',
      permissions: ['manage_tickets'],
      sessionCount: 8,
      ticketsAssigned: 35,
      avgResponseTime: 4.1
    }
  ];

  const tenantsData: Tenant[] = [
    {
      id: 'tenant_1',
      name: 'TechCorp Solutions',
      plan: 'Enterprise',
      status: 'active',
      userCount: 15,
      maxUsers: 20,
      createdAt: '2025-01-15T10:00:00Z',
      lastActivity: '2025-01-27T14:30:00Z'
    },
    {
      id: 'tenant_2',
      name: 'StartupXYZ',
      plan: 'Professional',
      status: 'trial',
      userCount: 3,
      maxUsers: 5,
      createdAt: '2025-01-20T14:30:00Z',
      lastActivity: '2025-01-27T12:15:00Z'
    },
    {
      id: 'tenant_3',
      name: 'Global Services Inc',
      plan: 'Enterprise',
      status: 'active',
      userCount: 25,
      maxUsers: 30,
      createdAt: '2025-01-10T09:00:00Z',
      lastActivity: '2025-01-27T15:45:00Z'
    }
  ];

  const activitiesData: UserActivity[] = [
    {
      id: '1',
      userId: '1',
      action: 'login',
      description: 'Usuário fez login no sistema',
      timestamp: '2025-01-27T14:30:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0'
    },
    {
      id: '2',
      userId: '2',
      action: 'ticket_created',
      description: 'Criou ticket #TICK-001',
      timestamp: '2025-01-27T12:15:00Z',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (macOS) Safari/537.36'
    }
  ];

  const { data: users = usersData } = useQuery<User[]>({
    queryKey: ['/api/admin/users', searchQuery, roleFilter, statusFilter, tenantFilter],
    enabled: true
  });

  const { data: tenants = tenantsData } = useQuery<Tenant[]>({
    queryKey: ['/api/admin/tenants'],
    enabled: true
  });

  const { data: activities = activitiesData } = useQuery<UserActivity[]>({
    queryKey: ['/api/admin/user-activities'],
    enabled: true
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: Date.now().toString(), ...userData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowCreateDialog(false);
      toast({
        title: "Usuário criado",
        description: "Novo usuário adicionado com sucesso",
      });
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Usuário suspenso",
        description: "O usuário foi suspenso do sistema",
      });
    }
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return Crown;
      case 'admin': return Shield;
      case 'manager': return Settings;
      case 'agent': return Users;
      case 'user': return Eye;
      default: return Users;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesTenant = tenantFilter === 'all' || user.tenantId === tenantFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesTenant;
  });

  const CreateUserForm = () => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
      tenantId: '',
      status: 'active'
    });

    const handleSubmit = () => {
      createUserMutation.mutate(formData as Partial<User>);
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Nome"
              data-testid="input-first-name"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Sobrenome"
              data-testid="input-last-name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="usuario@empresa.com"
            data-testid="input-email"
          />
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+55 11 99999-9999"
            data-testid="input-phone"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Função</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="agent">Agente</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tenant">Organização</Label>
            <Select value={formData.tenantId} onValueChange={(value) => setFormData({ ...formData, tenantId: value })}>
              <SelectTrigger data-testid="select-tenant">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateDialog(false)}
            className="flex-1"
            data-testid="button-cancel"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createUserMutation.isPending || !formData.firstName || !formData.lastName || !formData.email}
            className="flex-1"
            data-testid="button-create"
          >
            {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="advanced-user-management">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão Avançada de Usuários</h1>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-user">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <CreateUserForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="tenants">Organizações</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card data-testid="card-total-users">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Usuários</p>
                    <p className="text-xl font-bold">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-active-users">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usuários Ativos</p>
                    <p className="text-xl font-bold">{users.filter(u => u.status === 'active').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-suspended-users">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Suspensos</p>
                    <p className="text-xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-online-users">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Online Agora</p>
                    <p className="text-xl font-bold">
                      {users.filter(u => {
                        if (!u.lastLogin) return false;
                        const lastLogin = new Date(u.lastLogin);
                        const now = new Date();
                        return (now.getTime() - lastLogin.getTime()) < 30 * 60 * 1000; // 30 minutes
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card data-testid="card-filters">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Nome, email ou organização..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="roleFilter">Função</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger data-testid="select-role-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusFilter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tenantFilter">Organização</Label>
                  <Select value={tenantFilter} onValueChange={setTenantFilter}>
                    <SelectTrigger data-testid="select-tenant-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {tenants.map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card data-testid="card-users-table">
            <CardHeader>
              <CardTitle>Usuários do Sistema ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{user.tenantName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? (
                            <div className="text-sm">
                              <div>{new Date(user.lastLogin).toLocaleDateString('pt-BR')}</div>
                              <div className="text-gray-500">
                                {new Date(user.lastLogin).toLocaleTimeString('pt-BR')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                              {user.ticketsAssigned} tickets • {user.avgResponseTime}h avg
                            </div>
                            <div className="text-xs text-gray-600">
                              {user.sessionCount} sessões
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`button-view-${user.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => suspendUserMutation.mutate(user.id)}
                                className="text-red-600"
                                data-testid={`button-suspend-${user.id}`}
                              >
                                <Lock className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateUserMutation.mutate({ 
                                  userId: user.id, 
                                  updates: { status: 'active' } 
                                })}
                                className="text-green-600"
                                data-testid={`button-activate-${user.id}`}
                              >
                                <Unlock className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card data-testid="card-tenants-overview">
            <CardHeader>
              <CardTitle>Organizações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <Badge>{tenant.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tenant.status)}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{tenant.userCount}/{tenant.maxUsers}</span>
                          <Progress 
                            value={(tenant.userCount / tenant.maxUsers) * 100} 
                            className="w-16 h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.lastActivity).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" data-testid={`button-manage-${tenant.id}`}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card data-testid="card-user-activities">
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const user = users.find(u => u.id === activity.userId);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg" data-testid={`activity-${activity.id}`}>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                          <Badge variant="outline">{activity.action}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString('pt-BR')} • {activity.ipAddress}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-usage-analytics">
              <CardHeader>
                <CardTitle>Analytics de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Usuários Ativos Hoje</span>
                    <span className="font-bold">{users.filter(u => u.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tempo Médio de Resposta</span>
                    <span className="font-bold">
                      {users.length > 0 ? 
                        (users.reduce((sum, u) => sum + u.avgResponseTime, 0) / users.length).toFixed(1) 
                        : 0}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total de Sessões</span>
                    <span className="font-bold">
                      {users.reduce((sum, u) => sum + u.sessionCount, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-performance-metrics">
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Tickets Atribuídos</span>
                    <span className="font-bold">
                      {users.reduce((sum, u) => sum + u.ticketsAssigned, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxa de Atividade</span>
                    <span className="font-bold">
                      {users.length > 0 ? 
                        Math.round((users.filter(u => u.status === 'active').length / users.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Usuários por Organização</span>
                    <span className="font-bold">
                      {tenants.length > 0 ?
                        Math.round(users.length / tenants.length)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}