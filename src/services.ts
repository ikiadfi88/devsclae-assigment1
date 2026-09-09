import { generateCompletion } from "@anvia/core";
import { model } from "./model.js";
import z from "zod";

const QueriesSchema = z.object({
  queries: z.array(z.string()),
});

const GENERATE_QUERY_INSTRUCTION = `
You are an expert in company data research, your task is to generate 5 most important queries to get following data:

- Company Profile
- Financial Statement (Invest, Internal Statement)
- Company Employes
- Sectors
- Valuation
`;

export async function generateQueries(companyName: string) {
  const result = await generateCompletion({
    model,
    instructions: GENERATE_QUERY_INSTRUCTION,
    prompt: `Generate queries of : ${companyName}`,
    outputSchema: QueriesSchema,
  });

  return result.output;
}
