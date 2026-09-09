import { Pipeline } from "@anvia/core/pipeline";

import z from "zod";
import { Studio } from "@anvia/studio";
import { generateQueries } from "./services.js";

const CompanyInputSchema = z.object({
  companyName: z.string(),
});

const getCompanyData = new Pipeline({
  id: "get-company-data",
  inputSchema: CompanyInputSchema,
}).step({
  id: "generate-queries",
  run: async (context) => {
    const companyName = context.input.companyName;
    const queries = await generateQueries(companyName);
    return queries;
  },
});
//   .step({
//     id: "summarize",
//     run: async (context) => {
//       return `Summary of ${context.input}`;
//     },
//   });

new Studio([getCompanyData]).start();
