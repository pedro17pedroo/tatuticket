import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    tickets: number;
  };
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export function CustomerManagement() {
  const tenantId = authService.getTenantId();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/customers?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData & { tenantId: string }) => {
      return apiRequest('/api/customers', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', tenantId] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    });
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    createCustomerMutation.mutate({
      ...formData,
      tenantId,
    });
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      company: customer.company || "",
      notes: customer.notes || "",
    });
    setEditingCustomer(customer);
    setIsCreateOpen(true);
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h2>
          <p className="text-gray-600">Gerencie clientes e seus dados de contato</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-customer">
              <i className="fas fa-plus mr-2"></i>Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar" : "Criar"} Cliente
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do cliente"
                    required
                    data-testid="input-customer-name"
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
                    data-testid="input-customer-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    data-testid="input-customer-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome da empresa"
                    data-testid="input-customer-company"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o cliente..."
                  rows={3}
                  data-testid="textarea-customer-notes"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  data-testid="button-cancel-customer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  data-testid="button-save-customer"
                >
                  {createCustomerMutation.isPending ? "Salvando..." : editingCustomer ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar clientes por nome, email ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            data-testid="input-search-customers"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {isLoading ? (
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
      ) : filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    data-testid={`button-edit-customer-${customer.id}`}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.company && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-building text-gray-400 mr-2"></i>
                      <span>{customer.company}</span>
                    </div>
                  )}
                  
                  {customer.phone && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-phone text-gray-400 mr-2"></i>
                      <span>{customer.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant={customer.isActive ? "default" : "secondary"}>
                      {customer.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <i className="fas fa-ticket-alt mr-1"></i>
                      <span>{customer._count?.tickets || 0} tickets</span>
                    </div>
                  </div>

                  {customer.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <p className="truncate" title={customer.notes}>
                        {customer.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-tickets-${customer.id}`}>
                      <i className="fas fa-ticket-alt mr-2"></i>Ver Tickets
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-contact-${customer.id}`}>
                      <i className="fas fa-envelope"></i>
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
            <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? "Tente buscar por outro termo ou limpe o filtro."
                : "Cadastre seu primeiro cliente para começar o atendimento."
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-customer">
                <i className="fas fa-plus mr-2"></i>Cadastrar Primeiro Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}