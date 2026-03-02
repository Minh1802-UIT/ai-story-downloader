/**
 * TTS Service - Google Translate TTS
 */

const TTS_API_ENDPOINT = "/api/tts";

interface TTSOptions {
  lang?: string;
  speed?: number;
  provider?: "google" | "edge";
  voice?: string;
}

// ... existing code ...

interface TTSChunk {
  text: string;
  index: number;
}

/**
 * Split text into chunks (max ~200 chars per request)
 */
export const splitTextToChunks = (text: string, maxLength = 180): TTSChunk[] => {
  const chunks: TTSChunk[] = [];
  const sentences = text.split(/(?<=[.!?。])\s+/);
  
  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength) {
      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });
        currentChunk = "";
      }
      
      if (sentence.length > maxLength) {
        const words = sentence.split(/\s+/);
        for (const word of words) {
          if (currentChunk.length + word.length > maxLength) {
            if (currentChunk.trim()) {
              chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });
              currentChunk = "";
            }
          }
          currentChunk += word + " ";
        }
      } else {
        currentChunk += sentence + " ";
      }
    } else {
      currentChunk += sentence + " ";
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ text: currentChunk.trim(), index: chunkIndex });
  }

  return chunks;
};

/**
 * Convert base64 audio to Blob
 */
export const base64ToBlob = (base64: string, mimeType = "audio/mpeg"): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Merge multiple audio blobs into one
 */
export const mergeAudioBlobs = async (blobs: Blob[]): Promise<Blob> => {
  const arrayBuffers = await Promise.all(
    blobs.map(blob => blob.arrayBuffer())
  );
  
  const totalLength = arrayBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
  const mergedBuffer = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const buffer of arrayBuffers) {
    mergedBuffer.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return new Blob([mergedBuffer], { type: "audio/mpeg" });
};

/**
 * Generate audio for a single text chunk via API
 */
export const generateAudioChunk = async (text: string, lang = "vi", speed = 1.0, provider = "google", voice = "vi-VN-NamMinhNeural"): Promise<string> => {
  const response = await fetch(TTS_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang, speed, provider, voice }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || "TTS API failed");
  }

  if (!data.data?.audio || data.data.audio.length === 0) {
    throw new Error("No audio data received from API");
  }

  return data.data.audio;
};

// ... existing code ...

/**
 * Generate complete audio from long text with chunking
 */
export const generateFullAudio = async (
  text: string,
  options: TTSOptions = {},
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const lang = options.lang || "vi";
  const speed = options.speed || 1.0;
  const provider = options.provider || "google";
  const voice = options.voice || "vi-VN-NamMinhNeural";
  
  const chunks = splitTextToChunks(text);
  const audioBlobs: Blob[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const base64Audio = await generateAudioChunk(chunk.text, lang, speed, provider, voice);
      const blob = base64ToBlob(base64Audio);
      audioBlobs.push(blob);
    } catch (error) {
      console.error(`Chunk ${i} failed:`, error);
    }
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / chunks.length) * 100));
    }
    
    // Delay between requests to avoid rate limiting
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  if (audioBlobs.length === 0) {
    throw new Error("No audio chunks generated");
  }
  
  return mergeAudioBlobs(audioBlobs);
};

/**
 * Download audio blob as file
 */
export const downloadAudio = (blob: Blob, filename = "audio.mp3"): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
