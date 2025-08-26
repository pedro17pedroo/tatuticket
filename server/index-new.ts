import express from "express";
import { createServer } from "http";
import router from "./routes-complete";
import { requestLogger, errorHandler, notFoundHandler } from "./middlewares";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use(requestLogger);

// Register all API routes
app.use('/', router);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Start server
const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`🎯 TatuTicket API (MVC) rodando na porta ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/api/auth/demo-credentials`);
});