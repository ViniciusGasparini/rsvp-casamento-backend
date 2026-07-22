import "dotenv/config";
import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

const port = Number(process.env.PORT) || 3000;

await connectDatabase();

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`API disponível na porta ${port}.`);
});

const shutdown = async (signal) => {
  console.log(`${signal} recebido. Encerrando a aplicação...`);

  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
