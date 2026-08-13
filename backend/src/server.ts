import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./config/database.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `DrishtiX running on http://localhost:${env.PORT}`
  );
});

async function gracefulShutdown(signal: string) {
  console.log(
    `${signal} received. Starting graceful shutdown...`
  );

  server.close(async (error) => {
    if (error) {
      console.error(
        "Error closing HTTP server:",
        error
      );

      process.exit(1);
    }

    try {
      await db.end();

      console.log("PostgreSQL pool closed.");
      console.log("HTTP server closed.");

      process.exit(0);
    } catch (error) {
      console.error(
        "Error during graceful shutdown:",
        error
      );

      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});