import { client } from "./agent";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "node:url";
import { clients } from ".";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, "../../project");

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

const resolveEngineResponse = (correlationId: string, response: string) => {
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
    return response.choices[0]?.message.content;
}

export const getPath = () => {
    const getPath = exec("pwd");
    return getPath;
}

export const bashCommand = (command: string) => {
    const cmd = exec(command);
    return cmd;
}

export const askQuestions = async (question: string) => {
    const correlationId = crypto.randomUUID();
    clients.res.write(
        `event: connected\n` +
        `data: ${JSON.stringify({
            correlationId,
            question
        })}\n\n`
    );
    const response = await waitForResponse(correlationId);
    return response;
}
