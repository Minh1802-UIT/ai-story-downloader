import React from "react";

// Interface definitions for the component props
interface ExtractFormProps {
  url: string; // Current URL value
  setUrl: (url: string) => void; // Function to update URL
  loading: boolean; // Loading state
  onAnalyze: (e: React.FormEvent) => void; // Handler function on submit
}

// Local icons for component self-containment
const SubmitIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
    />
  </svg>
);

export default function ExtractForm({
  url,
  setUrl,
  loading,
  onAnalyze,
}: ExtractFormProps) {
  const [warning, setWarning] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!url) {
      setWarning(null);
      return;
    }
    if (!url.startsWith("http")) {
      setWarning("URL must start with http:// or https://");
      return;
    }
    // Simple domain check - Strict Mode: MonkeyD Only
    if (!url.includes("monkeydtruyen")) {
      setWarning("Note: Currently only optimized for monkeydtruyen.com");
      // Non-blocking warning
      return;
    }
    setWarning(null);
  }, [url]);

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-300 dark:border-white/5">
          <SubmitIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Quick Extract
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-500">
            Extract content from a story chapter
          </p>
        </div>
      </div>

      <form onSubmit={onAnalyze} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1 uppercase tracking-wider">
            STORY URL
          </label>
          <div className="relative group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://monkeydtruyen.com/..."
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 dark:focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-700 font-mono"
            />
          </div>
          {/* Validation Warning */}
          {warning && (
            <div className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1.5 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              {warning}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:bg-purple-700 dark:hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></span>
          ) : (
            <>
              <SubmitIcon className="w-4 h-4" />
              Extract Now
            </>
          )}
        </button>

        {/* Indeterminate Progress Bar */}
        {loading && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Extracting content...</span>
              <span className="animate-pulse">Please wait</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
