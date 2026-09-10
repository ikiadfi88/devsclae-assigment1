import { Pipeline } from "@anvia/core/pipeline";
import { generateCompletion } from "@anvia/core";
import { model } from "../src/model.js";
import z from "zod";

const PitchInputSchema = z.object({
  pitch: z.string(),
});

const ReviewOutputSchema = z.object({
  review: z.string(),
});

const MergedOutputSchema = z.object({
  ceoReview: z.string(),
  analystReview: z.string(),
  ctoReview: z.string(),
  mergedVerdict: z.string(),
});

const CEO_INSTRUCTION = `
You are a CEO reviewing a startup pitch. Evaluate from a business perspective:
- Market fit: Does this solve a real problem for a large enough market?
- Business model: How will this make money? Is the model sustainable?
- Revenue/business potential: What's the revenue potential? Scalability?
- Competitive advantage: What makes this defensible?

Provide a concise but thorough review.
`;

const ANALYST_INSTRUCTION = `
You are a Market Analyst reviewing a startup pitch. Evaluate from an analytical perspective:
- Market/economics: Market size, growth trends, TAM/SAM/SOM
- Risks: Key risks (market, execution, regulatory, competitive)
- Assumptions: What assumptions is the pitch making? Are they valid?
- Financial projections: Are they realistic?

Provide a concise but thorough review.
`;

const CTO_INSTRUCTION = `
You are a CTO reviewing a startup pitch. Evaluate from a technical perspective:
- Technical feasibility: Can this be built with current technology?
- Engineering complexity: How complex is the implementation? Technical debt risks?
- Technology/stack considerations: What stack would you recommend? Scalability concerns?
- Team technical requirements: What technical talent is needed?

Provide a concise but thorough review.
`;

const MERGE_INSTRUCTION = `
You are a Board Chair synthesizing reviews from CEO, Analyst, and CTO perspectives.
Your task is to create a single merged verdict that:
1. Summarizes the key points from each perspective
2. Identifies areas of agreement and disagreement
3. Provides a final recommendation: PROCEED / PROCEED WITH CONDITIONS / REVISE / REJECT
4. Lists top 3 action items for the founders

Be decisive and actionable.
`;

const ceoPipeline = new Pipeline({
  id: "ceo-review",
  inputSchema: PitchInputSchema,
}).step({
  id: "ceo-review-step",
  run: async (context) => {
    const result = await generateCompletion({
      model,
      instructions: CEO_INSTRUCTION,
      prompt: `Startup pitch:\n${context.input.pitch}`,
      outputSchema: ReviewOutputSchema,
    });
    return result.output;
  },
});

const analystPipeline = new Pipeline({
  id: "analyst-review",
  inputSchema: PitchInputSchema,
}).step({
  id: "analyst-review-step",
  run: async (context) => {
    const result = await generateCompletion({
      model,
      instructions: ANALYST_INSTRUCTION,
      prompt: `Startup pitch:\n${context.input.pitch}`,
      outputSchema: ReviewOutputSchema,
    });
    return result.output;
  },
});

const ctoPipeline = new Pipeline({
  id: "cto-review",
  inputSchema: PitchInputSchema,
}).step({
  id: "cto-review-step",
  run: async (context) => {
    const result = await generateCompletion({
      model,
      instructions: CTO_INSTRUCTION,
      prompt: `Startup pitch:\n${context.input.pitch}`,
      outputSchema: ReviewOutputSchema,
    });
    return result.output;
  },
});

const ideaReviewBoardPipeline = new Pipeline({
  id: "idea-review-board",
  inputSchema: PitchInputSchema,
})
  .parallel({
    id: "perspectives",
    branches: {
      ceo: ceoPipeline,
      analyst: analystPipeline,
      cto: ctoPipeline,
    },
  })
  .step({
    id: "merge",
    run: async (context) => {
      const result = await generateCompletion({
        model,
        instructions: MERGE_INSTRUCTION,
        prompt: `CEO Review:\n${context.input.ceo.review}\n\nAnalyst Review:\n${context.input.analyst.review}\n\nCTO Review:\n${context.input.cto.review}`,
        outputSchema: MergedOutputSchema,
      });
      return result.output;
    },
  });

const samplePitch = `
We're building "PetMatch" - a Tinder-like app for pet adoption. 
Users swipe through pets from local shelters, match with ones they like, 
and can schedule meet-and-greets. We'll monetize through premium subscriptions 
for advanced filters, video calls with shelters, and a marketplace for pet supplies.
The pet care market is $100B+ in the US alone. We have 3 shelter partners 
lined up for pilot and a waitlist of 500 users. Tech stack: React Native, Node.js, PostgreSQL.
`;

const result = await ideaReviewBoardPipeline.run({
  input: {
    pitch: samplePitch,
  },
});

console.log("=== IDEA REVIEW BOARD RESULT ===");
console.log("\n--- CEO REVIEW ---");
console.log(result.output.ceoReview);
console.log("\n--- ANALYST REVIEW ---");
console.log(result.output.analystReview);
console.log("\n--- CTO REVIEW ---");
console.log(result.output.ctoReview);
console.log("\n--- MERGED VERDICT ---");
console.log(result.output.mergedVerdict);
