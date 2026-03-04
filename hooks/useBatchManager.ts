import { useState } from "react";
import { Task } from "@/app/types";
// [CONFIG] Cấu hình cho Batch Job
const BATCH_CONFIG = {
  CONCURRENCY: 3,       // Số luồng chạy song song
  DELAY_MS: 1500,       // Nghỉ 1.5s giữa các đợt (An toàn cho IP)
  MAX_RETRIES: 3,       // Thử lại tối đa 3 lần nếu lỗi mạng
  MAX_BATCH_SIZE: 1000, // Giới hạn số chương
};

interface UseBatchManagerProps {
  addTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

// [HELPER] Hàm tạo URL thông minh (Quét ngược từ cuối lên)
// Giải quyết vấn đề: Tên truyện có chữ "chapter" hoặc số 0 ở đầu (01, 02...)
const generateSmartUrl = (originalUrl: string, newChapterNum: number): string => {
  const parts = originalUrl.split("/");
  let foundIndex = -1;
  let prefix = "";
  let oldNumStr = "";
  let suffix = "";

  // 1. Quét từ cuối mảng lên đầu để tìm phần tử chứa "chuong/chapter"
  // Điều này giúp tránh sửa nhầm tên truyện (Slug) nếu tên truyện cũng có số
  for (let i = parts.length - 1; i >= 0; i--) {
    // Regex: (tiền tố)(số)(hậu tố)
    const match = parts[i].match(/(.*(?:chuong|chapter|page)[/-])(\d+)(.*)/i);
    if (match) {
      foundIndex = i;
      prefix = match[1];
      oldNumStr = match[2];
      suffix = match[3];
      break; 
    }
  }

  // Nếu không tìm thấy pattern nào khớp, trả về URL gốc (hoặc xử lý nối đuôi nếu cần)
  if (foundIndex === -1) {
      // Fallback đơn giản: nối thêm /chuong-X
      const baseUrl = originalUrl.replace(/\/$/, "").replace(/\.html$/, "");
      if (originalUrl.includes("truyenfull")) {
          return `${baseUrl}/chuong-${newChapterNum}/`;        
      }
      return `${baseUrl}/chuong-${newChapterNum}.html`;
  }

  // 2. Xử lý Zero Padding (Giữ nguyên định dạng 01, 001...)
  const isPadded = oldNumStr.startsWith("0") && oldNumStr.length > 1;
  let newNumStr = String(newChapterNum);
  
  if (isPadded) {
    while (newNumStr.length < oldNumStr.length) {
      newNumStr = "0" + newNumStr;
    }
  }

  // 3. Thay thế phần tử đã tìm thấy
  parts[foundIndex] = `${prefix}${newNumStr}${suffix}`;
  return parts.join("/");
};



export function useBatchManager({ addTasks, updateTask, addToast }: UseBatchManagerProps) {
  const [batchStoryUrl, setBatchStoryUrl] = useState("");
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(10);
  const [loading, setBatchLoading] = useState(false);

  const sizeId = () => Math.random().toString(36).substring(7);

  const handleBatchDownload = async () => {
    // --- VALIDATION ---
    if (!batchStoryUrl.trim() || !batchStoryUrl.startsWith("http")) {
      return addToast("URL không hợp lệ (phải bắt đầu bằng http)!", "error");
    }
    if (startChapter > endChapter) {
      return addToast("Chương bắt đầu phải nhỏ hơn chương kết thúc!", "error");
    }
    const totalChapters = endChapter - startChapter + 1;
    if (totalChapters > BATCH_CONFIG.MAX_BATCH_SIZE) {
      return addToast(`Giới hạn ${BATCH_CONFIG.MAX_BATCH_SIZE} chương/lần!`, "error");
    }

    setBatchLoading(true);
    const storySlug = new URL(batchStoryUrl).pathname.split("/").pop() || "Story";
    const isChapterUrl = /(?:chuong|chapter|page)[/-](\d+)/i.test(batchStoryUrl);
    
    let chaptersToDownload: { number: number; url: string }[] = [];

    // --- PHASE 1: GENERATE LIST ---
    try {
        // Ưu tiên 1: Smart List (Nếu là link truyện)
        let smartListSuccess = false;
        if (!isChapterUrl) {
            addToast("Đang quét danh sách chương từ Server...", "info");
            try {
                // Fetch danh sách chương qua API Route thay vì gọi trực tiếp ở Client
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: batchStoryUrl, type: "list", start: startChapter, end: endChapter })
                });
                const apiJson = await res.json();
                
                if (apiJson.success && apiJson.data && apiJson.data.length > 0) {
                     // deno-lint-ignore no-explicit-any
                    chaptersToDownload = apiJson.data
                        .map((c: any) => ({ number: c.number, url: c.url }));
                    
                    if (chaptersToDownload.length > 0) {
                        smartListSuccess = true;
                        addToast(`Tìm thấy ${chaptersToDownload.length} chương từ mục lục!`, "success");
                    }
                }
            } catch (e) {
                console.warn("Smart list failed, switching to fallback", e);
            }
        }

        // Ưu tiên 2: Fallback (Đoán URL bằng generateSmartUrl)
        if (!smartListSuccess || chaptersToDownload.length === 0) {
            if (!smartListSuccess && !isChapterUrl) {
                addToast("Không lấy được mục lục, chuyển sang chế độ đoán URL...", "warning");
            }
            
            for (let i = startChapter; i <= endChapter; i++) {
                const smartUrl = generateSmartUrl(batchStoryUrl, i);
                chaptersToDownload.push({ number: i, url: smartUrl });
            }
        }

        if (chaptersToDownload.length === 0) {
            throw new Error("Không tạo được danh sách chương nào.");
        }

        // --- PHASE 2: UI PREP ---
        const newTasks: Task[] = [];
        const taskIds: string[] = [];
        
        chaptersToDownload.forEach((chap) => {
            const taskId = sizeId();
            taskIds.push(taskId);
            newTasks.push({
                id: taskId,
                type: "batch",
                status: "queued",
                title: `Chapter ${chap.number} - ${storySlug}`,
                subtitle: "Waiting in queue...",
                progress: 0,
                timestamp: new Date().toLocaleTimeString(),
                data: null, // Chưa có data
                // Lưu URL vào hidden field nếu cần để debug
            });
        });
        addTasks(newTasks);

        // --- PHASE 3: EXECUTION LOOP ---
        for (let i = 0; i < chaptersToDownload.length; i += BATCH_CONFIG.CONCURRENCY) {
            const chunk = chaptersToDownload.slice(i, i + BATCH_CONFIG.CONCURRENCY);
            const chunkTaskIds = taskIds.slice(i, i + BATCH_CONFIG.CONCURRENCY);

            // Update UI -> Processing
            chunkTaskIds.forEach(id => updateTask(id, { status: "processing", subtitle: "Downloading...", progress: 30 }));

            await Promise.all(chunk.map(async (chapItem, idx) => {
                const currentTaskId = chunkTaskIds[idx];
                let attempt = 0;
                let success = false;

                while (attempt < BATCH_CONFIG.MAX_RETRIES && !success) {
                    try {
                        attempt++;
                        // Lấy nội dung chương qua API Route
                        const res = await fetch("/api/analyze", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ url: chapItem.url })
                        });
                        const apiJson = await res.json();
                        
                        if (!apiJson.success) throw new Error(apiJson.error || "Unknown error");
                        const data = apiJson.data;

                        if (data.content && !data.content.startsWith("Lỗi")) {
                            updateTask(currentTaskId, {
                                status: "success",
                                title: `Chapter ${chapItem.number} - ${data.title || "Done"}`,
                                subtitle: "Ready",
                                progress: 100,
                                data: data.content,
                            });
                            success = true;
                        } else {
                            throw new Error(data.content || "Unknown error");
                        }
                    } catch (e: any) {
                        console.error(`Task ${currentTaskId} attempt ${attempt} failed:`, e);
                        if (attempt >= BATCH_CONFIG.MAX_RETRIES) {
                            updateTask(currentTaskId, {
                                status: "failed",
                                subtitle: `Failed after ${attempt} retries`,
                                error: e.message,
                                progress: 0
                            });
                        } else {
                            updateTask(currentTaskId, { subtitle: `Retrying (${attempt}/${BATCH_CONFIG.MAX_RETRIES})...` });
                            // Nghỉ một chút trước khi thử lại
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }
            }));

            // Rate Limiting Delay
            if (i + BATCH_CONFIG.CONCURRENCY < chaptersToDownload.length) {
                await new Promise((r) => setTimeout(r, BATCH_CONFIG.DELAY_MS));
            }
        }
        
        addToast("Quy trình tải hoàn tất!", "success");

    } catch (err: any) {
        addToast(err.message || "Lỗi hệ thống", "error");
    } finally {
        setBatchLoading(false);
    }
  };

  return {
    batchStoryUrl, setBatchStoryUrl,
    startChapter, setStartChapter,
    endChapter, setEndChapter,
    batchLoading: loading,
    handleBatchDownload,
  };
}