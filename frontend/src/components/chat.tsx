"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import ChatMessage from "./chatmessage";

export default function Chat({ messages, connection, setMessages }: {
    messages: {
        role: string,
        content: string
    }[], connection: WebSocket, setMessages: Dispatch<
        SetStateAction<
            {
                role: string;
                content: string;
            }[]
        >
    >;

}) {
    const [userMessage, setSendMessage] = useState("");
    const sendMessage = (message: string) => {
        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: message,
            },
        ]);

        connection.send(
            JSON.stringify({
                type: "user_message",
                data: message,
            })
        );
    };
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <ChatMessage
                        role={message.role}
                        content={message.content}
                    />
                ))}
            </div>

            <div className="border-t p-4">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full border px-3 py-2"

                    onChange={(e) => {
                        setSendMessage(e.target.value);
                    }}
                />
                <button onClick={() => {
                    sendMessage(userMessage)
                }}>
                    Send
                </button>
            </div>
        </div>
    );
}
