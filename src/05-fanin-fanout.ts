import { generateCompletion } from "@anvia/core";
import { model } from "./model.js";
import z, { input } from "zod";
import { Pipeline } from "@anvia/core/pipeline";
import { BUSINESS_ANALYST_INSTRUCTION, FINAL_REVIEW_INSTRUCTION, generateReview, MARKET_ANALYST_INSTRUCTION, PRODUCT_ANALYST_INSTRUCTION } from "./services2.js";

const InputSchema = z.object({
  idea: z.string(),
});

const fanInFanOutPipeline = new Pipeline({
  id: "get-company-data",
  inputSchema: InputSchema,
})
  .step({
    id: "generate-review",
    run: async (context) => {
      const businessAnalystReview = await generateReview(context.input.idea, BUSINESS_ANALYST_INSTRUCTION);
      const productAnalystReview = await generateReview(context.input.idea, PRODUCT_ANALYST_INSTRUCTION);
      const marketAnalystReview = await generateReview(context.input.idea, MARKET_ANALYST_INSTRUCTION);

      return {
        businessAnalystReview,
        productAnalystReview,
        marketAnalystReview,
      };
    },
  })
  .step({
    id: "final-review",
    run: async (context) => {
      const PERSPECTIVE_REVIEWS = `Result from Business Analyst:
      <business-analyst-review>
      ${context.input.businessAnalystReview}
      </business-analyst-review>
      
      Result from Product Analyst:
      <product-analyst-review>
      ${context.input.productAnalystReview}
      </product-analyst-review>
      
      Result from Market Analyst:
      <market-analyst-review>
      ${context.input.marketAnalystReview}
      </market-analyst-review>
      `;

      const finalReview = await generateReview(PERSPECTIVE_REVIEWS, FINAL_REVIEW_INSTRUCTION);

      return finalReview;
    },
  });

const result = await fanInFanOutPipeline.run({
  input: {
    idea: "I want to build a new social media platform for pet lovers",
  },
});

console.log(result);
