import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import serverless from "serverless-http";

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

      log(logLine);
    }
  });

  next();
});

await registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";
  console.error("[ERROR]", err);
  res.status(status).json({ message });
});

// importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // You can set SKIP_VITE=true to bypass vite (useful if vite fails at runtime).
  const skipVite = process.env.SKIP_VITE === "true";
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "public");
    if (fs.existsSync(distPath)) {
      serveStatic(app);
    } else {
      log(`No static build found at ${distPath}; skipping static file serving`, "express");
    }
  } else if (!skipVite) {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    } catch (err) {
      log(`Vite dev middleware failed to start: ${(err as Error).message}. Falling back.`, "express");
    }
  } else {
    // In some dev environments Vite may not initialize correctly. When SKIP_VITE
    // is set we fall back to serving a simple placeholder HTML page so the API
    // remains available for development and testing.
    app.use((_req, res) => {
      res.set({ "Content-Type": "text/html" }).status(200).end(
        `<!doctype html><html><head><meta charset="utf-8"><title>Backend</title></head><body><h1>Backend running (Vite skipped)</h1></body></html>`,
      );
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // If this process is running as a standalone server (development)
  // or if explicitly requested via RUN_STANDALONE=true, start listening.
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

  // Export a serverless handler for platforms like Vercel
  // so Vercel can import this module and receive the handler.
  // @ts-ignore
  const exported = serverless(app as any);
  // default export for serverless platforms
  // eslint-disable-next-line import/no-default-export
  export default exported;
