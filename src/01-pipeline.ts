import { Pipeline } from "@anvia/core/pipeline";

import z from "zod";
import { Studio } from "@anvia/studio";
import { generateQueries, searchWeb } from "./services.js";

const CompanyInputSchema = z.object({
  companyName: z.string(),
});

const getCompanyData = new Pipeline({
  id: "get-company-data",
  inputSchema: CompanyInputSchema,
})
  .step({
    id: "generate-queries",
    run: async (context) => {
      const companyName = context.input.companyName;
      const queries = await generateQueries(companyName);
      return queries;
    },
  })
  .step({
    id: "search-web",
    run: async (context) => {
      const queries = context.input.queries;
      const firstQuery = queries[0];
      if (!firstQuery) {
        return "Query is not found";
      }

      const searchResults = await searchWeb(firstQuery);
      return searchResults;
    },
  });

new Studio([getCompanyData]).start();
