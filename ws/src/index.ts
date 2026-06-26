import { createServer } from "http";
import { WebSocketServer } from "ws";
import { callLLM } from "./agent";
import type { WebSocket } from "ws";

const server = createServer();
const wss = new WebSocketServer({ server });

const room = new Map<string, WebSocket>();

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", function message(data) {
    const parsedData = JSON.parse(data.toString());
    if (parsedData.type == "create_room") {
      const roomId = crypto.randomUUID();
      room.set(roomId, ws);
      ws.send(JSON.stringify({ type: "room_created", roomId }));
    }
    if (parsedData.type == "join_room") {
      const roomId = parsedData.roomId;
      room.set(roomId, ws);
      ws.send(JSON.stringify({ type: "room_joined", roomId }));
    }
    if (parsedData.type == "create_project") {
      const roomId = parsedData.roomId;
      if (!room.has(roomId)) {
        ws.send(JSON.stringify({ type: "room_not_found", roomId }));
        return;
      }
      const llm = callLLM(parsedData.value, ws);
      return;
    }
  });
});

server.listen(8080);
