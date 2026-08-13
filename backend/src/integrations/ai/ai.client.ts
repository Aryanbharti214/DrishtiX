import axios from "axios";

import { env } from "../../config/env.js";

const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 5000,
});

export async function checkAIServiceHealth() {
  const response = await aiClient.get("/health");

  return response.data;
}
