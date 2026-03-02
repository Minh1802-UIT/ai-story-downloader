import React, { useState, useEffect, useRef } from "react";

interface TTSStudioProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  droppedText?: string | null;
  onDropComplete?: () => void;
}

// Icons
const Icons = {
  Mic: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  Download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  Document: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Play: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  ),
  Pause: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
    </svg>
  ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
};

export default function TTSStudio({ addToast, droppedText, onDropComplete }: TTSStudioProps) {
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // TTS Settings
  const [provider, setProvider] = useState<"google" | "edge">("google");
  const [voice, setVoice] = useState("vi-VN-NamMinhNeural");

  // Audio player states
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle dropped text from TaskList
  useEffect(() => {
    if (droppedText) {
      setTextInput(droppedText);
      addToast("Added content from task!", "success");
      onDropComplete?.();
    }
  }, [droppedText, addToast, onDropComplete]);

  // Update playback speed when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle drag events for drop zone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const text = e.dataTransfer.getData("text/plain");
    const taskData = e.dataTransfer.getData("application/task-data");
    
    if (taskData) {
      try {
        const parsed = JSON.parse(taskData);
        if (parsed.content) {
          setTextInput(parsed.content);
          addToast(`Received content: ${parsed.title}`, "success");
        }
      } catch {
        if (text) {
          setTextInput(text);
          addToast("Content received!", "success");
        }
      }
    } else if (text) {
      setTextInput(text);
      addToast("Đã nhận nội dung!", "success");
    }
  };

  // Generate audio - NO auto download
  const handleGenerateAudio = async () => {
    if (!textInput.trim()) {
      addToast("Please enter text content", "error");
      return;
    }

    // Clear previous audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    setLoading(true);
    setProgress(0);

    try {
      const { generateFullAudio } = await import("@src/services/ttsService");

      addToast("Creating audio...", "info");

      const blob = await generateFullAudio(
        textInput,
        { lang: "vi", speed: 1.0, provider, voice },
        (p) => setProgress(p)
      );

      // Create URL for audio preview
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
      setPlaybackSpeed(1.0);

      addToast("Audio created successfully! Preview below.", "success");
    } catch (error) {
      console.error("TTS Error:", error);
      addToast(error instanceof Error ? error.message : "Audio creation failed", "error");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Manual download
  const handleDownload = () => {
    if (!audioBlob) return;
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(audioBlob);
    link.download = `tts_audio_${timestamp}.mp3`;
    link.click();
    addToast("Downloading MP3...", "success");
  };

  // Clear audio
  const handleClearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
  };

  // Play/Pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      addToast("Only .txt files are supported", "error");
      return;
    }

    try {
      const content = await file.text();
      setTextInput(content);
      addToast(`File loaded: ${file.name}`, "success");
    } catch {
      addToast("Error reading file", "error");
    }
  };

  const charCount = textInput.length;
  const estimatedTime = Math.ceil(charCount / 200);

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-300 h-full flex flex-col bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden relative transition-colors">
      {/* Header Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50"></div>

      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/10 rounded flex items-center justify-center">
            <Icons.Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-base font-bold tracking-widest text-gray-900 dark:text-white">
            TTS STUDIO
          </h2>
        </div>
        
        {/* READY Badge */}
        <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-green-600 dark:text-green-500">READY</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 task-scroll">
        {/* Text Input */}
        <div>
          <div className="flex flex-col gap-3 mb-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 border-l-2 border-purple-500 pl-2">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-300">SOURCE TEXT</span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold cursor-pointer hover:text-purple-700 dark:hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1.5 rounded border border-purple-500/20">
                <Icons.Document className="w-4 h-4" /> LOAD FILE
                <input type="file" accept=".txt" className="hidden" onChange={handleFileLoad} />
                </label>
            </div>

            {/* TTS Settings Controls */}
            <div className="flex flex-wrap gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                {/* Provider Switch */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Provider:</span>
                    <div className="flex bg-gray-200 dark:bg-black/40 rounded-lg p-1">
                        <button
                            onClick={() => setProvider("google")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                provider === "google" 
                                ? "bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-sm" 
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            Google
                        </button>
                        <button
                            onClick={() => setProvider("edge")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                provider === "edge" 
                                ? "bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-sm" 
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            Edge (Neural)
                        </button>
                    </div>
                </div>

                {/* Voice Switch (Only for Edge) */}
                {provider === "edge" && (
                     <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Voice:</span>
                        <select 
                            value={voice}
                            onChange={(e) => setVoice(e.target.value)}
                            className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-md px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="vi-VN-NamMinhNeural">Nam Minh (Male)</option>
                            <option value="vi-VN-HoaiMyNeural">Hoài My (Female)</option>
                        </select>
                    </div>
                )}
            </div>
          </div>

          {/* Editor Area - Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col min-h-[160px] bg-gray-50 dark:bg-[#050505] rounded-xl border-2 border-dashed overflow-hidden transition-all ${
              isDragOver 
                ? "border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.02]" 
                : "border-purple-300 dark:border-purple-500/30"
            }`}
          >
            {isDragOver && (
              <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center pointer-events-none z-10">
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm animate-pulse">
                  📋 Drop task here!
                </div>
              </div>
            )}
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter, paste text, or DRAG & DROP TASK from the right..."
              className="flex-1 w-full bg-transparent p-4 text-sm text-gray-800 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-700 resize-none focus:outline-none min-h-[140px]"
            ></textarea>

            {/* Footer */}
            <div className="p-2 flex justify-between text-xs text-gray-600 dark:text-gray-400 font-mono border-t border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-black/20">
              <span>{charCount.toLocaleString()} characters</span>
              <span>~{estimatedTime}s audio</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Audio Player - Shows after generation */}
        {audioUrl && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 border-l-2 border-purple-500 pl-2">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-300">🎧 AUDIO PREVIEW</span>
            </div>
            
            {/* Hidden audio element */}
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Custom Player Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-orange-500/30"
              >
                {isPlaying ? <Icons.Pause className="w-6 h-6" /> : <Icons.Play className="w-6 h-6 ml-0.5" />}
              </button>
              
              {/* Playback Speed Control */}
              <div className="flex-1 flex items-center gap-3 bg-white dark:bg-black/30 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Speed:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  style={{ ["--value-percent" as string]: `${((playbackSpeed - 0.5) / 1.5) * 100}%` }}
                  className="flex-1"
                />
                <span className="text-sm font-mono font-bold text-orange-600 dark:text-orange-400 min-w-[45px] text-center">
                  {playbackSpeed.toFixed(1)}x
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Icons.Download className="w-4 h-4" />
                DOWNLOAD MP3
              </button>
              <button
                type="button"
                onClick={handleClearAudio}
                className="px-4 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20">
        <button
          type="button"
          onClick={handleGenerateAudio}
          disabled={loading || !textInput.trim()}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-sm text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              CREATING AUDIO... {progress}%
            </>
          ) : (
            <>
              <Icons.Mic className="w-5 h-5" />
              CREATE AUDIO
            </>
          )}
        </button>
      </div>
    </div>
  );
}
