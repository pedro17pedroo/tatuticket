import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

interface GlobalUser {
  id: string;
  username: string;
  email: string;
  role: "user" | "agent" | "manager" | "admin" | "super_admin";
  tenantId?: string;
  tenantName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  status: "active" | "inactive" | "suspended";
  plan: "freemium" | "pro" | "enterprise";
  userCount: number;
  createdAt: string;
}

export function GlobalUserManagement() {
  const [selectedTab, setSelectedTab] = useState("users");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [userFilter, setUserFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  
  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    tenantId: "",
    isActive: true
  });

  const [tenantFormData, setTenantFormData] = useState({
    name: "",
    plan: "freemium",
    status: "active",
    adminEmail: "",
    adminPassword: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<GlobalUser[]>({
    queryKey: ['/api/admin/users', userFilter],
  });

  // Fetch all tenants
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['/api/admin/tenants', tenantFilter],
  });

  // Fetch admin stats
  const { data: adminStats = {} } = useQuery<{ totalUsers: number; activeTenants: number; activeToday: number; newThisMonth: number }>({
    queryKey: ['/api/admin/stats'],
  });

  // Create/Update user mutation
  const userMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(selectedUser ? `/api/admin/users/${selectedUser.id}` : '/api/admin/users', {
        method: selectedUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: selectedUser ? "Usuário atualizado!" : "Usuário criado!",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowCreateDialog(false);
      setSelectedUser(null);
      resetUserForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar usuário",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Create tenant mutation
  const tenantMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Tenant criado!",
        description: "Nova organização foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setShowTenantDialog(false);
      resetTenantForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tenant",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const resetUserForm = () => {
    setUserFormData({
      username: "",
      email: "",
      password: "",
      role: "user",
      tenantId: "",
      isActive: true
    });
  };

  const resetTenantForm = () => {
    setTenantFormData({
      name: "",
      plan: "freemium",
      status: "active",
      adminEmail: "",
      adminPassword: ""
    });
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    resetUserForm();
    setShowCreateDialog(true);
  };

  const handleEditUser = (user: GlobalUser) => {
    setSelectedUser(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      password: "", // Keep empty for security
      role: user.role,
      tenantId: user.tenantId || "",
      isActive: user.isActive
    });
    setShowCreateDialog(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.username.trim() || !userFormData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome de usuário e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    userMutation.mutate(userFormData);
  };

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantFormData.name.trim() || !tenantFormData.adminEmail.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome da organização e email do admin são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    tenantMutation.mutate(tenantFormData);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Gerente';
      case 'agent': return 'Agente';
      case 'user': return 'Usuário';
      default: return role;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'freemium': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter((user: GlobalUser) => {
    if (userFilter === 'all') return true;
    if (userFilter === 'active') return user.isActive;
    if (userFilter === 'inactive') return !user.isActive;
    return user.role === userFilter;
  });

  const filteredTenants = tenants.filter((tenant: Tenant) => {
    if (tenantFilter === 'all') return true;
    return tenant.status === tenantFilter || tenant.plan === tenantFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento Global de Usuários</h1>
          <p className="text-gray-600">Gerencie todos os usuários e organizações da plataforma</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowTenantDialog(true)} data-testid="button-create-tenant">
            <i className="fas fa-building mr-2"></i>
            Nova Organização
          </Button>
          <Button onClick={handleCreateUser} data-testid="button-create-user">
            <i className="fas fa-user-plus mr-2"></i>
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Usuários"
            value={adminStats.totalUsers || 0}
            icon="fa-users"
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Organizações Ativas"
            value={adminStats.activeTenants || 0}
            icon="fa-building"
            iconColor="bg-green-100 text-green-600"
          />
          <StatsCard
            title="Usuários Ativos Hoje"
            value={adminStats.activeToday || 0}
            icon="fa-user-check"
            iconColor="bg-orange-100 text-orange-600"
          />
          <StatsCard
            title="Novos Este Mês"
            value={adminStats.newThisMonth || 0}
            icon="fa-user-plus"
            iconColor="bg-purple-100 text-purple-600"
          />
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" data-testid="tab-users">
            <i className="fas fa-users mr-2"></i>
            Usuários ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="tenants" data-testid="tab-tenants">
            <i className="fas fa-building mr-2"></i>
            Organizações ({filteredTenants.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Todos os Usuários</h2>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-48" data-testid="select-user-filter">
                <SelectValue placeholder="Filtrar usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="manager">Gerentes</SelectItem>
                <SelectItem value="agent">Agentes</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                  <span className="ml-3 text-gray-600">Carregando usuários...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organização
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user: GlobalUser) => (
                        <tr key={user.id} data-testid={`user-row-${user.username}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.tenantName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              data-testid={`button-edit-user-${user.username}`}
                            >
                              <i className="fas fa-edit mr-1"></i>
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Todas as Organizações</h2>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-48" data-testid="select-tenant-filter">
                <SelectValue placeholder="Filtrar organizações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
                <SelectItem value="suspended">Suspensas</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="freemium">Freemium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {tenantsLoading ? (
              <div className="flex items-center justify-center h-64">
                <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                <span className="ml-3 text-gray-600">Carregando organizações...</span>
              </div>
            ) : (
              filteredTenants.map((tenant: Tenant) => (
                <Card key={tenant.id} data-testid={`tenant-${tenant.name}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-semibold text-lg text-gray-900">{tenant.name}</h3>
                          <Badge className={getPlanColor(tenant.plan)}>
                            {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                          </Badge>
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status === 'active' ? 'Ativo' : tenant.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total de Usuários:</span>
                            <div className="font-medium text-gray-900">{tenant.userCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Criado em:</span>
                            <div className="font-medium text-gray-900">{formatDate(tenant.createdAt)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">ID:</span>
                            <div className="font-medium text-gray-900 font-mono text-xs">{tenant.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        <Button variant="outline" size="sm" data-testid={`button-manage-tenant-${tenant.name}`}>
                          <i className="fas fa-cogs mr-1"></i>
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Nome de Usuário *</Label>
              <Input
                id="username"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                required
                data-testid="input-username"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </div>

            {!selectedUser && (
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  required={!selectedUser}
                  data-testid="input-password"
                />
              </div>
            )}

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={userFormData.role} onValueChange={(value: any) => setUserFormData({ ...userFormData, role: value })}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tenantId">Organização</Label>
              <Select value={userFormData.tenantId} onValueChange={(value) => setUserFormData({ ...userFormData, tenantId: value })}>
                <SelectTrigger data-testid="select-user-tenant">
                  <SelectValue placeholder="Selecionar organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {tenants.map((tenant: Tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                checked={userFormData.isActive}
                onCheckedChange={(checked) => setUserFormData({ ...userFormData, isActive: checked })}
                data-testid="switch-user-active"
              />
              <Label>Usuário ativo</Label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                disabled={userMutation.isPending}
                data-testid="button-cancel-user"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={userMutation.isPending}
                data-testid="button-save-user"
              >
                {userMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    {selectedUser ? 'Atualizar' : 'Criar'} Usuário
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Organização</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTenantSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tenantName">Nome da Organização *</Label>
              <Input
                id="tenantName"
                value={tenantFormData.name}
                onChange={(e) => setTenantFormData({ ...tenantFormData, name: e.target.value })}
                required
                data-testid="input-tenant-name"
              />
            </div>

            <div>
              <Label htmlFor="plan">Plano</Label>
              <Select value={tenantFormData.plan} onValueChange={(value: any) => setTenantFormData({ ...tenantFormData, plan: value })}>
                <SelectTrigger data-testid="select-tenant-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adminEmail">Email do Administrador *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={tenantFormData.adminEmail}
                onChange={(e) => setTenantFormData({ ...tenantFormData, adminEmail: e.target.value })}
                required
                data-testid="input-admin-email"
              />
            </div>

            <div>
              <Label htmlFor="adminPassword">Senha do Administrador *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={tenantFormData.adminPassword}
                onChange={(e) => setTenantFormData({ ...tenantFormData, adminPassword: e.target.value })}
                required
                data-testid="input-admin-password"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowTenantDialog(false)}
                disabled={tenantMutation.isPending}
                data-testid="button-cancel-tenant"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={tenantMutation.isPending}
                data-testid="button-save-tenant"
              >
                {tenantMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Criando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-building mr-2"></i>
                    Criar Organização
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}