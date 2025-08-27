import { db } from "./db";
import { storage } from "./storage";
import { AuthService } from "./services/auth.service";
import type { InsertUser, InsertTenant, InsertTicket, InsertDepartment, InsertTeam, InsertCustomer, InsertKnowledgeArticle, InsertSlaConfig } from "@shared/schema";

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create demo tenants
    const techCorpTenant = await storage.createTenant({
      name: "TechCorp Solutions",
      slug: "techcorp",
      plan: "pro",
      status: "active",
      settings: {
        theme: "default",
        modules: ["tickets", "sla", "knowledge", "analytics"]
      }
    });

    const acmeTenant = await storage.createTenant({
      name: "Acme Corporation",
      slug: "acme",
      plan: "enterprise",
      status: "active",
      settings: {
        theme: "corporate",
        modules: ["tickets", "sla", "knowledge", "analytics", "ai"]
      }
    });

    // Create super admin user with hashed password
    const superAdmin = await storage.createUser({
      username: "Super Admin",
      email: "admin@tatuticket.com",
      password: await AuthService.hashPassword("admin123"),
      role: "super_admin",
      tenantId: null,
      isActive: true
    });

    // Create TechCorp users
    const techCorpAdmin = await storage.createUser({
      username: "João Silva",
      email: "empresa@test.com",
      password: await AuthService.hashPassword("empresa123"),
      role: "admin",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    const techCorpAgent1 = await storage.createUser({
      username: "Maria Santos",
      email: "maria.santos@techcorp.com",
      password: await AuthService.hashPassword("agent123"),
      role: "agent",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    const techCorpAgent2 = await storage.createUser({
      username: "Pedro Lima",
      email: "pedro.lima@techcorp.com",
      password: await AuthService.hashPassword("agent123"),
      role: "agent",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    const techCorpManager = await storage.createUser({
      username: "Ana Costa",
      email: "ana.costa@techcorp.com",
      password: await AuthService.hashPassword("manager123"),
      role: "manager",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    // Create customer user
    const customerUser = await storage.createUser({
      username: "Cliente Demo",
      email: "cliente@test.com",
      password: await AuthService.hashPassword("cliente123"),
      role: "user",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    // Create departments for TechCorp
    const techDept = await storage.createDepartment({
      name: "Tecnologia",
      description: "Departamento de TI e desenvolvimento",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    const supportDept = await storage.createDepartment({
      name: "Suporte",
      description: "Atendimento ao cliente",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    const financeDept = await storage.createDepartment({
      name: "Financeiro",
      description: "Gestão financeira e contabilidade",
      tenantId: techCorpTenant.id,
      isActive: true
    });

    // Create teams
    const devTeam = await storage.createTeam({
      name: "Desenvolvimento",
      description: "Equipe de desenvolvimento de software",
      departmentId: techDept.id,
      tenantId: techCorpTenant.id,
      isActive: true
    });

    const supportTeam = await storage.createTeam({
      name: "Suporte Técnico",
      description: "Equipe de suporte técnico",
      departmentId: supportDept.id,
      tenantId: techCorpTenant.id,
      isActive: true
    });

    // Create customers
    const acmeCustomer = await storage.createCustomer({
      name: "Acme Corp",
      email: "contato@acme.com",
      tenantId: techCorpTenant.id,
      tier: "premium",
      hoursBankBalance: "100.50",
      isActive: true
    });

    const betaCustomer = await storage.createCustomer({
      name: "Beta Inc",
      email: "contato@beta.com",
      tenantId: techCorpTenant.id,
      tier: "standard",
      hoursBankBalance: "50.00",
      isActive: true
    });

    // Create SLA configurations
    const criticalSLA = await storage.createSlaConfig({
      name: "SLA Crítico",
      tenantId: techCorpTenant.id,
      priority: "critical",
      responseTime: 1, // 1 hour
      resolutionTime: 4, // 4 hours
      isActive: true
    });

    const standardSLA = await storage.createSlaConfig({
      name: "SLA Padrão",
      tenantId: techCorpTenant.id,
      priority: "medium",
      responseTime: 4, // 4 hours
      resolutionTime: 24, // 24 hours
      isActive: true
    });

    // Create demo tickets
    const tickets = [
      {
        subject: "Erro no sistema de pagamento",
        description: "O sistema de pagamento está apresentando falhas intermitentes. Clientes não conseguem finalizar compras.",
        status: "open",
        priority: "critical",
        category: "Sistema",
        tenantId: techCorpTenant.id,
        customerId: customerUser.id,
        assigneeId: techCorpAgent1.id,
        departmentId: techDept.id,
        teamId: devTeam.id,
        slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        timeSpent: "2.5",
        cost: "250.00"
      },
      {
        subject: "Dúvida sobre funcionalidade",
        description: "Cliente solicita esclarecimentos sobre como usar a nova funcionalidade de relatórios.",
        status: "in_progress",
        priority: "medium",
        category: "Dúvida",
        tenantId: techCorpTenant.id,
        customerId: customerUser.id,
        assigneeId: techCorpAgent2.id,
        departmentId: supportDept.id,
        teamId: supportTeam.id,
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        timeSpent: "1.0",
        cost: "75.00"
      },
      {
        subject: "Solicitação de nova feature",
        description: "Cliente solicita implementação de dashboard personalizado para relatórios de vendas.",
        status: "resolved",
        priority: "low",
        category: "Feature Request",
        tenantId: techCorpTenant.id,
        customerId: customerUser.id,
        assigneeId: techCorpManager.id,
        departmentId: techDept.id,
        teamId: devTeam.id,
        slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        timeSpent: "8.0",
        cost: "800.00",
        resolvedAt: new Date()
      }
    ];

    for (const ticketData of tickets) {
      await storage.createTicket(ticketData);
    }

    // Create knowledge base articles
    const articles = [
      {
        title: "Como criar um ticket",
        content: "# Como criar um ticket\n\nPara criar um novo ticket, siga estes passos:\n\n1. Acesse o portal do cliente\n2. Clique em 'Novo Ticket'\n3. Preencha o formulário com detalhes\n4. Clique em 'Enviar'\n\nSeu ticket será automaticamente roteado para a equipe apropriada.",
        slug: "como-criar-ticket",
        tenantId: techCorpTenant.id,
        authorId: techCorpAdmin.id,
        status: "published",
        isPublic: true,
        viewCount: 150
      },
      {
        title: "Configuração de SLAs",
        content: "# Configuração de SLAs\n\n## O que são SLAs?\n\nSLAs (Service Level Agreements) definem os tempos de resposta e resolução para diferentes tipos de tickets.\n\n## Como configurar:\n\n1. Acesse Configurações > SLAs\n2. Defina prioridades\n3. Configure tempos de resposta\n4. Salve as alterações",
        slug: "configuracao-slas",
        tenantId: techCorpTenant.id,
        authorId: techCorpManager.id,
        status: "published",
        isPublic: false,
        viewCount: 45
      }
    ];

    for (const articleData of articles) {
      await storage.createKnowledgeArticle(articleData);
    }

    console.log("✅ Database seeded successfully!");
    console.log(`
📊 Created:
- 2 Tenants (TechCorp, Acme)
- 6 Users (1 super admin, 4 TechCorp staff, 1 customer)
- 3 Departments
- 2 Teams  
- 2 Customers
- 2 SLA Configs
- 3 Demo Tickets
- 2 Knowledge Articles
`);

    return {
      tenants: [techCorpTenant, acmeTenant],
      users: [superAdmin, techCorpAdmin, techCorpAgent1, techCorpAgent2, techCorpManager, customerUser],
      departments: [techDept, supportDept, financeDept],
      teams: [devTeam, supportTeam],
      customers: [acmeCustomer, betaCustomer]
    };

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}