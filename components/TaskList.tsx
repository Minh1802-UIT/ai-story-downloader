import React from "react";

// Task type definition
import { Task } from "@/app/types/index.ts";

interface TaskListProps {
  tasks: Task[];
  onDownload: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  // TTS Props
  onGenerateAudio?: (task: Task) => void;
  onGenerateAudiobook?: () => void;
  ttsLoading?: boolean;
  ttsProgress?: number;
  currentTtsTaskId?: string | null;
  TaskCardComponent: React.ComponentType<{
    task: Task;
    onDownload: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onCopy: (msg: string) => void;
    onGenerateAudio?: (task: Task) => void;
    ttsLoading?: boolean;
    ttsProgress?: number;
    currentTtsTaskId?: string | null;
  }>;
}

// Icons
const Icons = {
  Layers: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
      />
    </svg>
  ),
  Download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 9.75l-3 3m0 0l3 3m-3-3H12m0 0V3"
      />
    </svg>
  ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  ),
  Headphones: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
      />
    </svg>
  ),
};

export default function TaskList({
  tasks,
  onDownload,
  onDelete,
  onDownloadAll,
  onClearAll,
  addToast,
  onGenerateAudio,
  onGenerateAudiobook,
  ttsLoading,
  ttsProgress,
  currentTtsTaskId,
  TaskCardComponent,
}: TaskListProps) {
  const hasSuccessTasks = tasks.some(t => t.status === "success");
  
  return (
    <section className="lg:col-span-7 bg-gray-50 dark:bg-[#050505] relative flex flex-col h-full overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
        <h2 className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">
          Task Matrix
        </h2>
        <div className="flex gap-2">
          {/* Audiobook Button */}
          {onGenerateAudiobook && (
            <button
              type="button"
              onClick={onGenerateAudiobook}
              disabled={!hasSuccessTasks || ttsLoading}
              className={`p-1.5 rounded transition-colors ${
                hasSuccessTasks && !ttsLoading
                  ? "hover:bg-purple-100 dark:hover:bg-purple-500/20 text-gray-500 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400"
                  : "text-gray-300 dark:text-gray-700 cursor-not-allowed"
              }`}
              title={ttsLoading ? `Creating audio... ${ttsProgress}%` : "Create Audiobook (Merge all)"}
            >
              {ttsLoading && currentTtsTaskId === "audiobook" ? (
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icons.Headphones className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onDownloadAll}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-500 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            title="Download All (Merged)"
          >
            <Icons.Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            title="Clear All"
          >
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 task-scroll relative">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center select-none opacity-80 z-10 relative">
            {/* Animated Floating Orbs Background */}
            <div className="absolute inset-0 z-[-2] overflow-hidden pointer-events-none">
              {/* Gradient Blob 1 - Purple - Top Left */}
              <div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-purple-500/50 dark:bg-purple-600/40 rounded-full blur-[80px] animate-[float_3s_ease-in-out_infinite]"></div>
              {/* Gradient Blob 2 - Blue - Bottom Right */}
              <div className="absolute bottom-[5%] right-[5%] w-[450px] h-[450px] bg-blue-500/50 dark:bg-blue-600/40 rounded-full blur-[80px] animate-[float_4s_ease-in-out_infinite_reverse]"></div>
              {/* Gradient Blob 3 - Pink - Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/60 dark:bg-pink-600/50 rounded-full blur-[60px] animate-[pulse_2s_ease-in-out_infinite]"></div>
              {/* Gradient Blob 4 - Cyan - Top Right */}
              <div className="absolute top-[15%] right-[15%] w-[300px] h-[300px] bg-cyan-500/40 dark:bg-cyan-600/35 rounded-full blur-[60px] animate-[float_3.5s_ease-in-out_infinite_0.5s]"></div>
              
              {/* Floating Particles - Very visible with glow */}
              <div className="absolute top-[12%] left-[18%] w-5 h-5 bg-purple-400 dark:bg-purple-400 rounded-full shadow-[0_0_15px_5px_rgba(168,85,247,0.6)] animate-[floatParticle_2s_ease-in-out_infinite]"></div>
              <div className="absolute top-[50%] left-[25%] w-4 h-4 bg-blue-400 dark:bg-blue-400 rounded-full shadow-[0_0_15px_5px_rgba(96,165,250,0.6)] animate-[floatParticle_2.5s_ease-in-out_infinite_0.3s]"></div>
              <div className="absolute top-[22%] right-[22%] w-6 h-6 bg-pink-400 dark:bg-pink-400 rounded-full shadow-[0_0_20px_5px_rgba(244,114,182,0.6)] animate-[floatParticle_2.2s_ease-in-out_infinite_0.2s]"></div>
              <div className="absolute top-[60%] right-[30%] w-5 h-5 bg-purple-400 dark:bg-purple-400 rounded-full shadow-[0_0_15px_5px_rgba(168,85,247,0.6)] animate-[floatParticle_3s_ease-in-out_infinite_0.5s]"></div>
              <div className="absolute top-[35%] left-[50%] w-4 h-4 bg-cyan-400 dark:bg-cyan-400 rounded-full shadow-[0_0_15px_5px_rgba(34,211,238,0.6)] animate-[floatParticle_1.8s_ease-in-out_infinite_0.1s]"></div>
              <div className="absolute top-[72%] left-[45%] w-5 h-5 bg-pink-400 dark:bg-pink-400 rounded-full shadow-[0_0_15px_5px_rgba(244,114,182,0.6)] animate-[floatParticle_2.5s_ease-in-out_infinite_0.4s]"></div>
              <div className="absolute top-[85%] left-[20%] w-4 h-4 bg-blue-400 dark:bg-blue-400 rounded-full shadow-[0_0_15px_5px_rgba(96,165,250,0.6)] animate-[floatParticle_2s_ease-in-out_infinite_0.6s]"></div>
              <div className="absolute top-[8%] left-[60%] w-5 h-5 bg-purple-400 dark:bg-purple-400 rounded-full shadow-[0_0_15px_5px_rgba(168,85,247,0.6)] animate-[floatParticle_2.8s_ease-in-out_infinite_0.3s]"></div>
            </div>

            {/* Circuit Pattern Background */}
            <div className="absolute inset-0 z-[-1] opacity-[0.03] pointer-events-none overflow-hidden flex items-center justify-center">
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
              >
                <pattern
                  id="circuit"
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M10 10h80v80h-80z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                  <path
                    d="M50 0v100M0 50h100"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                  <circle cx="50" cy="50" r="2" fill="currentColor" />
                  <rect
                    x="20"
                    y="20"
                    width="10"
                    height="10"
                    stroke="currentColor"
                  />
                  <rect
                    x="70"
                    y="70"
                    width="10"
                    height="10"
                    stroke="currentColor"
                  />
                </pattern>
                <rect width="100%" height="100%" fill="url(#circuit)" />
              </svg>
            </div>

            <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/20 animate-in zoom-in-50 duration-500">
              <Icons.Layers className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight mb-3">
              STORY CONTENT COMMANDER
            </h3>
            <p className="text-gray-600 dark:text-gray-500 max-w-sm text-sm font-medium leading-relaxed">
              Select a tool from the{" "}
              <span className="text-purple-600 dark:text-purple-400">
                Command Center
              </span>{" "}
              on the left to begin processing content.
            </p>

            <div className="mt-8 flex gap-2">
              <div className="w-16 h-1 bg-gray-200 dark:bg-white/5 rounded-full"></div>
              <div className="w-8 h-1 bg-purple-500 rounded-full"></div>
              <div className="w-16 h-1 bg-gray-200 dark:bg-white/5 rounded-full"></div>
            </div>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCardComponent
              key={task.id}
              task={task}
              onDownload={onDownload}
              onDelete={onDelete}
              onCopy={(msg) => addToast(msg, "success")}
              onGenerateAudio={onGenerateAudio}
              ttsLoading={ttsLoading}
              ttsProgress={ttsProgress}
              currentTtsTaskId={currentTtsTaskId}
            />
          ))
        )}
      </div>
    </section>
  );
}
