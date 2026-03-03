import { supabase } from "@src/config/supabase";
import { storyService } from "@src/application/services/StoryService";

// Số chương xử lý mỗi "chunk" — đủ nhỏ để dưới 10s Vercel timeout
const CHUNK_SIZE = 5;
const CHUNK_DELAY_MS = 1200;

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
export async function createJob(payload: JobPayload, userId: string | null = null): Promise<string> {
  const { data, error } = await supabase
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
  jobId: string
): Promise<{ done: boolean; progress: number; total: number }> {
  // 1. Lấy trạng thái job hiện tại
  const { data: job, error } = await supabase
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
    await supabase
      .from("jobs")
      .update({ status: "COMPLETED", progress: 100 })
      .eq("id", jobId);
    return { done: true, progress: 100, total };
  }

  // 3. Cập nhật trạng thái → PROCESSING
  await supabase
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", job.user_id)
      .single();

    if (!profile || profile.credits < chunkUrls.length) {
      // Hết Credit -> Fail Job
      await supabase
        .from("jobs")
        .update({ 
          status: "FAILED", 
          result_data: { ...payload, error: "Tài khoản của bạn đã hết Credit." } 
        })
        .eq("id", jobId);
      return { done: true, progress: Math.round((processedCount / total) * 100), total };
    }

    // Trừ credit tương ứng với số chương trong chunk xử lý đợt này
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - chunkUrls.length })
      .eq("id", job.user_id);
  }

  // 5. Xử lý tuần tự từng chương trong chunk
  const newDownloadedUrls = [...downloadedUrls];
  let newProcessedCount = processedCount;

  for (const chapterUrl of chunkUrls) {
    try {
      // Fetch content (sẽ dùng cache nếu có sẵn)
      const result = await storyService.getContent(chapterUrl);
      newDownloadedUrls.push(chapterUrl);
      newProcessedCount++;

      // Nhỏ delay để tránh IP block
      await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));

      console.log(
        `[Job ${jobId}] Processed ${newProcessedCount}/${total}: ${result.title}`
      );
    } catch (err) {
      console.error(`[Job ${jobId}] Failed chapter ${chapterUrl}:`, err);
      newProcessedCount++; // Bỏ qua lỗi, tiếp tục
    }
  }

  // 6. Cập nhật tiến độ vào DB
  const newProgress = Math.round((newProcessedCount / total) * 100);
  const isDone = newProcessedCount >= total;

  await supabase
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
export async function getJobStatus(jobId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, status, progress, result_data, created_at")
    .eq("id", jobId)
    .single();

  if (error) throw new Error("Job not found");
  return data;
}
