import http from "http";
import { pendingResponses } from "./tools";

export let clients : {res : any };

const server = http.createServer(async (req, res) => {
    if (req.method == "POST" && req.url == "/sse") {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        clients.res = res;
        res.write(
            `event: connected\n`
        );
        res.on('close', () => {
            console.log(`Client disconnected.`);
        })
    }
    if (req.method == "POST" && req.url == "/answer") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        })
        req.on("end", () => {
            const parsedBody = JSON.parse(body);
            const answer = parsedBody.answer;
            const correlationId = parsedBody.correlationId;
            resolveEngineResponse(correlationId, answer);
            res.writeHead(200, {
                'content-type': "text/plain"
            })
            res.end("Answer recieved successfully")
        });
    }
});

server.listen(3000);

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

