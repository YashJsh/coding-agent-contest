import http from "http";
import { pendingResponses, resolveEngineResponse } from "./tools";
import { callLLM } from "./agent";

export let clients : any;

const server = http.createServer(async (req, res) => {

    if (req.method == "POST" && req.url == "/sse") {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        clients = res;
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        })
        req.on("end", ()=>{
           const parsedBody = JSON.parse(body);
           console.log("Parsed Body is : ", parsedBody);
           callLLM(parsedBody.prompt);
           res.write(`Response end\n`)
        })
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
            console.log("Answer recieved is : ",answer);
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
