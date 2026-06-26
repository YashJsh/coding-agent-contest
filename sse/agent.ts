import OpenAI from "openai";
import {
  askQuestions,
  writeTodo,
  subAgentSpawning,
} from "./tools";
import { SYSTEM_PROMPT } from "./prompt";
import { clients } from ".";

export const client = new OpenAI();

export const callLLM = async (prompt: string) => {
  console.log("Reached LLM");
  const messages: any = [];
  messages.push({
    role: "system",
    content: SYSTEM_PROMPT,
  });

  messages.push({
    role: "user",
    content: prompt,
  });

  console.log(messages);

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "sub_agent",
            description:
              "You can use this tool to execute a sub-agent who can do specific work for you.",
            parameters: {
              type: "object",
              properties: {
                task: {
                  type: "string",
                  description: "The task to execute",
                },
                description: {
                  type: "string",
                  description : "The detailed description of the task to execute."
                }
              },
              required: ["task", "description"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "ask_questions",
            description:
              "This tool asks the questions to the user for the project to get the better understanding.",
            parameters: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description: "The question we want to ask the user",
                },
              },
              required: ["question"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "create_todo",
            description:
              "This creates a todo according to the query for planning.",
            parameters: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The prompt to create todo from",
                },
              },
              required: ["prompt"],
            },
          },
        },
      ],
    });
    const choice = response.choices[0];
    if (!choice) break;

    const message = choice.message;
    if (message) {
      messages.push(message);
    }
    console.log(
        "[Assistant]:",
        message.content,
        message.tool_calls
    );
    if (choice.finish_reason === "stop") {
      clients.end("message.content")
      return message.content;
    }
    if (choice.finish_reason === "tool_calls") {
      const toolResult = await Promise.all(
        (message.tool_calls ?? []).map(async (toolCall) => {
          if (toolCall.function.name === "sub_agent") {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await subAgentSpawning(args.task, args.description);
            return {
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            };
          }
          if (toolCall.function.name === "ask_questions") {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await askQuestions(args.question);
            console.log("Result is : ", result);
            return {
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            };
          }
          if (toolCall.function.name === "create_todo") {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await writeTodo(args.prompt);
            console.log("Result is : ", result);
            return {
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            };
          }
        }),
      );
      messages.push(...toolResult);
    }
  }
};
