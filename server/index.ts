import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { requestLogger, errorHandler, notFoundHandler } from "./middlewares";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API error sanitizer - prevents stack traces from leaking to clients
app.use('/api', (req, res, next) => {
  const origJson = res.json.bind(res);
  const origSend = res.send.bind(res);
  const origEnd = res.end.bind(res);

  function sanitize(body: any): any {
    if (res.statusCode >= 400 && body) {
      if (typeof body === 'object') {
        const hasLeak = 'stack' in body || ('message' in body && !('error' in body));
        if (hasLeak) {
          res.set('X-Error-Handler', 'sanitizer');
          return { error: body.message || 'Error', success: false };
        }
      } else if (typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          const hasLeak = parsed && (parsed.stack || (parsed.message && !parsed.error));
          if (hasLeak) {
            res.set('X-Error-Handler', 'sanitizer');
            return JSON.stringify({ error: parsed.message || 'Error', success: false });
          }
        } catch {
          // Non-JSON string: check for stack-like patterns
          if (/\bError:|at\s+\S+\s+\(/.test(body)) {
            res.set('X-Error-Handler', 'sanitizer');
            return JSON.stringify({ error: 'Error', success: false });
          }
        }
      } else if (Buffer.isBuffer(body)) {
        const asString = body.toString('utf8');
        const sanitized = sanitize(asString);
        if (sanitized !== asString) {
          return Buffer.from(sanitized, 'utf8');
        }
      }
    }
    return body;
  }

  res.json = (body) => origJson(sanitize(body));
  res.send = (body) => origSend(sanitize(body));
  res.end = (chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) => {
    if (chunk) {
      const sanitized = sanitize(chunk);
      if (sanitized !== chunk) {
        res.set('Content-Type', 'application/json');
        return origEnd(sanitized, encoding as BufferEncoding, cb);
      }
    }
    return origEnd(chunk, encoding as BufferEncoding, cb);
  };
  next();
});

(async () => {
  // Register all API routes with request logging only for API routes
  const server = registerRoutes(app);

  // API-specific error handling (before Vite to prevent interception)
  app.use('/api', notFoundHandler);
  app.use('/api', errorHandler);

  // Setup Vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handling middleware for non-API routes
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();