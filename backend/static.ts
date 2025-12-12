import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use((_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
