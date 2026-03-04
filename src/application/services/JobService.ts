import { supabase, createAuthClient } from "@src/config/supabase";
import { storyService } from "@src/application/services/StoryService";

// ---- Performance Config ----
const CHUNK_SIZE = 5;          // Số chương chạy song song mỗi lần
const BASE_DELAY_MS = 500;     // Delay tối thiểu giữa các chunk (khi thành công)
const MAX_DELAY_MS = 2500;     // Delay tối đa (khi bị rate limit)
const MAX_RETRIES = 3;         // Số lần thử lại tối đa mỗi chương

export type JobType = "BATCH_DOWNLOAD";
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface JobPayload {
  storyUrl: string;
  startChapter: number;
  endChapter: number;
  chapterUrls: string[]; // Danh sách URL đã được gen sẵn
}

export interface JobResult {
  completedChapters: number;
  totalChapters: number;
  downloadedUrls: string[];
}

// ---- Tạo Job mới ----
export async function createJob(payload: JobPayload, userId: string | null = null, token: string = ""): Promise<string> {
  const client = token ? createAuthClient(token) : supabase;
  const { data, error } = await client
    .from("jobs")
    .insert({
      user_id: userId,
      type: "BATCH_DOWNLOAD" as JobType,
      status: "QUEUED" as JobStatus,
      progress: 0,
      result_data: {
        ...payload,
        processedCount: 0,
        downloadedUrls: [],
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create job: ${error?.message}`);
  }

  return data.id;
}

// ---- Xử lý 1 chunk (CHUNK_SIZE chương) ----
export async function processNextChunk(
  jobId: string,
  token: string = ""
): Promise<{ done: boolean; progress: number; total: number }> {
  const client = token ? createAuthClient(token) : supabase;
  
  // 1. Lấy trạng thái job hiện tại
  const { data: job, error } = await client
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error("Job not found");

  // 2. Parse payload
  const payload = job.result_data as {
    chapterUrls: string[];
    processedCount: number;
    downloadedUrls: string[];
  };

  const { chapterUrls, processedCount, downloadedUrls } = payload;
  const total = chapterUrls.length;

  // Đã xử lý hết → đánh dấu COMPLETED
  if (processedCount >= total) {
    await client
      .from("jobs")
      .update({ status: "COMPLETED", progress: 100 })
      .eq("id", jobId);
    return { done: true, progress: 100, total };
  }

  // 3. Cập nhật trạng thái → PROCESSING
  await client
    .from("jobs")
    .update({ status: "PROCESSING" })
    .eq("id", jobId);

  // 4. Lấy batch chương cần xử lý trong chunk này
  const chunkUrls = chapterUrls.slice(
    processedCount,
    processedCount + CHUNK_SIZE
  );

  // --- HỆ THỐNG CREDIT: Kiểm tra và Trừ Credit ---
  if (job.user_id && chunkUrls.length > 0) {
    const { data: profile } = await client
      .from("profiles")
      .select("credits")
      .eq("id", job.user_id)
      .single();

    if (!profile || profile.credits < chunkUrls.length) {
      // Hết Credit -> Fail Job
      await client
        .from("jobs")
        .update({ 
          status: "FAILED", 
          result_data: { ...payload, error: "Tài khoản của bạn đã hết Credit." } 
        })
        .eq("id", jobId);
      return { done: true, progress: Math.round((processedCount / total) * 100), total };
    }

    // Trừ credit tương ứng với số chương trong chunk xử lý đợt này
    await client
      .from("profiles")
      .update({ credits: profile.credits - chunkUrls.length })
      .eq("id", job.user_id);
  }

  // 5. Xử lý SONG SONG tất cả chương trong chunk với Adaptive Delay
  const newDownloadedUrls = [...downloadedUrls];
  let newProcessedCount = processedCount;
  let failedInChunk = 0;
  let rateLimitHit = false; // Flag bẻt Rate Limit để điều chỉnh delay

  await Promise.all(
    chunkUrls.map(async (chapterUrl) => {
      let success = false;
      let attempt = 0;
      
      while (attempt < MAX_RETRIES && !success) {
        try {
          attempt++;
          // Vô hiệu hoá AI cho luồng Batch Download (nhanh gấp nhiều lần)
          const skipAi = job.type === "BATCH_DOWNLOAD";
          const result = await storyService.getContent(chapterUrl, skipAi);
          
          if (result.content && result.content.startsWith("Lỗi")) {
              throw new Error(result.content);
          }
          
          newDownloadedUrls.push(chapterUrl);
          console.log(`[Job ${jobId}] ✓ ${result.title}`);
          success = true;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Job ${jobId}] Lần ${attempt}/${MAX_RETRIES} chương ${chapterUrl}:`, errMsg);
          if (attempt >= MAX_RETRIES) {
            failedInChunk++;
          } else {
            // Exponential backoff: 500ms, 1000ms, 2000ms
            const backoff = Math.min(500 * Math.pow(2, attempt - 1), 2000);
            rateLimitHit = true; // Thất bại => có khả năng bị rate limit
            await new Promise(r => setTimeout(r, backoff));
          }
        }
      }
    })
  );

  // Nếu TẤT CẢ chapter trong chunk đều fail → đánh dấu FAILED và dừng
  if (failedInChunk === chunkUrls.length) {
    const errMsg = "Tất cả chapter đều thất bại. Kiểm tra lại URL hoặc nguồn truyện.";
    await client
      .from("jobs")
      .update({ 
        status: "FAILED", 
        progress: Math.round((processedCount / total) * 100),
        result_data: { ...payload, processedCount, downloadedUrls, error: errMsg }
      })
      .eq("id", jobId);
    return { done: true, progress: Math.round((processedCount / total) * 100), total };
  }

  // Cộng dồn tiến độ sau khi Promise.all hoàn thành
  newProcessedCount += chunkUrls.length;

  // (Adaptive delay đã được xử lý bên trong vòng lặp chunk phía trên)

  // 6. Cập nhật tiến độ vào DB
  const newProgress = Math.round((newProcessedCount / total) * 100);
  const isDone = newProcessedCount >= total;

  await client
    .from("jobs")
    .update({
      status: isDone ? "COMPLETED" : "PROCESSING",
      progress: newProgress,
      result_data: {
        ...payload,
        processedCount: newProcessedCount,
        downloadedUrls: newDownloadedUrls,
      },
    })
    .eq("id", jobId);

  return { done: isDone, progress: newProgress, total };
}

// ---- Đọc trạng thái Job ----
export async function getJobStatus(jobId: string, token: string = "") {
  const client = token ? createAuthClient(token) : supabase;
  const { data, error } = await client
    .from("jobs")
    .select("id, status, progress, result_data, created_at")
    .eq("id", jobId)
    .single();

  if (error) throw new Error("Job not found");
  return data;
}
