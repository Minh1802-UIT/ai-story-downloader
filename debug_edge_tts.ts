import { MsEdgeTTS, OUTPUT_FORMAT } from "npm:msedge-tts";

async function testEdgeTTS() {
    console.log("Testing Edge TTS...");
    const tts = new MsEdgeTTS();
    await tts.setMetadata("vi-VN-NamMinhNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    try {
        const readable = await tts.toStream("Xin chào, đây là kiểm tra giọng nói.");
        console.log("Stream received. Reading...");
        
        let count = 0;
        for await (const chunk of readable) {
            count += chunk.length;
        }
        console.log(`Success! Received ${count} bytes.`);
    } catch (e: any) {
        console.error("Test Failed:", e);
        if (e && typeof e === 'object') {
             console.error(JSON.stringify(e, Object.getOwnPropertyNames(e)));
        }
    }
}

testEdgeTTS();
