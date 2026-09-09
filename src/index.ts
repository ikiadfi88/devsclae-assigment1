import { streamCompletion, type Message } from "@anvia/core";
import { getModel, model } from "./model.js";
import { input, select } from "@inquirer/prompts";

//Memory
const messages: Message[] = [
  {
    role: "system",
    content: "You are a helpful assistant",
  },
];

const selectModel = await select({
  message: "Select a model",
  choices: [
    { name: "GPT 5.6 Luna", value: "gpt-5.6-luna" },
    { name: "Gemini 3.7 Flash", value: "gemini-3.7-flash" },
  ],
});

while (true) {
  const userInput = await input({ message: "Enter your input: " });
  if (userInput === "exit") {
    console.log(messages);
    break;
  }

  messages.push({ role: "user", content: userInput });

  const response = streamCompletion({
    model: getModel(selectModel),
    messages: messages,
  });

  console.log("Assistant: ");
  let assistantMessage = "";
  for await (const chunk of response) {
    if (chunk.type === "reasoning_delta") {
      process.stdout.write(chunk.delta);
    }

    if (chunk.type === "text_delta") {
      process.stdout.write(chunk.delta);
      assistantMessage += chunk.delta;
    }
  }

  messages.push({ role: "assistant", content: assistantMessage });
  console.log("\n");
}
