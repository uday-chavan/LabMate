import express, { type Request, Response, NextFunction } from "express";
import { setupServer } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure middleware with proper limits and CORS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Test route for server verification
app.get('/test', (req, res) => {
  log('Test route accessed');
  res.send('Server is running!');
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`${req.method} ${req.path} - Request started`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} - Completed in ${duration}ms`);
  });

  next();
});

(async () => {
  try {
    const server = setupServer(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

    // Setup Vite middleware in development
    if (process.env.NODE_ENV !== "production") {
      log('Setting up Vite middleware...');
      await setupVite(app, server);
    } else {
      log('Serving static files...');
      serveStatic(app);
    }

    // Listen on all interfaces
    const PORT = Number(process.env.PORT) || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server started and listening on port ${PORT}`);
      log(`Server available at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();