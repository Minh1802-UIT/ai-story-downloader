import { useState, useCallback } from "react";
import { 
  generateFullAudio, 
  downloadAudio,
} from "@src/services/ttsService";
import { Task } from "@/app/types/index.ts";

interface UseTTSOptions {
  addToast?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function useTTS({ addToast }: UseTTSOptions = {}) {
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  /**
   * Generate audio for a single task/chapter
   */
  const generateSingleAudio = useCallback(async (task: Task) => {
    if (!task.data || typeof task.data !== "string") {
      addToast?.("Không có nội dung để tạo audio", "error");
      return;
    }

    setTtsLoading(true);
    setCurrentTaskId(task.id);
    setTtsProgress(0);

    try {
      addToast?.("Đang tạo audio...", "info");

      const audioBlob = await generateFullAudio(
        task.data,
        { lang: "vi", speed: 1.0 },
        (progress) => setTtsProgress(progress)
      );

      // Generate filename from title
      const safeTitle = task.title.replace(/[:\\/|?"<>*]/g, "").trim();
      downloadAudio(audioBlob, `${safeTitle}.mp3`);

      addToast?.("Tạo audio thành công!", "success");
    } catch (error) {
      console.error("TTS Error:", error);
      addToast?.(error instanceof Error ? error.message : "Lỗi tạo audio", "error");
    } finally {
      setTtsLoading(false);
      setCurrentTaskId(null);
      setTtsProgress(0);
    }
  }, [addToast]);

  /**
   * Generate audiobook from multiple tasks (merged)
   */
  const generateFullAudiobook = useCallback(async (
    tasks: Task[], 
    _voice: "male" | "female" = "male"
  ) => {
    const successTasks = tasks.filter(t => t.status === "success" && t.data);
    
    if (successTasks.length === 0) {
      addToast?.("Không có chương nào để tạo audiobook", "error");
      return;
    }

    setTtsLoading(true);
    setCurrentTaskId("audiobook");
    setTtsProgress(0);

    try {
      addToast?.(`Đang tạo audiobook từ ${successTasks.length} chương...`, "info");

      // Sort tasks by chapter number
      const getChapterNumber = (title: string): number => {
        const match = title.match(/(?:Chapter|Chương)\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : 999999;
      };

      const sortedTasks = [...successTasks].sort(
        (a, b) => getChapterNumber(a.title) - getChapterNumber(b.title)
      );

      // Combine all text with chapter separations
      let combinedText = "";
      sortedTasks.forEach((task, index) => {
        if (task.data && typeof task.data === "string") {
          // Add chapter header for TTS to read
          combinedText += `\n\nChương ${getChapterNumber(task.title)}.\n\n`;
          combinedText += task.data;
          combinedText += "\n\n"; // Pause between chapters
        }
      });

      const audioBlob = await generateFullAudio(
        combinedText,
        { lang: "vi", speed: 1.0 },
        (progress) => setTtsProgress(progress)
      );

      // Generate filename
      const firstTitle = sortedTasks[0]?.title || "Audiobook";
      const storyNameMatch = firstTitle.split(" - ")[1] || firstTitle;
      const safeStoryName = storyNameMatch.replace(/[:\\/|?"<>*]/g, "").trim();
      
      downloadAudio(audioBlob, `Audiobook - ${safeStoryName}.mp3`);

      addToast?.("Tạo audiobook thành công!", "success");
    } catch (error) {
      console.error("Audiobook Error:", error);
      addToast?.(error instanceof Error ? error.message : "Lỗi tạo audiobook", "error");
    } finally {
      setTtsLoading(false);
      setCurrentTaskId(null);
      setTtsProgress(0);
    }
  }, [addToast]);

  return {
    ttsLoading,
    ttsProgress,
    currentTaskId,
    generateSingleAudio,
    generateFullAudiobook,
  };
}
