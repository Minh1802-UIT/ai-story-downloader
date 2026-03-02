import React from "react";
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
// Layers Icon (copied from page.tsx)
const LayersIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

  React.useEffect(() => {
    if (!batchStoryUrl) {
      setWarning(null);
      return;
    }
    if (!batchStoryUrl.startsWith("http")) {
      setWarning("URL must start with http:// or https://");
      return;
    }
    if (!batchStoryUrl.includes("monkeydtruyen")) {
      setWarning(
        "⚠️ Currently we only support monkeydtruyen.com"
      );
      return;
    }
    // Check for potential batch logic issues
    // The current logic in page.tsx expects the URL to be replaceable.
    // We warn if it looks like a root domain without path
    try {
      const urlObj = new URL(batchStoryUrl);
      if (urlObj.pathname.length < 2 || !urlObj.pathname.includes("-")) {
        setWarning(
          "⚠️ URL seems to lack a story/chapter path. Batch usage might fail."
        );
        return;
      }
    } catch {
      setWarning("Invalid URL format");
      return;
    }

    setWarning(null);
  }, [batchStoryUrl]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Input URL */}
      <div>
        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">
          STORY BASE URL
        </label>
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
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ml-1">
          Example: https://monkeydtruyen.com/ten-truyen.html
        </p>

        {/* Validation Warning */}
        {warning && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {warning}
          </div>
        )}
      </div>
      {/* Input Range: Start & End */}
      <div className="grid grid-cols-2 gap-4">
        <div>
        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">
            START
          </label>
          <input
            type="number"
            value={startChapter}
            onChange={(e) => setStartChapter(Number(e.target.value))}
            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-300 dark:border-white/10 rounded-lg p-3 text-base text-center focus:border-cyan-500 dark:focus:border-cyan-500/50 outline-none text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">
            END
          </label>
          <input
            type="number"
            value={endChapter}
            onChange={(e) => setEndChapter(Number(e.target.value))}
            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-300 dark:border-white/10 rounded-lg p-3 text-base text-center focus:border-cyan-500 dark:focus:border-cyan-500/50 outline-none text-gray-900 dark:text-white"
          />
        </div>
      </div>
      {/* Action Button */}
      <button
        type="button"
        onClick={onRunBatch}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
      >
        {loading ? "Processing Batch..." : "RUN BATCH SEQUENCE"}
      </button>
      {/* Sequence Preview */}
      <div className="mt-4">
        <div className="flex justify-between items-end mb-2">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-500 tracking-wider">
            SEQUENCE PREVIEW
          </label>
          <span className="text-xs text-cyan-600 dark:text-cyan-500 font-mono">
            Total: {Math.max(0, endChapter - startChapter + 1)} Chaps
          </span>
        </div>
        <div className="bg-gray-100 dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-white/5 p-4 flex flex-wrap gap-2 max-h-[150px] overflow-y-auto task-scroll">
          {/* Preview render logic */}
          {Array.from(
            {
              length: Math.min(50, Math.max(0, endChapter - startChapter + 1)),
            },
            (_, i) => startChapter + i
          ).map((num) => (
            <div
              key={num}
              className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-600 dark:text-cyan-300 text-sm px-3 py-1.5 rounded-lg font-mono font-bold shadow-sm"
            >
              #{num}
            </div>
          ))}
          {endChapter - startChapter + 1 > 50 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center px-2 font-medium">
              ... +{endChapter - startChapter + 1 - 50} more
            </span>
          )}
          {endChapter < startChapter && (
            <span className="text-sm text-red-500 italic font-medium">
              Invalid Range
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
