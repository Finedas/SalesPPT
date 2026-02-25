import { buildApp } from "./app.js";
import { env } from "./config.js";

const app = await buildApp();

app.listen({ port: env.PORT, host: "0.0.0.0" })
  .then((address) => {
    app.log.info({ address }, "Sales deck backend started");
  })
  .catch((error) => {
    app.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  });
