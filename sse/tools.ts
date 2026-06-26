import { client } from "./agent";
import { exec } from "child_process";
import { clients } from ".";
import fs from "fs/promises";

interface PendingResponse {
    resolve: (response: string) => void;
    reject: (error: Error) => void;
}

export const pendingResponses = new Map<string, PendingResponse>();

const waitForResponse = (correlationId: string) => {
    return new Promise((resolve, reject) => {
        pendingResponses.set(correlationId, {
            resolve,
            reject
        })
    })
}

export const resolveEngineResponse = (correlationId: string, response: string) => {
    const pending = pendingResponses.get(correlationId);
    if (!pending) return;

    pendingResponses.delete(correlationId);
    pending.resolve(response)
}

const localMessages: any = [{
    role: "system",
    content: `
        You are an smart agent who is excelled in chunking a task into todos, so it will be good for the others to work on. 
        You return todos only.
    `
}];

export const writeTodo = async (prompt: string) => {
    localMessages.push({
        role: "user",
        content: prompt
    })
    const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: localMessages,
    });
    return response.choices[0]?.message.content || "";
}

export const writeCommand = async (path: string, content: string) => {
  try {
    await fs.writeFile(path, content);
    return "success";
  } catch (error: any) {
    return `error: ${error?.message ?? "unknown error"}`;
  }
}

export const readCommand = async (path: string) => {
  const result = await fs.readFile(path, "utf-8");
  return result;
}

export const bashCommand = (command: string) => {
    return new Promise<string>((resolve) => {
        exec(command, (error, stdout, stderr) => {
            resolve(JSON.stringify({
                command,
                success: !error,
                exitCode: error?.code ?? 0,
                stdout,
                stderr,
                error: error?.message ?? null,
            }));
        });
    });
};

export const askQuestions = async (question: string) => {
    const correlationId = crypto.randomUUID();
    clients.write(
        `event: connected\n` +
        `data: ${JSON.stringify({
            correlationId,
            question
        })}\n\n`
    );
    const response = await waitForResponse(correlationId);
    console.log("Recieved response is : ", response);
    return response as string;
}
