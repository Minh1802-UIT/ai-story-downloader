"use client";

import React, { useState, useEffect } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import TaskCard from "@/components/TaskCard";
import ExtractForm from "@/components/ExtractForm";
import BatchManager from "@/components/BatchManager";
import AIStudio from "@/components/AIStudio";
import TTSStudio from "@/components/TTSStudio";

import TaskList from "@/components/TaskList";
import ThemeToggle from "@/components/ThemeToggle";
import OnboardingTour from "@/components/OnboardingTour";
import { UserMenu } from "@/components/UserMenu";

// Hooks
import { useToast } from "@/hooks/useToast";
import { useTaskManager } from "@/hooks/useTaskManager";
import { useStoryExtractor } from "@/hooks/useStoryExtractor";
import { useBatchManager } from "@/hooks/useBatchManager";
import { useAIStudio } from "@/hooks/useAIStudio";
import { useTTS } from "@/hooks/useTTS";

// --- Icons ---
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
  CheckCircle: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Mic: (props: React.SVGProps<SVGSVGElement>) => (
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
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  ),
};

export default function Home() {
  // --- STATE: GLOBAL & LAYOUT ---
  const [activeTab, setActiveTab] = useState<"extract" | "batch" | "ai" | "tts">(
    "extract"
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // --- HOOKS ---
  const { toasts, addToast, removeToast } = useToast();
  const {
    tasks,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    clearTasks,
    downloadTask,
    downloadAllTasks,
  } = useTaskManager();

  const {
    url,
    setUrl,
    loading: extractLoading,
    handleAnalyze,
  } = useStoryExtractor({
    addTask,
    updateTask,
    addToast,
  });

  const {
    batchStoryUrl,
    setBatchStoryUrl,
    startChapter,
    setStartChapter,
    endChapter,
    setEndChapter,
    batchLoading,
    handleBatchDownload,
  } = useBatchManager({
    addTasks,
    updateTask,
    addToast,
  });

  const {
    aiPrompt,
    setAiPrompt,
    inputContext,
    setInputContext,
    aiFiles,
    setAiFiles,
    aiLoading,
    mergeOutput,
    setMergeOutput,
    handleAiSubmit,
    handleFileSelect,
    handleDrop,
    handleDragOver,
  } = useAIStudio({
    addTask,
    addTasks,
    updateTask,
    addToast,
  });

  // TTS Hook
  const {
    ttsLoading,
    ttsProgress,
    currentTaskId: currentTtsTaskId,
    generateSingleAudio,
    generateFullAudiobook,
  } = useTTS({ addToast });

  // Auto-trigger onboarding
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(
      "story-commander-tour-completed-v2"
    );
    if (!hasCompletedTour) {
      setShowOnboarding(true);
    }
  }, []);

  // --- HELPERS ---
  const handleClearAll = () => {
    if (tasks.length === 0) {
      addToast("No tasks to clear", "info");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Clear All Tasks?",
      message: `This will permanently delete all ${tasks.length} task(s). This action cannot be undone.`,
      type: "danger",
      onConfirm: () => {
        clearTasks();
        addToast("All tasks cleared", "success");
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* HEADER */}
      <header className="h-14 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 bg-white dark:bg-[#0a0a0a] shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
            STORY COMMANDER{" "}
            <span className="text-xs text-purple-500 align-top">V2</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            SYSTEM ONLINE
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-bold text-sm"
            title="Restart Onboarding Tour"
          >
            ?
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT: COMMAND CENTER */}
        <section className="lg:col-span-5 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/10 flex flex-col h-full transition-colors duration-300">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-white/10">
            {["extract", "batch", "ai", "tts"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as "extract" | "batch" | "ai" | "tts")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? "bg-purple-50 dark:bg-white/5 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500"
                    : "text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                }`}
              >
                {/* Icons could be added here if desired */}
                {tab === "extract" && (
                  <div className="flex items-center justify-center gap-2">
                    <Icons.Bolt className="w-4 h-4" /> <span>Single</span>
                  </div>
                )}
                {tab === "batch" && (
                  <div className="flex items-center justify-center gap-2">
                    <Icons.Layers className="w-4 h-4" /> <span>Batch</span>
                  </div>
                )}
                {tab === "ai" && (
                  <div className="flex items-center justify-center gap-2">
                    <Icons.Sparkles className="w-4 h-4" />{" "}
                    <span>AI</span>
                  </div>
                )}
                {tab === "tts" && (
                  <div className="flex items-center justify-center gap-2">
                    <Icons.Mic className="w-4 h-4" /> <span>TTS</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="p-6 flex-1 overflow-y-auto task-scroll">
            {/* MODE: EXTRACT */}
            {activeTab === "extract" && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <ExtractForm
                  url={url}
                  setUrl={setUrl}
                  loading={extractLoading}
                  onAnalyze={handleAnalyze}
                />
              </div>
            )}

            {/* MODE: BATCH */}
            {activeTab === "batch" && (
              <BatchManager
                batchStoryUrl={batchStoryUrl}
                setBatchStoryUrl={setBatchStoryUrl}
                startChapter={startChapter}
                setStartChapter={setStartChapter}
                endChapter={endChapter}
                setEndChapter={setEndChapter}
                loading={batchLoading}
                onRunBatch={handleBatchDownload}
              />
            )}

            {/* MODE: AI STUDIO */}
            {activeTab === "ai" && (
              <AIStudio
                aiPrompt={aiPrompt}
                setAiPrompt={setAiPrompt}
                inputContext={inputContext}
                setInputContext={setInputContext}
                aiFiles={aiFiles}
                setAiFiles={setAiFiles}
                mergeOutput={mergeOutput}
                setMergeOutput={setMergeOutput}
                loading={aiLoading}
                onSubmit={handleAiSubmit}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onFileSelect={handleFileSelect}
                addToast={addToast}
              />
            )}

            {/* MODE: TTS STUDIO */}
            {activeTab === "tts" && (
              <TTSStudio addToast={addToast} />
            )}
          </div>
        </section>

        {/* RIGHT: UNIFIED DASHBOARD */}
        <TaskList
          tasks={tasks}
          onDownload={(id, e) => {
            e.stopPropagation();
            downloadTask(id);
          }}
          onDelete={(id, e) => {
            e.stopPropagation();
            deleteTask(id);
          }}
          onDownloadAll={downloadAllTasks}
          onClearAll={handleClearAll}
          addToast={addToast}
          onGenerateAudio={(task) => generateSingleAudio(task)}
          onGenerateAudiobook={() => generateFullAudiobook(tasks)}
          ttsLoading={ttsLoading}
          ttsProgress={ttsProgress}
          currentTtsTaskId={currentTtsTaskId}
          TaskCardComponent={TaskCard}
        />
      </main>

      {/* TOASTS */}
      <div className="fixed top-6 right-6 z-110 flex flex-col gap-2">
        {toasts.map((toast) => {
          const progress = toast.duration
            ? Math.max(
                0,
                Math.min(
                  100,
                  ((Date.now() - toast.createdAt) / toast.duration) * 100
                )
              )
            : 0;

          return (
            <div
              key={toast.id}
              className="relative bg-[#111] border border-white/20 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-right-10 fade-in overflow-hidden group"
              onMouseEnter={(e) => {
                // Pause auto-dismiss on hover (would need state management for full implementation)
                e.currentTarget.style.animationPlayState = "paused";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animationPlayState = "running";
              }}
            >
              {/* Progress Bar */}
              {toast.duration && toast.duration > 0 && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-100"
                  style={{ width: `${100 - progress}%` }}
                ></div>
              )}

              {toast.type === "success" && (
                <Icons.CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              )}
              {toast.type === "error" && (
                <Icons.XCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              {toast.type === "info" && (
                <Icons.Eye className="w-5 h-5 text-blue-500 shrink-0" />
              )}
              {toast.type === "warning" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-amber-500 shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-sm font-medium flex-1">
                {toast.message}
              </span>

              {/* Manual Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Dismiss"
              >
                <Icons.XCircle className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>
          );
        })}
      </div>

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      {/* ONBOARDING TOUR */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => {
            setShowOnboarding(false);
            localStorage.setItem("story-commander-tour-completed-v2", "true");
          }}
          onSkip={() => {
            setShowOnboarding(false);
            localStorage.setItem("story-commander-tour-completed-v2", "true");
          }}
        />
      )}
    </div>
  );
}
