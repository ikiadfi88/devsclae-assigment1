import { generateCompletion } from "@anvia/core";
import { model } from "./model.js";
import z from "zod";
import { searchWeb } from "./services.js";

const RoutingSchema = z.object({
  category: z.enum(["direct", "need-realtime-data"]),
  reason: z.string(),
  confidenceScore: z.number(),
});

const CLASSIFICATION_INSTRUCTION = `
Your task is to classify the user request to be following:
- need realtime data
- can be answer directly from your knowledge
- general

<guidelines>
- If you are not sure, please choose general.
- Include the reason and confidenceScore between 0 to 1.
</guidelines>
`;

const userRequest = "Can you get me news about politics in Indonesia today?";

const classifyResult = await generateCompletion({
  model,
  instructions: CLASSIFICATION_INSTRUCTION,
  prompt: `User Request: ${userRequest}`,
  outputSchema: RoutingSchema,
});

console.log(classifyResult.output);

if (classifyResult.output.category === "need-realtime-data") {
  const webSearchResult = await searchWeb(userRequest);

  const SYSTEM_INSTRUCTION = `
  answer the user input based on the following context:
  
  <search-web-result>
  ${JSON.stringify(webSearchResult)}
  </search-web-result>
  `;

  const result = await generateCompletion({
    model,
    instructions: SYSTEM_INSTRUCTION,
    prompt: userRequest,
  });
  console.log(result.output);
} else {
  const result = await generateCompletion({
    model,
    instructions: "Answer the user input base on your knowledge",
    prompt: userRequest,
  });

  console.log(result.output);
}
