import { type Express } from "express";
import * as vite from "vite";
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
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const viteServer = await vite.createServer({
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
