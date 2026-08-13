import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `DrishtiX running on http://localhost:${env.PORT}`
  );
});

function gracefulShutdown(signal: string) {
  console.log(`${signal} received. Starting graceful shutdown`);

  server.close((error) => {
    if (error) {
      console.error("Error during HTTP server shutdown:", error);
      process.exit(1);
    }

    console.log("HTTP server closed.");

    process.exit(0);
  });
}

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});