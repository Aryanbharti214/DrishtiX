import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  AI_SERVICE_URL: z
    .string()
    .url("AI_SERVICE_URL must be a valid URL"),

  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");

  console.error(
    result.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env = result.data;