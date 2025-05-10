import dotenv from 'dotenv';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedLearningModules } from "./seeders/learningModuleSeeder";
import { storage } from "./storage";
import session from "express-session";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import { createAdminUserIfNeeded } from "./adminSeed";

dotenv.config();


// Create PostgreSQL session store
const PgSession = connectPgSimple(session);

// Session secret
const sessionSecret = process.env.SESSION_SECRET

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use Helmet to set security headers
app.use(helmet({
  // Customize helmet settings
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow evaluation for Vite HMR
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections for HMR
      imgSrc: ["'self'", "data:", "blob:"], // Allow data URLs for images
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
      fontSrc: ["'self'", "data:"], // Allow data URLs for fonts
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // Set Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Disable for compatibility with external resources
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Set up session middleware
// Trust first proxy in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
      // Specify schema options
      schemaName: "public",
      // Clean up invalid sessions
      pruneSessionInterval: 60 * 15, // 15 minutes
      // Ensure only one connection pool is used
      disableTouch: false
    }),
    secret: sessionSecret as any,
    // Change resave to true to ensure session is saved to store
    resave: true,
    saveUninitialized: false,
    // Enable rolling sessions - extends expiration on each request
    rolling: true,
    proxy: true,
    name: 'trailer.sid', // Custom cookie name for clarity
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      // Improve path specificity to reduce cookie size
      path: '/'
    }
  })
);

app.use((req, res, next) => {
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database with seed data
  await storage.seedInitialDataIfNeeded();
  await seedLearningModules();

  // Skip admin user creation for now since there's a schema mismatch
  console.log("Skipping automatic admin user creation due to schema issues.");

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.APP_PORT || "5000");
  const host = "0.0.0.0";
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    log(`Server is ready`);
    log(`serving http://${host}:${port}`);
  });
})();
