import { type Express } from "express";
// import vite dynamically to avoid ESM/CJS interop issues at runtime
import { type Server } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import react from "@vitejs/plugin-react";

const viteLogger = {
  error: (msg: unknown, _options?: unknown) => {
    console.error(msg);
  },
  warn: (msg: unknown, _options?: unknown) => {
    console.warn(msg);
  },
  info: (msg: unknown, _options?: unknown) => {
    console.info(msg);
  },
  clear: () => {
    // no-op: keep console output stable in this environment
  },
};

let __filename = "";
let __dirname = "";
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch {
  // commonjs fallback
  // @ts-ignore
  __filename = typeof __filename !== 'undefined' ? __filename : '';
  // @ts-ignore
  __dirname = typeof __dirname !== 'undefined' ? __dirname : '';
}

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  // Create a minimal Vite config for the backend dev middleware instead of
  // importing the full frontend Vite config. This avoids pulling in
  // frontend-only plugins (e.g. Tailwind) into the backend's runtime.
  const viteDevConfig = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '..', 'frontend', 'src'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@assets': path.resolve(__dirname, '..', 'frontend', 'attached_assets'),
      },
    },
    root: path.resolve(__dirname, '..', 'frontend'),
  } as const;

  const viteModule = await import("vite");
  const createServerFn = (viteModule as any).createServer ?? (viteModule as any).default?.createServer;
  if (!createServerFn) {
    throw new Error('Could not locate Vite createServer function (interop failure)');
  }
  const viteServer = await createServerFn({
    ...viteDevConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(viteServer.middlewares);

  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, "..", "frontend", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await viteServer.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      viteServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
