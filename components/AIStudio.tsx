import React, { useState, useRef } from "react";

interface AIStudioProps {
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  inputContext: string;
  setInputContext: (val: string) => void;
  aiFiles: { name: string; content: string }[];
  setAiFiles: React.Dispatch<
    React.SetStateAction<{ name: string; content: string }[]>
  >;
  mergeOutput: boolean;
  setMergeOutput: (val: boolean) => void;
  loading: boolean;
  onSubmit: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

// Icons
const Icons = {
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  ),
  Document: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  ),
  XCircle: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Sliders: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
      />
    </svg>
  ),
  Link: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
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
  Edit: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  ),
};

// Tab types
type TabType = "manual" | number; // "manual" for manual input, number for file index

export default function AIStudio({
  aiPrompt,
  setAiPrompt,
  inputContext,
  setInputContext,
  aiFiles,
  setAiFiles,
  mergeOutput,
  setMergeOutput,
  loading,
  onSubmit,
  onDrop,
  onDragOver,
  onFileSelect,
  addToast,
}: AIStudioProps) {
  // Active tab: "manual" for manual input, or file index
  const [activeTab, setActiveTab] = useState<TabType>("manual");
  const [pdfParsing, setPdfParsing] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF upload → call /api/parse-pdf → inject text vào context
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      addToast("Only PDF files are supported", "error");
      return;
    }

    setPdfParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        addToast(`PDF parse failed: ${data.error}`, "error");
        return;
      }

      // Thêm vào AI Files (new tab)
      const newFile = { name: file.name, content: data.text };
      setAiFiles((prev) => [...prev, newFile]);
      setActiveTab(aiFiles.length); // Switch to new PDF tab

      addToast(`✅ PDF parsed: ${data.pageCount} pages, ~${data.wordCount.toLocaleString()} words`, "success");
    } catch (err) {
      addToast(`Error reading PDF: ${err instanceof Error ? err.message : "Unknown"}`, "error");
    } finally {
      setPdfParsing(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAiFiles((prev) => prev.filter((_, i) => i !== index));
    // Reset to manual tab if we removed the active file
    if (activeTab === index) {
      setActiveTab("manual");
    } else if (typeof activeTab === "number" && activeTab > index) {
      // Adjust active tab index if a previous file was removed
      setActiveTab(activeTab - 1);
    }
  };

  const updateFileContent = (index: number, newContent: string) => {
    setAiFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, content: newContent } : f))
    );
  };

  // Get current content based on active tab
  const getCurrentContent = () => {
    if (activeTab === "manual") {
      return inputContext;
    }
    return aiFiles[activeTab]?.content || "";
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    if (activeTab === "manual") {
      setInputContext(newContent);
    } else {
      updateFileContent(activeTab, newContent);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-300 h-full flex flex-col bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden relative transition-colors">
      {/* Header Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-600 opacity-50"></div>

      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/10 rounded flex items-center justify-center">
            <Icons.Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-base font-bold tracking-widest text-gray-900 dark:text-white">
            AI STUDIO
          </h2>
        </div>
        <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-green-600 dark:text-green-500">
            ONLINE
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 task-scroll">
        {/* Input Data */}
        <div>
          <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 border-l-2 border-purple-500 pl-2">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-300">
                INPUT DATA
              </span>
              {aiFiles.length > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded">
                  {aiFiles.length + 1} tabs
                </span>
              )}
            </div>
            <label className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold cursor-pointer hover:text-purple-700 dark:hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1.5 rounded border border-purple-500/20">
              <Icons.Document className="w-4 h-4" /> LOAD FILE
              <input
                type="file"
                accept=".txt"
                multiple
                className="hidden"
                onChange={onFileSelect}
              />
            </label>
            {/* PDF Upload Button */}
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              disabled={pdfParsing}
              className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold cursor-pointer hover:text-red-700 dark:hover:text-red-300 transition-colors bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20 disabled:opacity-60"
            >
              {pdfParsing ? (
                <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />Parsing...</>
              ) : (
                <>📄 LOAD PDF</>
              )}
            </button>
            <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
          </div>

          {/* Tab Bar */}
          {aiFiles.length > 0 && (
            <div className="flex gap-1 mb-2 overflow-x-auto pb-1 task-scroll">
              {/* Manual Input Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all shrink-0 ${
                  activeTab === "manual"
                    ? "bg-purple-100 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/50 border-b-0"
                    : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-500 hover:text-purple-600 dark:hover:text-gray-300 hover:bg-purple-50 dark:hover:bg-white/10 border border-transparent"
                }`}
              >
                <Icons.Edit className="w-4 h-4" />
                Manual
              </button>

              {/* File Tabs */}
              {aiFiles.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1 px-3 py-2 rounded-t-lg text-xs font-bold transition-all shrink-0 group ${
                    activeTab === i
                      ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 border-b-0"
                      : "bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className="flex items-center gap-1.5 max-w-[120px]"
                  >
                    <Icons.Document className="w-4 h-4 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="p-0.5 hover:bg-red-500/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Close tab"
                  >
                    <Icons.XCircle className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))}

              {/* Merged View Tab */}
              <button
                type="button"
                onClick={() => {
                  // Merge all content and switch to manual
                  let merged = inputContext;
                  aiFiles.forEach((f) => {
                    merged = merged
                      ? `${merged}\n\n--- FILE: ${f.name} ---\n${f.content}`
                      : `--- FILE: ${f.name} ---\n${f.content}`;
                  });
                  setInputContext(merged);
                  setAiFiles([]);
                  setActiveTab("manual");
                  addToast("All files merged into editor", "success");
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all shrink-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-gray-400 hover:text-white border border-white/10 hover:border-purple-500/50"
              >
                <Icons.Layers className="w-4 h-4" />
                Merge All
              </button>
            </div>
          )}

          {/* Editor Area */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className={`flex flex-col min-h-[240px] bg-gray-50 dark:bg-[#050505] rounded-xl border-2 border-dashed transition-all overflow-hidden ${
              activeTab === "manual"
                ? "border-purple-300 dark:border-purple-500/30"
                : "border-cyan-300 dark:border-cyan-500/30"
            }`}
          >
            {/* Tab Indicator */}
            <div className="px-3 py-2 bg-gray-100 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {activeTab === "manual"
                  ? "📝 Manual Input"
                  : `📄 ${aiFiles[activeTab]?.name || "Unknown"}`}
              </span>
              {activeTab !== "manual" && (
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {aiFiles[activeTab]?.content.length || 0} chars
                </span>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={getCurrentContent()}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={
                activeTab === "manual"
                  ? "Paste your source text here or drag & drop a .txt file..."
                  : "Edit file content..."
              }
              className="flex-1 w-full bg-transparent p-4 text-sm text-gray-800 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-700 resize-none focus:outline-none"
            ></textarea>

            {/* Footer */}
            <div className="p-2 flex justify-between text-xs text-gray-600 dark:text-gray-400 font-mono border-t border-white/5 bg-black/20">
              <span>
                {aiFiles.length} file{aiFiles.length !== 1 ? "s" : ""} loaded
              </span>
              <span>
                {activeTab === "manual"
                  ? "Manual Input"
                  : `File ${(activeTab as number) + 1}/${aiFiles.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* Directives */}
        <div>
          <div className="flex items-center gap-2 border-l-2 border-blue-500 pl-2 mb-2">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-300">DIRECTIVES</span>
          </div>
          <div className="relative">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Enter system prompt instructions..."
              className="w-full bg-gray-50 dark:bg-[#050505] border border-gray-300 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-700 min-h-[100px] focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/30"
            />
            <Icons.Sliders className="absolute bottom-3 right-3 w-4 h-4 text-gray-400 dark:text-gray-700" />
          </div>
          {/* Quick Directives */}
          <div className="mt-3 flex gap-2 flex-wrap">
            {[
              {
                label: "Rewrite Creative",
                prompt:
                  "Rewrite this text creatively, making it more engaging.",
              },
              {
                label: "Summarize",
                prompt: "Provide a concise summary of the key points.",
              },
              {
                label: "Fix Grammar",
                prompt: "Proofread the text, correcting grammatical errors.",
              },
              {
                label: "Translate to VN",
                prompt: "Translate into natural-sounding Vietnamese.",
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setAiPrompt(item.prompt)}
                className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-500 dark:text-gray-400 hover:text-white hover:bg-purple-600/20 hover:border-purple-500/50 transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2 mb-3 px-1">
          <input
            type="checkbox"
            id="mergeOutput"
            checked={mergeOutput}
            onChange={(e) => setMergeOutput(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-purple-500"
          />
          <label
            htmlFor="mergeOutput"
            className="text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer select-none"
          >
            MERGE OUTPUT (Combine files into one result)
          </label>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-sm text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              PROCESSING...
            </>
          ) : (
            <>
              <Icons.Link className="w-4 h-4" />
              GENERATE
            </>
          )}
        </button>

        {/* Indeterminate Progress Bar */}
        {loading && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>AI is processing your content...</span>
              <span className="animate-pulse">Please wait</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
