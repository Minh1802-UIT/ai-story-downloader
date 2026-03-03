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

  const handleDownload = async (job: JobData) => {
    if (job.status !== "COMPLETED") {
      addToast("Job chưa hoàn thành.", "error");
      return;
    }
    
    // API endpoint sẽ là /api/jobs/download
    try {
      addToast("Đang chuẩn bị file tải xuống...", "info");
      const res = await fetch(`/api/jobs/download?jobId=${job.id}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Không thể tải file, có lỗi server.");
      }

      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.split('filename="')[1]?.replace('"', '') || `Story_Download_${job.id.slice(0, 5)}.txt`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      addToast("Tải xuống thành công!", "success");
    } catch (err: any) {
      console.error(err);
      addToast("Tải xuống thất bại: " + err.message, "error");
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
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    job.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                    job.status === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  }`}>
                    {job.status} ({job.progress}%)
                  </span>
                  
                  {job.status === "COMPLETED" && (
                    <button
                      onClick={() => handleDownload(job)}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-200 dark:border-purple-500/20"
                    >
                      <Icons.Download className="w-3.5 h-3.5" /> Tải Lại
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
