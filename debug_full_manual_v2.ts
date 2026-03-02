import WebSocket from "npm:ws";
import { Buffer } from "node:buffer";

// Constants from MsEdgeTTS.js
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WSS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const SEC_MS_GEC_VERSION = "1-143.0.3650.96";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";

async function generateSecMsGec(trustedClientToken: string) {
    const ticks = Math.floor(Date.now() / 1000) + 11644473600;
    const rounded = ticks - (ticks % 300);
    const windowsTicks = rounded * 10000000;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${windowsTicks}${trustedClientToken}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

function createRequestId() {
    return crypto.randomUUID().replace(/-/g, "");
}

function getXTime() {
    return new Date().toISOString();
}

async function testFullManualV2() {
    console.log("Generating Security Token (Synced with MsEdgeTTS v2.0.3)...");
    const secMsGEC = await generateSecMsGec(TRUSTED_CLIENT_TOKEN);
    const req_id = createRequestId();
    const url = `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGEC}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${req_id}`;
    
    console.log("Connecting to:", url);
    
    const ws = new WebSocket(url, {
        headers: {
            "User-Agent": USER_AGENT,
            "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9"
        }
    });

    return new Promise((resolve, reject) => {
        ws.on('open', () => {
            console.log("WS Connected!");
            
            const configMsg = `X-Timestamp:${getXTime()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
            ws.send(configMsg);
            
            const requestId = createRequestId();
            const text = "Kết nối thành công phiên bản 2.";
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
    });
}

testFullManualV2().catch(console.error);
