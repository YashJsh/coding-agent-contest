import OpenAI from "openai";
import { askQuestions, writeTodo, bashCommand } from "./tools";
import { WebSocket } from "ws";
import { SYSTEM_PROMPT } from "./prompt";

export const client = new OpenAI();
const messages: any = [];

export const callLLM = async (prompt: string, socket : WebSocket) => {
    messages.push(
    {
        role : "system", 
        content : SYSTEM_PROMPT
    },
        {
        role: "user",
        content: prompt
    });

    while (true) {
        const response = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: messages,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "bash_tool",
                        description: "This tool helps in implementing command, it is a bash tool",
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
                        description: "This tool asks the questions to the user for the project to get the better understanding.",
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
                        name: "create_todo",
                        description: "This creates a todo according to the query for planning.",
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
                }
            ]
        });
        const choice = response.choices[0];
        if (!choice) break;

        const message = choice.message;
        socket.send(JSON.stringify({
            type : "message",
            data : message
        }));

        if (message) {
            messages.push(message);
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
            }
        }
    }
}