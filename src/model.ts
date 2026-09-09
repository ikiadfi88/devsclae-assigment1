import { OpenAIClient } from "@anvia/openai";
import "dotenv/config";

const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY!,
  baseUrl: process.env.OPENAI_API_BASE_URL,
});

export const model = client.completionModel({
  modelId: "gpt-5.6-luna",
  api: "chat",
});

export function getModel(modelId: string) {
  return client.completionModel({
    modelId,
    api: "chat",
  });
}
