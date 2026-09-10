import { generateCompletion } from "@anvia/core";
import { model } from "./model.js";

export async function generateReview(idea: string, instructions: string) {
  const result = await generateCompletion({
    model: model,
    instructions,
    prompt: `User idea: ${idea}`,
  });

  return result.output;
}

export const BUSINESS_ANALYST_INSTRUCTION = `
You are an expert that able to review a startup idea from business prespective`;

export const PRODUCT_ANALYST_INSTRUCTION = `
You are an expert that able to review a startup idea from product prespective`;

export const MARKET_ANALYST_INSTRUCTION = `
You are an expert that able to review a startup idea from market prespective`;

export const FINAL_REVIEW_INSTRUCTION = `
You are a CEO that getting review from business, product, and market analyst, your task is to give final review based on the three reviews. Your task is to give review base on your expertise and add following information:

- Is this idea good to build?
- Need more Review?
- Give 3 suggestions what user need to do about the idea
- Include summary of the three reviews/ perspective
`;
