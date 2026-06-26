import { client } from "./agent";
import { exec } from "child_process";
import { clients } from ".";
import fs from "fs/promises";
import { SubAgentPrompt } from "./subAgentPrompt";

interface PendingResponse {
  resolve: (response: string) => void;
  reject: (error: Error) => void;
}

export const pendingResponses = new Map<string, PendingResponse>();

const waitForResponse = (correlationId: string) => {
  return new Promise((resolve, reject) => {
    pendingResponses.set(correlationId, {
      resolve,
      reject,
    });
  });
};

export const resolveEngineResponse = (
  correlationId: string,
  response: string,
) => {
  const pending = pendingResponses.get(correlationId);
  if (!pending) return;

  pendingResponses.delete(correlationId);
  pending.resolve(response);
};

export const writeTodo = async (prompt: string) => {
  const localMessages: any = [
    {
      role: "system",
      content: `
          You are an smart agent who is excelled in chunking a task into todos, so it will be good for the others to work on.
          You return todos only.
      `,
    },
  ];
  localMessages.push({
    role: "user",
    content: prompt,
  });
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: localMessages,
  });
  return response.choices[0]?.message.content || "";
};

export const subAgentSpawning = async (task: string, description: string) => {
  console.log("[subAgent]:Starting")
  console.log("[subAgent Task]:", task);
  const messages: any = [
    {
      role: "system",
      content: SubAgentPrompt,
    },
    {
      role: "user",
      content: `Task: ${task}\nDescription: ${description}`,
    },
  ];
  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "bash_tool",
            description: "This tool runs a bash command and returns the result.",
            parameters: {
              type: "object",
              properties: {
                command: {
                  type: "string",
                  description: "The bash command to run",
                },
              },
              required: ["command"],
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
      ],
    });

    const choices = response.choices[0];
    if (!choices) {
      return "No choices";
    }
    if (choices.message) {
      messages.push(choices.message);
    }
    console.log("[subAgent response]:", choices.message.content, choices.message.tool_calls);
    
    if (choices.finish_reason == "stop") {
      return choices.message.content || "Finish reason was stop";
    }
    if (choices.finish_reason == "tool_calls") {
      const toolCalls = choices.message.tool_calls;
      if (!toolCalls) {
        return "No tool calls";
      }
      for (const tool of toolCalls) {
        if (tool.function.name == "read_file") {
          const args = JSON.parse(tool.function.arguments);
          const response = await readCommand(args.path);
          messages.push({
            role: "tool",
            tool_call_id: tool.id,
            content: response,
          });
        }
        if (tool.function.name == "write_file") {
          const args = JSON.parse(tool.function.arguments);
          const response = await writeCommand(args.path, args.content);
          messages.push({
            role: "tool",
            tool_call_id: tool.id,
            content: response,
          });
        }
        if (tool.function.name === "bash_tool") {
          const args = JSON.parse(tool.function.arguments);
          const result = await bashCommand(args.command);
          console.log("Result is : ", result);
          messages.push({
            role: "tool",
            tool_call_id: tool.id,
            content: result,
          });
        }
      }
    }
  }
};

export const writeCommand = async (path: string, content: string) => {
  try {
    await fs.writeFile(path, content);
    return "success";
  } catch (error: any) {
    return `error: ${error?.message ?? "unknown error"}`;
  }
};

export const readCommand = async (path: string) => {
  const result = await fs.readFile(path, "utf-8");
  return result;
};

export const bashCommand = (command: string) => {
  return new Promise<string>((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve(
        JSON.stringify({
          command,
          success: !error,
          exitCode: error?.code ?? 0,
          stdout,
          stderr,
          error: error?.message ?? null,
        }),
      );
    });
  });
};

export const askQuestions = async (question: string) => {
  const correlationId = crypto.randomUUID();
  clients.write(
    `event: connected\n` +
      `data: ${JSON.stringify({
        correlationId,
        question,
      })}\n\n`,
  );
  const response = await waitForResponse(correlationId);
  console.log("Recieved response is : ", response);
  return response as string;
};
