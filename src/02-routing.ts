import { generateCompletion } from "@anvia/core";
import { model } from "./model.js";
import z from "zod";

const RoutingSchema = z.object({
  category: z.enum(["billing", "technical", "general"]),
  reason: z.string(),
  confidenceScore: z.number(),
});

const CLASSIFICATION_INSTRUCTION = `
Your task is to classify the user request to be following:
- billing
- technical
- general

<guidelines>
- If you are not sure, please choose general.
- Include the reason and confidenceScore between 0 to 1.
</guidelines>
`;

const userRequest = "Why my Microwave is not working, its not even getting on";

const classifyResult = await generateCompletion({
  model,
  instructions: CLASSIFICATION_INSTRUCTION,
  prompt: `User Request: ${userRequest}`,
  outputSchema: RoutingSchema,
});

const BILLING_SYSTEM_INSTRUCTION = `
You are a billing assistant for a shop called "Jaya Electronics".

<context>
- If user asking to get refund, please ask them to write email to csjayaelectronics@gmail.com
- If user asking to get invoice, please ask them to contact whatsapp number +628123456789
</context>
`;

if (classifyResult.output.category === "billing") {
  const result = await generateCompletion({
    model,
    instructions: BILLING_SYSTEM_INSTRUCTION,
    prompt: userRequest,
  });

  console.log(result.output);
}
