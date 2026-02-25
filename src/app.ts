import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { env } from "./config.js";
import { registerGenerateDeckRoute } from "./routes/generateDeck.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    },
    bodyLimit: 3 * 1024 * 1024
  });

  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 2 * 1024 * 1024,
      fieldNameSize: 100,
      fields: 5
    }
  });

  await registerGenerateDeckRoute(app);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
