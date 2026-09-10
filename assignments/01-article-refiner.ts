import { Pipeline } from "@anvia/core/pipeline";
import { generateCompletion } from "@anvia/core";
import { model } from "../src/model.js";
import z from "zod";

const ArticleInputSchema = z.object({
  article: z.string(),
});

const DraftOutputSchema = z.object({
  draft: z.string(),
});

const CritiqueOutputSchema = z.object({
  draft: z.string(),
  critique: z.string(),
});

const RewriteOutputSchema = z.object({
  draft: z.string(),
  critique: z.string(),
  rewrittenArticle: z.string(),
});

const DRAFT_INSTRUCTION = `
You are an expert article writer. Your task is to create a well-structured draft based on the input article.
Focus on improving clarity, structure, and flow while maintaining the original meaning.
`;

const CRITIQUE_INSTRUCTION = `
You are an expert editor. Your task is to critique the provided draft article.
Identify issues with:
- Clarity and readability
- Structure and organization
- Tone and style
- Factual accuracy concerns
- Missing information or gaps

Provide specific, actionable feedback.
`;

const REWRITE_INSTRUCTION = `
You are an expert article writer. Your task is to rewrite the article using the draft and the critique.
Incorporate all the feedback from the critique to produce a polished, improved final article.
`;

const articleRefinerPipeline = new Pipeline({
  id: "article-refiner",
  inputSchema: ArticleInputSchema,
})
  .step({
    id: "draft",
    run: async (context) => {
      const result = await generateCompletion({
        model,
        instructions: DRAFT_INSTRUCTION,
        prompt: `Original article:\n${context.input.article}`,
        outputSchema: DraftOutputSchema,
      });
      return result.output;
    },
  })
  .step({
    id: "critique",
    run: async (context) => {
      const result = await generateCompletion({
        model,
        instructions: CRITIQUE_INSTRUCTION,
        prompt: `Draft to critique:\n${context.input.draft}`,
        outputSchema: CritiqueOutputSchema,
      });
      return result.output;
    },
  })
  .step({
    id: "rewrite",
    run: async (context) => {
      const result = await generateCompletion({
        model,
        instructions: REWRITE_INSTRUCTION,
        prompt: `Draft:\n${context.input.draft}\n\nCritique:\n${context.input.critique}`,
        outputSchema: RewriteOutputSchema,
      });
      return result.output;
    },
  });

const sampleArticle = `
AI is changing everything. Companies are using it for everything from customer service to coding. 
Some people are worried about jobs. Others are excited about new opportunities. 
The technology is moving fast. It's hard to keep up. 
We need to think about ethics and regulation. But we also need to embrace innovation.
`;

const result = await articleRefinerPipeline.run({
  input: {
    article: sampleArticle,
  },
});

console.log("=== ARTICLE REFINER RESULT ===");
console.log("\n--- FINAL REWRITTEN ARTICLE ---");
console.log(result.output.rewrittenArticle);
console.log("\n--- CRITIQUE ---");
console.log(result.output.critique);
console.log("\n--- ORIGINAL DRAFT ---");
console.log(result.output.draft);
