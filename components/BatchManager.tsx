"use client";

import React from "react";
import { useJobQueue } from "@/hooks/useJobQueue";

// Props interface definitions
interface BatchManagerProps {
  batchStoryUrl: string;
  setBatchStoryUrl: (url: string) => void;
  startChapter: number;
  setStartChapter: (num: number) => void;
  endChapter: number;
  setEndChapter: (num: number) => void;
  loading: boolean;
  onRunBatch: () => void;
}

// ---- Helper: Gen danh sách chapter URLs từ base URL ----
function generateChapterUrls(baseUrl: string, start: number, end: number): string[] {
  const urls: string[] = [];
  for (let i = start; i <= end; i++) {
    const parts = baseUrl.split("/");
    let replaced = false;
    for (let j = parts.length - 1; j >= 0; j--) {
      const match = parts[j].match(/(.*(?:chuong|chapter|page)[/-])(\d+)(.*)/i);
      if (match) {
        parts[j] = `${match[1]}${i}${match[3]}`;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      const base = baseUrl.replace(/\/$/, "").replace(/\.html$/, "");
      urls.push(`${base}/chapter-${i}.html`);
    } else {
      urls.push(parts.join("/"));
    }
  }
  return urls;
}

// Layers Icon
const LayersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
  </svg>
);

export default function BatchManager({
  batchStoryUrl,
  setBatchStoryUrl,
  startChapter,
  setStartChapter,
  endChapter,
  setEndChapter,
  loading,
  onRunBatch,
}: BatchManagerProps) {
  const [warning, setWarning] = React.useState<string | null>(null);
  const { status, progress, total, startJob, reset, jobId } = useJobQueue();

  React.useEffect(() => {
    if (!batchStoryUrl) { setWarning(null); return; }
    if (!batchStoryUrl.startsWith("http")) { setWarning("URL must start with http:// or https://"); return; }
    if (!batchStoryUrl.includes("monkeydtruyen")) { setWarning("⚠️ Currently we only support monkeydtruyen.com"); return; }
    try {
      const urlObj = new URL(batchStoryUrl);
      if (urlObj.pathname.length < 2 || !urlObj.pathname.includes("-")) {
        setWarning("⚠️ URL seems to lack a story/chapter path. Batch usage might fail.");
        return;
      }
    } catch { setWarning("Invalid URL format"); return; }
    setWarning(null);
  }, [batchStoryUrl]);

  const handleQueueJob = async () => {
    if (!batchStoryUrl || endChapter < startChapter) return;
    const chapterUrls = generateChapterUrls(batchStoryUrl, startChapter, endChapter);
    await startJob({ storyUrl: batchStoryUrl, startChapter, endChapter, chapterUrls });
  };

  const isQueueRunning = status === "creating" || status === "processing";
  const totalChapters = Math.max(0, endChapter - startChapter + 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Input URL */}
      <div>
        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">STORY BASE URL</label>
        <div className="relative">
          <input
            type="text"
            value={batchStoryUrl}
            onChange={(e) => setBatchStoryUrl(e.target.value)}
            placeholder="https://monkeydtruyen.com/..."
            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-300 dark:border-white/10 rounded-lg p-3 pl-10 text-base text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500/50 transition-colors"
          />
          <div className="absolute left-3 top-3 text-gray-400 dark:text-gray-600">
            <LayersIcon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ml-1">Example: https://monkeydtruyen.com/ten-truyen.html</p>
        {warning && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 flex items-center gap-2 animate-in fade-in">
            ⚠️ {warning}
          </div>
        )}
      </div>

      {/* Input Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">START</label>
          <input type="number" value={startChapter} onChange={(e) => setStartChapter(Number(e.target.value))}
            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-300 dark:border-white/10 rounded-lg p-3 text-base text-center focus:border-cyan-500 dark:focus:border-cyan-500/50 outline-none text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">END</label>
          <input type="number" value={endChapter} onChange={(e) => setEndChapter(Number(e.target.value))}
            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-300 dark:border-white/10 rounded-lg p-3 text-base text-center focus:border-cyan-500 dark:focus:border-cyan-500/50 outline-none text-gray-900 dark:text-white" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRunBatch}
          disabled={loading || isQueueRunning}
          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
        >
          {loading ? "Processing..." : "⚡ RUN BATCH"}
        </button>

        <button
          type="button"
          onClick={
            isQueueRunning
              ? undefined
              : status === "completed" || status === "failed"
                ? reset
                : handleQueueJob
          }
          disabled={loading || isQueueRunning || (!batchStoryUrl && status === "idle")}
          title="Xử lý ngầm — Không bị timeout, an toàn cho tải nhiều chương"
          className={`flex-1 py-3 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-1.5
            ${isQueueRunning
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-wait"
              : status === "completed"
                ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                : status === "failed"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
            }`}
        >
          {isQueueRunning ? "⏳ Queuing..." : status === "completed" ? "✅ Done! Reset" : status === "failed" ? "❌ Retry" : "🚀 QUEUE JOB"}
        </button>
      </div>

      {/* Job Progress Panel */}
      {(isQueueRunning || status === "completed" || status === "failed") && (
        <div className="bg-gray-50 dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-gray-600 dark:text-gray-400">
              {isQueueRunning ? "🔄 BACKGROUND PROCESSING" : status === "completed" ? "✅ COMPLETED" : "❌ FAILED"}
            </span>
            <span className="text-cyan-500 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${status === "completed" ? "bg-green-500" : status === "failed" ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>~{Math.round(total * progress / 100)} / {total} chương đã xử lý</span>
            {jobId && <span className="font-mono opacity-50">ID: {jobId.slice(0, 8)}…</span>}
          </div>
          {isQueueRunning && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 italic">
              ✨ Bạn có thể chuyển tab khác, job vẫn tiếp tục chạy ngầm!
            </p>
          )}
        </div>
      )}

      {/* Sequence Preview */}
      <div className="mt-4">
        <div className="flex justify-between items-end mb-2">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-500 tracking-wider">SEQUENCE PREVIEW</label>
          <span className="text-xs text-cyan-600 dark:text-cyan-500 font-mono">Total: {totalChapters} Chaps</span>
        </div>
        <div className="bg-gray-100 dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-white/5 p-4 flex flex-wrap gap-2 max-h-[150px] overflow-y-auto task-scroll">
          {Array.from({ length: Math.min(50, totalChapters) }, (_, i) => startChapter + i).map((num) => (
            <div key={num} className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-600 dark:text-cyan-300 text-sm px-3 py-1.5 rounded-lg font-mono font-bold shadow-sm">
              #{num}
            </div>
          ))}
          {totalChapters > 50 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center px-2 font-medium">
              ... +{totalChapters - 50} more
            </span>
          )}
          {endChapter < startChapter && (
            <span className="text-sm text-red-500 italic font-medium">Invalid Range</span>
          )}
        </div>
      </div>
    </div>
  );
}
