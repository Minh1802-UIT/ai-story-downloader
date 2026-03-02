import { uuid } from "https://deno.land/x/uuid@v0.1.2/mod.ts";

const EDGE_TTS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4-EA85-431F-A736-25C4E23C855C";

function createRequestId() {
    return crypto.randomUUID().replace(/-/g, "");
}

function getXTime() {
    return new Date().toISOString();
}

async function testManualTTS() {
    console.log("Testing Manual WebSocket TTS...");
    
    // 1. Setup WebSocket
    const ws = new WebSocket(EDGE_TTS_URL);
    // Deno WebSocket doesn't support custom headers easily via standard API for WSS? 
    // Wait, Deno's WebSocket follows standard. Browser API doesn't allow headers.
    // However, Edge TTS usually works without strict headers if the Token is correct.
    // Let's try.
    
    const audioChunks: Uint8Array[] = [];
    
    return new Promise((resolve, reject) => {
        ws.onopen = () => {
            console.log("WS Connected!");
            
            // 2. Send Config
            const configMsg = `X-Timestamp:${getXTime()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
            ws.send(configMsg);
            
            // 3. Send SSML
            const requestId = createRequestId();
            const text = "Xin chào, đây là kiểm tra thủ công.";
            const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='vi-VN'><voice name='vi-VN-NamMinhNeural'><prosody pitch='+0Hz' rate='+0%'>${text}</prosody></voice></speak>`;
            
            const ssmlMsg = `X-Timestamp:${getXTime()}\r\nX-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
            ws.send(ssmlMsg);
        };
        
        ws.onmessage = async (event) => {
            if (typeof event.data === "string") {
                // console.log("Text Data:", event.data);
                if (event.data.includes("Path:turn.end")) {
                    console.log("End of stream detected.");
                    ws.close();
                    resolve(audioChunks);
                }
            } else if (event.data instanceof Blob) {
                // Binary Audio Data
                // The binary packet has a header. We need to strip it to get MP3?
                // Edge TTS binary format: 2 bytes header size -> header text -> audio data.
                // Or simply search for the start of MP3?
                // Let's just collect for now.
                
                // Converting Blob to Uint8Array
                const buf = await event.data.arrayBuffer();
                const uint8 = new Uint8Array(buf);
                
                // Helper to find header / delimiter
                // Binary messages start with 2 bytes (big endian) length of header.
                const headerLen = (uint8[0] << 8) | uint8[1];
                // const header = new TextDecoder().decode(uint8.slice(2, 2 + headerLen));
                // console.log("Binary Header:", header);
                
                const audioData = uint8.slice(2 + headerLen);
                if (audioData.length > 0) {
                    audioChunks.push(audioData);
                    process.stdout.write(".");
                }
            }
        };
        
        ws.onerror = (e) => {
            console.error("WS Error:", e);
            reject(e);
        };
        
        ws.onclose = () => {
            console.log("\nWS Closed.");
        };
    });
}

testManualTTS()
    .then((chunks: any) => {
        const totalSize = chunks.reduce((acc: number, c: any) => acc + c.length, 0);
        console.log(`\nSuccess! Total audio size: ${totalSize} bytes`);
    })
    .catch((err) => console.error("FAILED:", err));
