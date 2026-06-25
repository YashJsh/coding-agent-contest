import { client } from "./agent";
import { exec } from "child_process";
import { WebSocket, } from "ws";
import path from "path";
import { fileURLToPath} from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, "../../project");

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

export const getPath  = () => {
    const getPath =  exec("pwd");
    return getPath;
}

export const bashCommand = (command : string)=>{
    const cmd = exec(command);
    return cmd;
}

export const askQuestions = async (question: string, socket : WebSocket) => {
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