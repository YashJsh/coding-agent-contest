import OpenAI from "openai";
import { askQuestions, writeTodo, bashCommand, writeCommand, readCommand } from "./tools";
import { WebSocket } from "ws";
import { SYSTEM_PROMPT } from "./prompt";

export const client = new OpenAI();
const messages: any = [];

export const callLLM = async (prompt: string, socket: WebSocket) => {
  console.log("LLM Called with prompt : ", prompt);
  messages.push(
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: prompt,
    },
  );

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "bash_tool",
            description:
              "This tool helps in implementing command, it is a bash tool",
            parameters: {
              type: "object",
              properties: {
                command: {
                  type: "string",
                  description: "The command to execute",
                },
              },
              required: ["command"],
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
              required: ["question", "options"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "read_file",
            description: "This tool reads the content of a file.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The path to the file to read",
                },
              },
              required: ["path"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "write_file",
            description: "This tool writes the content to a file.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The path of the file to write",
                },
                content: {
                  type: "string",
                  description: "The content to write to the file",
                },
              },
              required: ["path", "content"],
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
    console.log("Assistant : ", message.content, message.tool_calls);
    socket.send(
      JSON.stringify({
        type: "message",
        data: message,
      }),
    );

    if (message) {
      messages.push(message);
      socket.send(JSON.stringify({
        data : message,
      }))
    }
    if (choice.finish_reason === "stop") {
      socket.send(JSON.stringify({
        data: message.content
      }));
      socket.close();
      return;
    }
    
    if (choice.finish_reason === "tool_calls") {
      for (const toolCall of message.tool_calls ?? []) {
        if (toolCall.function.name === "bash_tool") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await bashCommand(args.command);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        if (toolCall.function.name === "ask_questions") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await askQuestions(args.questions, socket);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        if (toolCall.function.name === "create_todo") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await writeTodo(args.prompt);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        if (toolCall.function.name === "read_file") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await readCommand(args.path);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        if (toolCall.function.name === "write_file") {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await writeCommand(args.path, args.content);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
      }
    }
  }
};
