import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  department?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  _count?: {
    assignedTickets: number;
  };
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  departmentId: string;
  teamId: string;
}

export function AgentManagement() {
  const tenantId = authService.getTenantId();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    role: "",
    departmentId: "",
    teamId: "",
  });

  // Fetch users/agents
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/users?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch departments for form
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/departments?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId && (isCreateOpen || !!editingUser),
  });

  // Fetch teams for form
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/teams?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId && (isCreateOpen || !!editingUser),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData & { tenantId: string }) => {
      return apiRequest('/api/users', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', tenantId] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "",
      departmentId: "",
      teamId: "",
    });
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    createUserMutation.mutate({
      ...formData,
      tenantId,
    });
  };

  const handleEdit = (user: User) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
      departmentId: user.department?.id || "",
      teamId: user.team?.id || "",
    });
    setEditingUser(user);
    setIsCreateOpen(true);
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      agent: "bg-green-100 text-green-800",
      user: "bg-gray-100 text-gray-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      super_admin: "Super Admin",
      admin: "Administrador",
      manager: "Gerente",
      agent: "Agente",
      user: "Usuário",
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Agentes</h2>
          <p className="text-gray-600">Gerencie usuários, agentes e suas permissões</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-agent">
              <i className="fas fa-plus mr-2"></i>Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar" : "Criar"} Usuário
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Nome do usuário"
                    required
                    data-testid="input-user-username"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    required
                    data-testid="input-user-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required={!editingUser}
                    data-testid="input-user-password"
                  />
                  {editingUser && (
                    <p className="text-xs text-gray-500 mt-1">Deixe em branco para manter a senha atual</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger data-testid="select-user-role">
                      <SelectValue placeholder="Selecione a função..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentId">Departamento</Label>
                  <Select 
                    value={formData.departmentId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                  >
                    <SelectTrigger data-testid="select-user-department">
                      <SelectValue placeholder="Selecione o departamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem departamento</SelectItem>
                      {departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teamId">Equipe</Label>
                  <Select 
                    value={formData.teamId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}
                  >
                    <SelectTrigger data-testid="select-user-team">
                      <SelectValue placeholder="Selecione a equipe..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem equipe</SelectItem>
                      {teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  data-testid="button-cancel-user"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  {createUserMutation.isPending ? "Salvando..." : editingUser ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            data-testid="input-search-users"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por função..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            <SelectItem value="agent">Agentes</SelectItem>
            <SelectItem value="manager">Gerentes</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      {isLoadingUsers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    data-testid={`button-edit-user-${user.id}`}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {user.department && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-building text-gray-400 mr-2"></i>
                      <span>{user.department.name}</span>
                    </div>
                  )}
                  
                  {user.team && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-users text-gray-400 mr-2"></i>
                      <span>{user.team.name}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-500">
                    <i className="fas fa-ticket-alt mr-1"></i>
                    <span>{user._count?.assignedTickets || 0} tickets atribuídos</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-tickets-${user.id}`}>
                      <i className="fas fa-ticket-alt mr-2"></i>Ver Tickets
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-permissions-${user.id}`}>
                      <i className="fas fa-key"></i>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <i className="fas fa-user-tie text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== "all" 
                ? "Nenhum usuário encontrado" 
                : "Nenhum usuário cadastrado"
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter !== "all"
                ? "Tente buscar por outro termo ou alterar os filtros."
                : "Cadastre o primeiro usuário para começar a gestão da equipe."
              }
            </p>
            {!searchTerm && roleFilter === "all" && (
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-user">
                <i className="fas fa-plus mr-2"></i>Cadastrar Primeiro Usuário
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}