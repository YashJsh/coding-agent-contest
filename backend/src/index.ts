import { createServer } from 'https';
import { WebSocketServer } from 'ws';
import { callLLM } from './agent';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    const parsedData = JSON.parse(data.toString());
    if (parsedData.type == "create_project") {
      const llm = callLLM(parsedData.value, ws);
    }
  });
});

server.listen(8080);