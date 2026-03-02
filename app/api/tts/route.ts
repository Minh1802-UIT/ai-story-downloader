import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Buffer } from "node:buffer";

/**
 * TTS API Route - Supports Google Translate & Edge TTS
 */

const GOOGLE_TTS_URL = "https://translate.google.com/translate_tts";

/**
 * Generate audio using Google Translate TTS
 */
async function generateGoogleAudio(text: string, lang: string, speed: number): Promise<string> {
  const truncatedText = text.slice(0, 200); // Google limit
  
  const params = new URLSearchParams({
    ie: "UTF-8",
    q: truncatedText,
    tl: lang,
    client: "tw-ob",
    ttsspeed: String(speed),
  });

  const ttsUrl = `${GOOGLE_TTS_URL}?${params.toString()}`;

  const audioResponse = await fetch(ttsUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://translate.google.com/",
    },
  });

  if (!audioResponse.ok) {
    throw new Error(`Google TTS failed: ${audioResponse.status}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const uint8Array = new Uint8Array(audioBuffer);
  
  if (uint8Array.length === 0) {
    throw new Error("TTS returned empty audio data");
  }
  
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  
  return btoa(binary);
}

/**
 * Generate audio using Microsoft Edge TTS
 */
async function generateEdgeAudio(text: string, voice: string, speed: number): Promise<string> {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // Construct SSML for speed control
    const ratePercentage = Math.round((speed - 1) * 100);
    const rateStr = ratePercentage >= 0 ? `+${ratePercentage}%` : `${ratePercentage}%`;
    
    const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">
        <voice name="${voice}">
            <prosody rate="${rateStr}">
                ${text}
            </prosody>
        </voice>
    </speak>`.trim();

    try {
         // Use rawToStream since we constructed valid SSML manually.
         // Calling toStream(ssml) would double-wrap it in <speak> tags.
         const { audioStream } = await tts.rawToStream(ssml);
         
         const chunks: Buffer[] = [];
         for await (const chunk of audioStream) {
             chunks.push(Buffer.from(chunk));
         }
         const completeBuffer = Buffer.concat(chunks);
         return completeBuffer.toString("base64");

    } catch (e: any) {
        console.error("DEBUG: Edge TTS Failed. Error details:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
        throw new Error(`Edge TTS failed: ${e.message || JSON.stringify(e)}`);
    }
}


export async function POST(request: Request) {
  try {
    const { text, lang = "vi", speed = 1.0, provider = "google", voice = "vi-VN-NamMinhNeural" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        // deno-lint-ignore no-explicit-any
        { status: 400 } as any
      );
    }

    let audioBase64 = "";
    let effectiveProvider = provider;

    if (provider === "edge") {
        try {
            // Use Edge TTS
            // Default voice mapping if needed
            const targetVoice = voice || "vi-VN-NamMinhNeural";
            audioBase64 = await generateEdgeAudio(text, targetVoice, speed);
        } catch (e) {
            console.error("DEBUG: Edge TTS Failed, falling back to Google. Error:", e);
            // Fallback to Google
            effectiveProvider = "google (fallback)";
            audioBase64 = await generateGoogleAudio(text, lang, speed);
        }
    } else {
        // Default to Google
        audioBase64 = await generateGoogleAudio(text, lang, speed);
    }

    return NextResponse.json({
      success: true,
      data: {
        audio: audioBase64,
        format: "mp3",
        textLength: text.length,
        provider: effectiveProvider
      }
    });

  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "TTS generation failed" 
      },
      // deno-lint-ignore no-explicit-any
      { status: 500 } as any
    );
  }
}
