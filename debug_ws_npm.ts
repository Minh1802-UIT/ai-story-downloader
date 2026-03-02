import WebSocket from "npm:ws";
// import { v4 as uuidv4 } from "npm:uuid"; // Simplify

const EDGE_TTS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4-EA85-431F-A736-25C4E23C855C";


function createRequestId() {
    return crypto.randomUUID().replace(/-/g, "");
}

function getXTime() {
    return new Date().toISOString();
}

async function testNpmWs() {
    console.log("Testing npm:ws with Headers...");
    
    const ws = new WebSocket(EDGE_TTS_URL, {
        headers: {
            "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        }
    });

    return new Promise((resolve, reject) => {
        ws.on('open', () => {
            console.log("WS Connected (npm:ws)!");
            
            // 2. Send Config
            const configMsg = `X-Timestamp:${getXTime()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
            ws.send(configMsg);
            
            // 3. Send SSML
            const requestId = createRequestId();
            const text = "Kết nối thành công qua npm ws.";
            const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='vi-VN'><voice name='vi-VN-NamMinhNeural'><prosody pitch='+0Hz' rate='+0%'>${text}</prosody></voice></speak>`;
            
            const ssmlMsg = `X-Timestamp:${getXTime()}\r\nX-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
            ws.send(ssmlMsg);
        });
        
        ws.on('message', (data: any, isBinary: boolean) => {
            if (!isBinary) {
                const text = data.toString();
                // console.log("Text:", text);
                if (text.includes("Path:turn.end")) {
                    console.log("End detected.");
                    ws.close();
                    resolve(true);
                }
            } else {
                process.stdout.write(".");
            }
        });
        
        ws.on('error', (e: any) => {
            console.error("WS Error:", e);
            reject(e);
        });
        
        ws.on('close', () => {
            console.log("\nWS Closed.");
        });
    });
}

testNpmWs().catch(console.error);
