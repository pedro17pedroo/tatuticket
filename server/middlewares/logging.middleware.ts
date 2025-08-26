import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[${new Date().toISOString()}] ${logLine}`);
    }
  });

  next();
};

export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // This will be implemented to create audit logs
    // For now, just log the action
    console.log(`[AUDIT] ${action} - User: ${(req as any).user?.email || 'anonymous'} - IP: ${req.ip}`);
    next();
  };
};