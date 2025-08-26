import { Router } from 'express';
import { storage } from './storage';
import { AuthService, OtpService, TicketService, UserService, TenantService, PaymentService } from './services';
import { 
  insertUserSchema, insertTenantSchema, insertTicketSchema, 
  insertDepartmentSchema, insertTeamSchema, insertCustomerSchema, 
  insertKnowledgeArticleSchema, insertSlaConfigSchema 
} from '@shared/schema';
import { z } from 'zod';
import { catchAsync, AppError } from './middlewares';

const router = Router();

// Auth routes
router.post('/api/auth/register', catchAsync(async (req, res) => {
  const userData = insertUserSchema.parse(req.body);
  const result = await AuthService.registerUser(userData);
  res.status(201).json(result);
}));

router.post('/api/auth/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.loginUser(
    email, 
    password, 
    req.ip || undefined, 
    req.get('User-Agent') || undefined
  );
  res.json(result);
}));

router.get('/api/auth/demo-credentials', catchAsync(async (req, res) => {
  const credentials = await AuthService.getDemoCredentials();
  res.json(credentials);
}));

// OTP routes
router.post('/api/auth/send-otp', catchAsync(async (req, res) => {
  const { email, type = "email_verification" } = req.body;
  const result = await OtpService.sendOtp(
    email, 
    type, 
    req.ip || undefined, 
    req.get('User-Agent') || undefined
  );
  res.json(result);
}));

router.post('/api/auth/verify-otp', catchAsync(async (req, res) => {
  const { email, code, type = "email_verification" } = req.body;
  const result = await OtpService.verifyOtp(
    email, 
    code, 
    type, 
    req.ip || undefined, 
    req.get('User-Agent') || undefined
  );
  res.json(result);
}));

// Payment routes
router.post('/api/payments/create-subscription', catchAsync(async (req, res) => {
  const { email, planId, companyName, paymentMethodId } = req.body;
  const result = await PaymentService.createSubscription(
    email,
    planId,
    companyName,
    paymentMethodId,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );
  res.json(result);
}));

router.post('/api/payments/confirm-subscription', catchAsync(async (req, res) => {
  const { subscriptionId, tenantData } = req.body;
  const result = await PaymentService.confirmSubscription(
    subscriptionId,
    tenantData,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );
  res.json(result);
}));

// Tenant routes
router.get('/api/tenants', catchAsync(async (req, res) => {
  const tenants = await TenantService.getAllTenants();
  res.json(tenants);
}));

router.post('/api/tenants', catchAsync(async (req, res) => {
  const tenantData = insertTenantSchema.parse(req.body);
  const tenant = await TenantService.createTenant(
    tenantData,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );
  res.status(201).json(tenant);
}));

router.get('/api/tenants/:id', catchAsync(async (req, res) => {
  const tenant = await TenantService.getTenantById(req.params.id);
  res.json(tenant);
}));

router.put('/api/tenants/:id', catchAsync(async (req, res) => {
  const tenant = await TenantService.updateTenant(req.params.id, req.body);
  res.json(tenant);
}));

// Ticket routes
router.get('/api/tickets', catchAsync(async (req, res) => {
  const { tenantId, customerId, assigneeId } = req.query;
  const tickets = await TicketService.getTickets({
    tenantId: tenantId as string,
    customerId: customerId as string,
    assigneeId: assigneeId as string
  });
  res.json(tickets);
}));

router.post('/api/tickets', catchAsync(async (req, res) => {
  const ticketData = insertTicketSchema.parse(req.body);
  const ticket = await TicketService.createTicket(
    ticketData,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );
  res.status(201).json(ticket);
}));

router.get('/api/tickets/:id', catchAsync(async (req, res) => {
  const ticket = await TicketService.getTicketById(req.params.id);
  res.json(ticket);
}));

router.put('/api/tickets/:id', catchAsync(async (req, res) => {
  const ticket = await TicketService.updateTicket(
    req.params.id,
    req.body,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );
  res.json(ticket);
}));

// User routes
router.get('/api/users', catchAsync(async (req, res) => {
  const { tenantId, role } = req.query;
  const users = await UserService.getUsers(tenantId as string, role as string);
  res.json(users);
}));

router.post('/api/users', catchAsync(async (req, res) => {
  const userData = insertUserSchema.parse(req.body);
  const user = await UserService.createUser(
    userData,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );
  res.status(201).json(user);
}));

router.get('/api/users/:id', catchAsync(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  res.json(user);
}));

router.put('/api/users/:id', catchAsync(async (req, res) => {
  const user = await UserService.updateUser(
    req.params.id,
    req.body,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );
  res.json(user);
}));

// Adicionar todas as outras rotas do sistema original
// Department routes
router.get('/api/departments', catchAsync(async (req, res) => {
  const { tenantId } = req.query;
  if (!tenantId) {
    throw new AppError('tenantId is required', 400);
  }
  const departments = await storage.getDepartmentsByTenant(tenantId as string);
  res.json(departments);
}));

router.post('/api/departments', catchAsync(async (req, res) => {
  const departmentData = insertDepartmentSchema.parse(req.body);
  const department = await storage.createDepartment(departmentData);
  res.status(201).json(department);
}));

// Team routes
router.get('/api/teams', catchAsync(async (req, res) => {
  const { tenantId, departmentId } = req.query;
  
  let teams;
  if (departmentId) {
    teams = await storage.getTeamsByDepartment(departmentId as string);
  } else if (tenantId) {
    teams = await storage.getTeamsByTenant(tenantId as string);
  } else {
    throw new AppError('tenantId or departmentId is required', 400);
  }
  
  res.json(teams);
}));

router.post('/api/teams', catchAsync(async (req, res) => {
  const teamData = insertTeamSchema.parse(req.body);
  const team = await storage.createTeam(teamData);
  res.status(201).json(team);
}));

// Customer routes
router.get('/api/customers', catchAsync(async (req, res) => {
  const { tenantId } = req.query;
  if (!tenantId) {
    throw new AppError('tenantId is required', 400);
  }
  const customers = await storage.getCustomersByTenant(tenantId as string);
  res.json(customers);
}));

router.post('/api/customers', catchAsync(async (req, res) => {
  const customerData = insertCustomerSchema.parse(req.body);
  const customer = await storage.createCustomer(customerData);
  res.status(201).json(customer);
}));

// Knowledge base routes
router.get('/api/knowledge-articles', catchAsync(async (req, res) => {
  const { tenantId } = req.query;
  if (!tenantId) {
    throw new AppError('tenantId is required', 400);
  }
  const articles = await storage.getKnowledgeArticlesByTenant(tenantId as string);
  res.json(articles);
}));

router.post('/api/knowledge-articles', catchAsync(async (req, res) => {
  const articleData = insertKnowledgeArticleSchema.parse(req.body);
  const article = await storage.createKnowledgeArticle(articleData);
  res.status(201).json(article);
}));

router.get('/api/knowledge-articles/:id', catchAsync(async (req, res) => {
  const article = await storage.getKnowledgeArticle(req.params.id);
  if (!article) {
    throw new AppError('Article not found', 404);
  }
  res.json(article);
}));

router.put('/api/knowledge-articles/:id', catchAsync(async (req, res) => {
  const updates = req.body;
  const article = await storage.updateKnowledgeArticle(req.params.id, updates);
  res.json(article);
}));

export default router;