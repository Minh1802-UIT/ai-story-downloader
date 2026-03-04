"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@src/config/supabase";

type TabType = "users" | "jobs";

export default function AdminPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setErrorMsg(data.error || "Failed to fetch users");
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
    setLoading(false);
  };

  const fetchJobs = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = session?.access_token;
      const res = await fetch("/api/admin/jobs?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      } else {
        setErrorMsg(data.error || "Failed to fetch jobs");
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    if (activeTab === "users") fetchUsers();
    else fetchJobs();
  }, [activeTab, session]);

  // --- Actions ---
  const handleEditCredit = async (userId: string, currentCredits: number) => {
    const amountStr = prompt(`Cộng hoặc trừ điểm cho user (Nhập số âm để trừ).\nSố dư hiện tại: ${currentCredits}`);
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return alert("Số không hợp lệ");

    const token = session?.access_token;
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, amount })
      });
      const obj = await res.json();
      if (obj.success) {
        alert("Thành công!");
        fetchUsers();
      } else {
        alert("Lỗi: " + obj.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm("Bạn có chắc chắn muốn huỷ Job này không?")) return;
    
    const token = session?.access_token;
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ jobId })
      });
      const obj = await res.json();
      if (obj.success) {
        alert("Đã huỷ Job");
        fetchJobs();
      } else {
        alert("Lỗi: " + obj.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };


  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === "users" ? "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/10 border-b-2 border-fuchsia-600" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
        >
          🧑‍🤝‍🧑 Quản lý Người Dùng ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab("jobs")}
          className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === "jobs" ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/10 border-b-2 border-cyan-600" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
        >
          ⚙️ Giám sát Tiến Trình
        </button>
      </div>

      <div className="p-6">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">
            <strong>Critical Error: </strong> {errorMsg}
          </div>
        )}

        {loading ? (
             <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-fuchsia-500 border-t-transparent rounded-full"></div>
             </div>
        ) : (
          <>
            {/* View: USERS */}
            {activeTab === "users" && (
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-gray-100 dark:border-gray-800 text-sm text-gray-400">
                            <th className="pb-3 px-4 font-bold">Tài khoản</th>
                            <th className="pb-3 px-4 font-bold">Role</th>
                            <th className="pb-3 px-4 font-bold">Tài sản (Credit)</th>
                            <th className="pb-3 px-4 font-bold text-right">Hành động</th>
                         </tr>
                      </thead>
                      <tbody className="text-sm border-b border-gray-100 dark:border-gray-800">
                      {users.map(u => (
                         <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-4 px-4">
                                <p className="font-bold text-gray-900 dark:text-gray-100">{u.email}</p>
                                <p className="text-xs text-gray-400 monospace">ID: {u.id.slice(0, 8)}...</p>
                            </td>
                            <td className="py-4 px-4">
                               <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-fuchsia-100 text-fuchsia-700" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                                 {u.role.toUpperCase()}
                               </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-amber-600 dark:text-amber-500 font-bold">
                               ✨ {u.credits}
                            </td>
                            <td className="py-4 px-4 text-right">
                               <button 
                                 onClick={() => handleEditCredit(u.id, u.credits)}
                                 className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded hover:bg-fuchsia-100 hover:text-fuchsia-700 transition-colors text-xs"
                               >
                                 Sửa Credit
                               </button>
                            </td>
                         </tr>
                      ))}
                      </tbody>
                   </table>
                </div>
            )}

            {/* View: JOBS */}
            {activeTab === "jobs" && (
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-gray-100 dark:border-gray-800 text-sm text-gray-400">
                            <th className="pb-3 px-4 font-bold">Loại / Chủ sở hữu</th>
                            <th className="pb-3 px-4 font-bold">Trạng thái</th>
                            <th className="pb-3 px-4 font-bold">Tiến độ</th>
                            <th className="pb-3 px-4 font-bold text-right">Hành động</th>
                         </tr>
                      </thead>
                      <tbody className="text-sm border-b border-gray-100 dark:border-gray-800">
                      {jobs.map(j => (
                         <tr key={j.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-4 px-4">
                                <p className="font-bold text-gray-900 dark:text-gray-100">{j.type}</p>
                                <p className="text-xs text-gray-500">{j.profiles?.email || "Guest"}</p>
                            </td>
                            <td className="py-4 px-4">
                               <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                 j.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                                 j.status === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : 
                                 "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                               }`}>
                                 {j.status}
                               </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-500">
                               {j.progress}%
                            </td>
                            <td className="py-4 px-4 text-right">
                               {(j.status === "QUEUED" || j.status === "PROCESSING") && (
                                   <button 
                                     onClick={() => handleCancelJob(j.id)}
                                     className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 font-bold rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-xs"
                                   >
                                     Huỷ Bỏ
                                   </button>
                               )}
                            </td>
                         </tr>
                      ))}
                      </tbody>
                   </table>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
