"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@src/config/supabase";

export type QueueStatus = "idle" | "creating" | "processing" | "completed" | "failed";

interface UseJobQueueReturn {
  jobId: string | null;
  status: QueueStatus;
  progress: number;
  total: number;
  startJob: (payload: {
    storyUrl: string;
    startChapter: number;
    endChapter: number;
    chapterUrls: string[];
  }) => Promise<void>;
  reset: () => void;
}

export function useJobQueue(): UseJobQueueReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<QueueStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const isRunning = useRef(false);

  const reset = useCallback(() => {
    setJobId(null);
    setStatus("idle");
    setProgress(0);
    setTotal(0);
    isRunning.current = false;
  }, []);

  // Cảnh báo khi người dùng định đóng trang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Nếu job đang chạy (chuẩn bị hoặc đang tải), hiển thị cảnh báo
      if (status === "creating" || status === "processing") {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome/modern browsers
        return "";          // Required for legacy browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  // Polling loop: gọi /api/process-job liên tục cho đến khi done
  const pollChunks = useCallback(async (id: string) => {
    isRunning.current = true;

    while (isRunning.current) {
      try {
        // Xin lại token mới nhất từ local session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";

        const res = await fetch("/api/process-job", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ jobId: id }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          console.error("[useJobQueue] Process chunk failed:", data.error);
          setStatus("failed");
          isRunning.current = false;
          break;
        }

        setProgress(data.progress ?? 0);
        if (data.total) setTotal(data.total);

        if (data.done) {
          setStatus("completed");
          isRunning.current = false;
          break;
        }

        // Nhỏ delay giữa các chunk để tránh rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error("[useJobQueue] Network error:", err);
        setStatus("failed");
        isRunning.current = false;
        break;
      }
    }
  }, []);

  const startJob = useCallback(
    async (payload: {
      storyUrl: string;
      startChapter: number;
      endChapter: number;
      chapterUrls: string[];
    }) => {
      try {
        reset();
        setStatus("creating");
        setTotal(payload.chapterUrls.length);

        // 1. Lấy token auth
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";

        // 2. Tạo Job trong DB
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create job");
        }

        const id: string = data.jobId;
        setJobId(id);
        setStatus("processing");

        // 2. Bắt đầu polling chunks
        pollChunks(id);
      } catch (err) {
        console.error("[useJobQueue] startJob error:", err);
        setStatus("failed");
      }
    },
    [reset, pollChunks]
  );

  return { jobId, status, progress, total, startJob, reset };
}
