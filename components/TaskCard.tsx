import React, { useState } from "react";

// Inline SVG Icons (Next.js compatible)
const Icons = {
  Bolt: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
      />
    </svg>
  ),
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
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 3.844L18 5.25l-.259-1.406a2.25 2.25 0 00-1.406-1.406L14.75 2.25l1.594-.259a2.25 2.25 0 001.406-1.406L18 0l.259 1.406a2.25 2.25 0 001.406 1.406L21.25 2.25l-1.594.259a2.25 2.25 0 00-1.406 1.406zM18.259 18.844L18 20.25l-.259-1.406a2.25 2.25 0 00-1.406-1.406L14.75 17.25l1.594-.259a2.25 2.25 0 001.406-1.406L18 15l.259 1.406a2.25 2.25 0 001.406 1.406L21.25 17.25l-1.594.259a2.25 2.25 0 00-1.406 1.406z"
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
  Clipboard: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
      />
    </svg>
  ),
  Speaker: (props: React.SVGProps<SVGSVGElement>) => (
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
  Play: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
      />
    </svg>
  ),
  Stop: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
      />
    </svg>
  ),
};

import { Task } from "@/app/types/index.ts";

interface TaskCardProps {
  task: Task;
  onDownload: (taskId: string, e: React.MouseEvent) => void;
  onDelete: (taskId: string, e: React.MouseEvent) => void;
  onCopy: (message: string) => void;
  onGenerateAudio?: (task: Task) => void;
  ttsLoading?: boolean;
  ttsProgress?: number;
  currentTtsTaskId?: string | null;
}

export default function TaskCard({
  task,
  onDownload,
  onDelete,
  onCopy,
  onGenerateAudio,
  ttsLoading,
  ttsProgress,
  currentTtsTaskId,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isGeneratingThisTask = ttsLoading && currentTtsTaskId === task.id;

  const toggleExpand = (e: React.MouseEvent) => {
    // Don't toggle if clicking action buttons
    if ((e.target as HTMLElement).closest("button")) return;
    setIsExpanded(!isExpanded);
  };

  // Handle drag start for TTS Studio drop
  const handleDragStart = (e: React.DragEvent) => {
    if (task.status === "success" && typeof task.data === "string") {
      const taskData = JSON.stringify({
        id: task.id,
        title: task.title,
        content: task.data,
      });
      e.dataTransfer.setData("application/task-data", taskData);
      e.dataTransfer.setData("text/plain", task.data);
      e.dataTransfer.effectAllowed = "copy";
    }
  };

  return (
    <div className="space-y-2">
      {/* Task Card */}
      <div
        draggable={task.status === "success" && typeof task.data === "string"}
        onDragStart={handleDragStart}
        onClick={toggleExpand}
        className={`group relative bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-[#161616] border rounded-xl p-4 transition-all cursor-pointer flex gap-4 items-center ${
          isExpanded
            ? "border-purple-500/30"
            : "border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
        } ${task.status === "success" && typeof task.data === "string" ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            task.type === "extract"
              ? "bg-purple-500/10 text-purple-400"
              : task.type === "batch"
              ? "bg-cyan-500/10 text-cyan-400"
              : "bg-pink-500/10 text-pink-400"
          }`}
        >
          {task.type === "extract" && <Icons.Bolt className="w-5 h-5" />}
          {task.type === "batch" && <Icons.Layers className="w-5 h-5" />}
          {task.type === "ai" && <Icons.Sparkles className="w-5 h-5" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 truncate pr-2 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {task.title}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              {task.timestamp}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500 truncate">{task.subtitle}</p>

            {/* Status Badge */}
            <div
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                task.status === "success"
                  ? "bg-green-500/5 text-green-500 border-green-500/20"
                  : task.status === "processing"
                  ? "bg-blue-500/5 text-blue-400 border-blue-500/20"
                  : "bg-red-500/5 text-red-500 border-red-500/20"
              }`}
            >
              {task.status}
            </div>
          </div>

          {/* Progress Bar - Determinate (batch) */}
          {task.progress !== undefined && (
            <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          )}

          {/* Progress Bar - Indeterminate (extract/ai) */}
          {task.status === "processing" && task.progress === undefined && (
            <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]"></div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-white/5">
          {/* TTS Button */}
          {task.status === "success" && onGenerateAudio && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateAudio(task);
              }}
              disabled={ttsLoading}
              className={`p-2 rounded transition-colors ${
                isGeneratingThisTask
                  ? "bg-purple-500/20 text-purple-400"
                  : "hover:bg-purple-500/20 text-gray-400 hover:text-purple-400"
              } ${ttsLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              title={isGeneratingThisTask ? `Creating audio... ${ttsProgress}%` : "Create Audio"}
            >
              {isGeneratingThisTask ? (
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icons.Speaker className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => onDownload(task.id, e)}
            className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white"
            title="Download Text"
          >
            <Icons.Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(task.id, e)}
            className="p-2 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
            title="Delete"
          >
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsed Content - Success */}
      {isExpanded && task.status === "success" && task.data && (
        <div className="ml-14 mr-2 bg-black/40 border border-purple-500/20 rounded-lg p-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-purple-400 font-semibold">
              CONTENT PREVIEW
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof task.data === "string") {
                  navigator.clipboard.writeText(task.data);
                  onCopy("Copied to clipboard!");
                }
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:bg-white/5 px-2 py-1 rounded"
            >
              <Icons.Clipboard className="w-3 h-3" />
              Copy
            </button>
          </div>
          
          {/* Generate Audio Button */}
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onGenerateAudio) {
                  onGenerateAudio(task);
                }
              }}
              disabled={ttsLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                ttsLoading
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
            >
              <Icons.Speaker className="w-4 h-4" />
              {isGeneratingThisTask ? `Creating... ${ttsProgress}%` : "Create Audio MP3"}
            </button>
          </div>
          
          <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto task-scroll">
            {typeof task.data === "string"
              ? task.data
              : JSON.stringify(task.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Collapsed Content - Error */}
      {isExpanded && task.status === "failed" && task.error && (
        <div className="ml-14 mr-2 bg-red-500/5 border border-red-500/20 rounded-lg p-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <span className="text-xs text-red-400 font-semibold">ERROR</span>
          <p className="text-xs text-red-300 mt-2">{task.error}</p>
        </div>
      )}

      {/* Collapsed Content - Processing */}
      {isExpanded && task.status === "processing" && (
        <div className="ml-14 mr-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-blue-400">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
