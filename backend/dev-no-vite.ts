import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

async function start() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  await registerRoutes(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => console.log(`dev-no-vite listening on ${port}`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
