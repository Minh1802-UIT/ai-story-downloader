import { useState, useCallback } from "react";
import { Task } from "@/app/types";
import { supabase } from "@src/config/supabase";

interface UseAIStudioProps {
  addTask: (task: Task) => void;
  addTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function useAIStudio({ addTask, addTasks, updateTask, addToast }: UseAIStudioProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [inputContext, setInputContext] = useState(""); // Manual text input
  const [aiFiles, setAiFiles] = useState<{ name: string; content: string }[]>([]);
  const [loading, setAiLoading] = useState(false);
  const [mergeOutput, setMergeOutput] = useState(false);

  const sizeId = () => Math.random().toString(36).substring(7);

  // --- FILE HANDLING ---
  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: { name: string; content: string }[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
            const text = await file.text();
            newFiles.push({ name: file.name, content: text });
        } else {
             addToast(`File ${file.name} ignored (only text/md/json supported)`, "warning");
        }
    }
    setAiFiles((prev) => [...prev, ...newFiles]);
  }, [addToast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };


  // --- PROCESSING LOGIC ---
  const handleAiSubmit = async () => {
    const hasFiles = aiFiles.length > 0;
    const hasManualInput = inputContext.trim().length > 0;

    if ((!hasFiles && !hasManualInput) || !aiPrompt.trim())
      return addToast(
        "Please provide Content (File/Text) and a Prompt!",
        "error"
      );

    setAiLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      if (mergeOutput || (!hasFiles && hasManualInput)) {
        // MERGE MODE: Combine all files + manual input
        const taskId = sizeId();
        const initialTask: Task = {
            id: taskId,
            type: "ai",
            status: "processing",
            title: `AI Task: ${
              hasFiles ? `Merged (${aiFiles.length} files)` : "Manual Input"
            }`,
            subtitle: "Generating content...",
            timestamp: new Date().toLocaleTimeString(),
        };
        addTask(initialTask);

        let contentToProcess = "";
        if (hasManualInput) {
          contentToProcess += `--- MANUAL INPUT ---\n${inputContext}\n\n`;
        }
        if (hasFiles) {
          contentToProcess += aiFiles
            .map((f) => `--- FILE: ${f.name} ---\n${f.content}`)
            .join("\n\n");
        }

        const res = await fetch("/api/ai-process", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ prompt: aiPrompt, content: contentToProcess }),
        });
        const data = await res.json();

        if (data.success) {
            updateTask(taskId, {
                status: "success",
                title: `AI Result: Merged Output`,
                data: data.data.response,
                subtitle: "rewritten successfully",
            });
          addToast("AI Processing Complete!", "success");
        } else {
          // Handle Cloud/Quota errors specifically
          if (data.code === "CONTENT_TOO_LONG") {
            addToast("Content exceeds limits. Please split files.", "error");
          } else if (res.status === 429) {
            addToast("System Busy (429). Please wait a moment.", "warning");
          } else if (data.code === "INVALID_API_KEY") {
            addToast("Invalid API Key configuration.", "error");
          }
          throw new Error(data.error || "AI processing failed");
        }
      } else {
        // BATCH MODE: Process each file individually
        const newTasks = aiFiles.map((file) => ({
          id: sizeId(),
          type: "ai" as const,
          status: "queued" as const,
          title: `AI: ${file.name}`,
          subtitle: "Queued...",
          timestamp: new Date().toLocaleTimeString(),
          fileContent: file.content, // Temp storage (not in official Type but useful here, removed before saving if stringent)
           // Note: Task type allows 'data: any', so we could put it there or just use local variable.
           // Since 'fileContent' is not in our Task interface in `types/index.ts`, TS error will occur if we pass it directly to `addTask` if we typed it strictly.
           // However, our Task interface has optional fields. 'fileContent' is NOT in it.
           // I should adapt. I'll use a local mapping or just let 'fileContent' be part of the object but not the type (casting), or better, handle logic here cleanly.
           // I'll use local array for processing, and only push standard fields to global state.
        }));

        // We need to keep track of file content locally because Task state doesn't hold input content usually.
        // Actually, let's just loop locally.
        
        // Add tasks to global state (without fileContent)
        const tasksForState = newTasks.map(({ fileContent, ...t }) => t);
        addTasks(tasksForState);

        // Process sequentially
        for (let i = 0; i < newTasks.length; i++) {
           const task = newTasks[i];
           updateTask(task.id, { status: "processing", subtitle: "Processing..." });

          try {
            const res = await fetch("/api/ai-process", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                prompt: aiPrompt,
                content: task.fileContent,
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            updateTask(task.id, {
                status: "success",
                data: data.data.response,
                subtitle: "Completed",
            });
          } catch (err: unknown) {
             updateTask(task.id, {
                status: "failed",
                error: err instanceof Error ? err.message : "Unknown error",
                subtitle: "Failed",
             });
          }
        }
        addToast("AI Processing Complete!", "success");
      }
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : "An error occurred",
        "error"
      );
    } finally {
      setAiLoading(false);
    }
  };

  return {
    aiPrompt, setAiPrompt,
    inputContext, setInputContext,
    aiFiles, setAiFiles,
    aiLoading: loading,
    mergeOutput, setMergeOutput,
    handleAiSubmit,
    handleFileSelect,
    handleDrop,
    handleDragOver
  };
}
