import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import serverless from "serverless-http";

// Track initialization state to avoid duplicate initialization
let initializationPromise: Promise<void> | null = null;
let routesRegistered = false;

let __filename = "";
let __dirname = "";
try {
  // ESM environment
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch {
  // CommonJS fallback (Node provides globals)
  // @ts-ignore
  __filename = typeof __filename !== "undefined" ? __filename : "";
  // @ts-ignore
  __dirname = typeof __dirname !== "undefined" ? __dirname : "";
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security headers
app.use(helmet());

// Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  express.json({
    verify: (req, _res, buf) => {
      // retain raw body for any webhook verifications
      // attach to request as rawBody
      // @ts-ignore
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Initialize routes, vite, static serving on first request (lazy init)
// This avoids blocking serverless handler export.
async function initializeApp() {
  if (routesRegistered) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      // Dynamically import routes with fallback to .js extension for Vercel
      let registerRoutes: typeof import("./routes").registerRoutes;
      if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
        try {
          // @ts-ignore
          const mod = await import("./routes.js");
          registerRoutes = mod.registerRoutes;
        } catch {
          // @ts-ignore
          const mod = await import("./routes");
          registerRoutes = mod.registerRoutes;
        }
      } else {
        // @ts-ignore
        const mod = await import("./routes");
        registerRoutes = mod.registerRoutes;
      }

      // Register routes
      await registerRoutes(app);

      // Setup static serving in production
      if (process.env.NODE_ENV === "production") {
        try {
          let serveStatic: typeof import("./static").serveStatic | undefined;
          if (process.env.VERCEL === "1") {
            try {
              // @ts-ignore
              const s = await import("./static.js");
              serveStatic = s.serveStatic;
            } catch {
              // @ts-ignore
              const s = await import("./static");
              serveStatic = s.serveStatic;
            }
          } else {
            // @ts-ignore
            const s = await import("./static");
            serveStatic = s.serveStatic;
          }

          const distPath = path.resolve(__dirname, "public");
          if (serveStatic && fs.existsSync(distPath)) {
            serveStatic(app);
          }
        } catch (err) {
          log(`Could not load static: ${(err as Error).message}`, "express");
        }
      } else if (process.env.SKIP_VITE !== "true") {
        // Setup Vite in dev (non-blocking)
        try {
          const { setupVite } = await import("./vite");
          await setupVite(httpServer, app);
        } catch (err) {
          log(`Vite dev middleware failed: ${(err as Error).message}. Falling back.`, "express");
        }
      }

      // Add fallback catch-all handler if Vite didn't load
      if (process.env.SKIP_VITE === "true" || process.env.NODE_ENV === "production") {
        app.use((_req, res) => {
          res.set({ "Content-Type": "text/html" }).status(200).end(
            `<!doctype html><html><head><meta charset="utf-8"><title>Backend</title></head><body><h1>Backend API</h1></body></html>`,
          );
        });
      }

      // Error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err?.status || err?.statusCode || 500;
        const message = err?.message || "Internal Server Error";
        console.error("[ERROR]", err);
        res.status(status).json({ message });
      });

      routesRegistered = true;
      log("App initialized", "express");
    } catch (err) {
      console.error("Fatal error during app init:", err);
      throw err;
    }
  })();

  await initializationPromise;
}

// Middleware to lazily initialize app on first request
app.use(async (req, res, next) => {
  try {
    await initializeApp();
    next();
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize app" });
  }
});

// Request logging middleware (after lazy init middleware)
app.use((req, res, next) => {
  const start = Date.now();
  const routePath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (routePath.startsWith("/api")) {
      let logLine = `${req.method} ${routePath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Standalone server mode (for local development)
const runStandalone = process.env.RUN_STANDALONE === "true" || process.env.VERCEL !== "1";
if (runStandalone) {
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
}

// Export serverless handler for Vercel (this exports immediately, no await)
const exported = serverless(app as any);
// eslint-disable-next-line import/no-default-export
export default exported;
