import { client } from "./agent";
import { exec } from "child_process";
import { WebSocket, } from "ws";
import fs from "fs/promises";

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
};export const askQuestions = async (question: string, socket : WebSocket) => {
    socket.send(JSON.stringify({
        type : "question",
        value : question
    }));
    const answer = await waitForAnswer(socket);
    return answer as string;
}

export const waitForAnswer = (socket : WebSocket) =>{
    return new Promise((resolve)=>{
        socket.once("message", (data)=>{
            const parsedData = JSON.parse(data.toString());
            if (parsedData.type == "answer"){
                resolve(parsedData.value);
            }
        });
    })
}