import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/hooks/use-toast";
import type { User, Tenant } from "@/types/portal";

export function GlobalUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users (super admin access)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Fetch all tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/admin/tenants'],
  });

  // Fetch global stats
  const { data: globalStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Filter users
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesTenant = tenantFilter === "all" || user.tenantId === tenantFilter;

    return matchesSearch && matchesRole && matchesTenant;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'agent': return 'Agente';
      case 'user': return 'Cliente';
      default: return role;
    }
  };

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return 'Global';
    const tenant = tenants.find((t: Tenant) => t.id === tenantId);
    return tenant?.name || 'Desconhecido';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          <span className="ml-3 text-gray-600">Carregando usuários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão Global de Usuários</h1>
          <p className="text-gray-600">Gerencie todos os usuários do sistema</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-user">
          <i className="fas fa-user-plus mr-2"></i>
          Novo Usuário
        </Button>
      </div>

      {/* Global Stats */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Usuários"
            value={globalStats.totalUsers || 0}
            icon="fa-users"
            iconColor="bg-blue-100 text-blue-600"
            change={{
              value: "+8%",
              type: "increase",
              label: "vs mês anterior"
            }}
          />
          <StatsCard
            title="Usuários Ativos"
            value={globalStats.activeUsers || 0}
            icon="fa-user-check"
            iconColor="bg-green-100 text-green-600"
            change={{
              value: "95%",
              type: "increase",
              label: "taxa de atividade"
            }}
          />
          <StatsCard
            title="Total de Tenants"
            value={globalStats.totalTenants || 0}
            icon="fa-building"
            iconColor="bg-purple-100 text-purple-600"
          />
          <StatsCard
            title="Novos Hoje"
            value={globalStats.newUsersToday || 0}
            icon="fa-user-plus"
            iconColor="bg-orange-100 text-orange-600"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-filter mr-2"></i>
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
            <div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger data-testid="select-role-filter">
                  <SelectValue placeholder="Todas as funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="user">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger data-testid="select-tenant-filter">
                  <SelectValue placeholder="Todos os tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tenants</SelectItem>
                  <SelectItem value="">Global</SelectItem>
                  {tenants.map((tenant: Tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              <i className="fas fa-list mr-2"></i>
              Usuários ({filteredUsers.length})
            </span>
            <div className="text-sm text-gray-600">
              {searchTerm && `Filtrando por: "${searchTerm}"`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
              <p className="text-lg font-medium text-gray-600 mb-2">
                Nenhum usuário encontrado
              </p>
              <p className="text-gray-500">
                {searchTerm ? "Tente usar outros termos de busca" : "Crie seu primeiro usuário"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user: User) => (
                    <tr key={user.id} className="hover:bg-gray-50" data-testid={`user-row-${user.username}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getTenantName(user.tenantId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            data-testid={`button-view-user-${user.username}`}
                          >
                            <i className="fas fa-eye mr-1"></i>
                            Ver
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-edit-user-${user.username}`}
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                            data-testid={`button-toggle-user-${user.username}`}
                          >
                            <i className={`fas ${user.isActive ? 'fa-ban' : 'fa-check'} mr-1`}></i>
                            {user.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome de Usuário</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedUser.username}
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedUser.email}
                  </div>
                </div>
                <div>
                  <Label>Função</Label>
                  <div className="mt-1">
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>
                      {getRoleLabel(selectedUser.role)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge className={selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {selectedUser.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Tenant</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {getTenantName(selectedUser.tenantId)}
                  </div>
                </div>
                <div>
                  <Label>Data de Criação</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {formatDate(selectedUser.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Fechar
                </Button>
                <Button data-testid="button-edit-selected-user">
                  <i className="fas fa-edit mr-2"></i>
                  Editar Usuário
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}