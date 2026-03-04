"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

const Icons = {
  Lock: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  RefreshCw: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  Download: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  Eye: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  XMark: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Play: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  ),
  SpeakerWave: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  ),
  Trash: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
};

type JobData = {
  id: string;
  type: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  result_data: any;
  created_at: string;
};

export default function JobHistory({ addToast }: { addToast: (msg: string, type: "success" | "error" | "info") => void }) {
  const { session } = useAuth();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);

  // States cho tính năng Xem Thử (Preview)
  const [previewContent, setPreviewContent] = useState<{ title: string; text: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/user/jobs", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      } else {
        addToast("Failed to fetch jobs: " + data.error, "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Network error while fetching jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchJobs();
    }
  }, [session]);

  const handleDownload = async (job: JobData, format: "txt" | "epub" = "txt") => {
    if (job.status !== "COMPLETED") {
      addToast("Job chưa hoàn thành.", "error");
      return;
    }
    
    try {
      addToast(`Đang chuẩn bị file ${format.toUpperCase()}...`, "info");
      const urlPath = format === "epub" ? `/api/jobs/export/epub?jobId=${job.id}` : `/api/jobs/download?jobId=${job.id}`;
      const res = await fetch(urlPath, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) {
        let errMsg = "Không thể tải file, có lỗi server.";
        try {
           const errData = await res.json();
           if (errData.error) errMsg = errData.error;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const defaultExt = format === "epub" ? "epub" : "txt";
      const filename = res.headers.get("Content-Disposition")?.split('filename="')[1]?.replace('"', '') || `Story_Download_${job.id.slice(0, 5)}.${defaultExt}`;
      
      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObject;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlObject);
      a.remove();
      
      addToast("Tải xuống thành công!", "success");
    } catch (err: any) {
      console.error(err);
      addToast("Tải xuống thất bại: " + err.message, "error");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tác vụ này khỏi lịch sử không?")) return;
    
    setDeletingJobId(jobId);
    try {
      const res = await fetch(`/api/user/jobs?jobId=${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setJobs(jobs.filter(j => j.id !== jobId));
        addToast("Đã xóa tác vụ thành công", "success");
      } else {
        throw new Error(data.error || "Lỗi xóa tác vụ");
      }
    } catch (e: any) {
      console.error(e);
      addToast(e.message, "error");
    } finally {
      setDeletingJobId(null);
    }
  };

  const handlePreview = async (job: JobData) => {
    if (job.status !== "COMPLETED") {
       addToast("Job chưa hoàn thành. Không thể xem thử", "error");
       return;
    }

    setAudioUrl(null);
    setIsAudioLoading(false);
    
    try {
      setIsPreviewLoading(true);
      setIsPreviewOpen(true);
      // Gọi API preview
      const res = await fetch(`/api/jobs/preview?jobId=${job.id}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
         throw new Error(data.error || "Không thể tải dữ liệu đọc thử.");
      }

      setPreviewContent({ title: data.data.title, text: data.data.previewText });
      
    } catch (error: any) {
       console.error(error);
       addToast(error.message, "error");
       setIsPreviewOpen(false);
    } finally {
       setIsPreviewLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!previewContent || !previewContent.text) return;
    try {
      setIsAudioLoading(true);
      const textToRead = previewContent.text.slice(0, 3000); 

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          text: textToRead,
          provider: "edge",
          voice: "vi-VN-HoaiMyNeural"
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
         if (res.status === 402) {
             throw new Error("Bạn đã hết Credit! Vui lòng nạp thêm để nghe Audio.");
         }
         throw new Error(data.error || "Không thể tải Audio.");
      }

      const byteCharacters = atob(data.data.audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/mp3" });
      const url = window.URL.createObjectURL(blob);
      
      setAudioUrl(url);
      addToast(`Đã tạo Audio (${Math.round(byteArray.length/1024)} KB) - Bạn bị trừ 1 Credit`, "success");
    } catch (error: any) {
      console.error(error);
      addToast(error.message, "error");
    } finally {
      setIsAudioLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
        <Icons.Lock className="w-12 h-12 mb-4 opacity-50" />
        <p>Vui lòng đăng nhập để xem Lịch sử.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Lịch sử Hoạt động</h2>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 disabled:opacity-50"
        >
          <Icons.RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Loading history...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có hoạt động nào.</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
                    {job.type === "BATCH_DOWNLOAD" ? "TẢI CHƯƠNG TRUYỆN MASS" : job.type}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 space-y-1">
                    <p>Mã: <span className="font-mono">{job.id.split("-")[0]}</span></p>
                    <p>Ngày: {new Date(job.created_at).toLocaleString()}</p>
                    {job.result_data?.storyUrl && <p className="truncate max-w-[200px] xl:max-w-md">Nguồn: {job.result_data.storyUrl}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      job.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                      job.status === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}>
                      {job.status} ({job.progress}%)
                    </span>
                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={deletingJobId === job.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Xóa tác vụ"
                    >
                      {deletingJobId === job.id ? <Icons.RefreshCw className="w-4 h-4 animate-spin" /> : <Icons.Trash className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {job.status === "COMPLETED" && (
                    <div className="flex flex-wrap items-center justify-end gap-2 mt-3">
                       <button
                         onClick={() => handlePreview(job)}
                         className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-500/20"
                       >
                         <Icons.Eye className="w-3.5 h-3.5" /> Xem Thử
                       </button>
                       <button
                         onClick={() => handleDownload(job, "epub")}
                         className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 rounded-lg transition-colors border border-orange-200 dark:border-orange-500/20"
                       >
                         <Icons.Download className="w-3.5 h-3.5" /> Tải EPUB
                       </button>
                       <button
                         onClick={() => handleDownload(job, "txt")}
                         className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-200 dark:border-purple-500/20"
                       >
                         <Icons.Download className="w-3.5 h-3.5" /> Tải TXT
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-black/20">
                 <div className="flex items-center gap-3 overflow-hidden">
                   <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate pr-4">
                      {isPreviewLoading ? "Đang tải dữ liệu..." : (previewContent?.title || "Đọc Thử Truyện")}
                   </h3>
                   {previewContent && !isPreviewLoading && (
                     <button
                       onClick={handlePlayAudio}
                       disabled={isAudioLoading || !!audioUrl}
                       className="flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-colors border border-green-200 dark:border-green-500/20 disabled:opacity-50"
                     >
                       {isAudioLoading ? (
                         <><Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" /> Tạo Audio...</>
                       ) : audioUrl ? (
                         <><Icons.Play className="w-3.5 h-3.5" /> Đã tạo</>
                       ) : (
                         <><Icons.SpeakerWave className="w-3.5 h-3.5" /> Nghe Audio (1 Credit)</>
                       )}
                     </button>
                   )}
                 </div>
                 <button 
                   onClick={() => { setIsPreviewOpen(false); setAudioUrl(null); setIsAudioLoading(false); }}
                   className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                 >
                   <Icons.XMark className="w-5 h-5" />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                 {isPreviewLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-4">
                       <Icons.RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                       <p className="text-gray-500 text-sm">Đang trích xuất tối đa 5 chương đầu từ Database...</p>
                    </div>
                 ) : previewContent ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-[#222]">
                       <pre className="whitespace-pre-wrap font-sans text-[15px] border-none">
                         {previewContent.text}
                       </pre>
                    </div>
                 ) : (
                    <div className="text-center text-red-500 p-8">Không có dữ liệu văn bản.</div>
                 )}
              </div>

              {/* Modal Footer - Audio Player */}
              {audioUrl && (
                <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a]">
                  <audio controls autoPlay className="w-full" src={audioUrl}>
                    Trình duyệt của bạn không hỗ trợ thẻ audio.
                  </audio>
                </div>
              )}

           </div>
        </div>
      )}

    </div>
  );
}
