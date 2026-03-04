"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

type TabType = "overview" | "users" | "jobs";

type Stats = {
  totalUsers: number;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  processingJobs: number;
  totalCreditsInSystem: number;
};

export default function AdminPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const token = session?.access_token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const res = await fetch("/api/admin/stats", { headers: authHeaders });
      const data = await res.json();
      if (data.success) setStats(data.data);
      else setErrorMsg(data.error);
    } catch (e: any) { setErrorMsg(e.message); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const res = await fetch("/api/admin/users", { headers: authHeaders });
      const data = await res.json();
      if (data.success) setUsers(data.data);
      else setErrorMsg(data.error);
    } catch (e: any) { setErrorMsg(e.message); }
    setLoading(false);
  };

  const fetchJobs = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const res = await fetch("/api/admin/jobs?limit=100", { headers: authHeaders });
      const data = await res.json();
      if (data.success) setJobs(data.data);
      else setErrorMsg(data.error);
    } catch (e: any) { setErrorMsg(e.message); }
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    if (activeTab === "overview") fetchStats();
    else if (activeTab === "users") fetchUsers();
    else fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, session]);

  // --- Actions ---
  const handleEditCredit = async (userId: string, currentCredits: number) => {
    const amountStr = prompt(`Cộng hoặc trừ điểm (Nhập số âm để trừ).\nSố dư hiện tại: ${currentCredits}`);
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return alert("Số không hợp lệ");

    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ userId, amount })
      });
      const obj = await res.json();
      if (obj.success) { alert("Thành công!"); fetchUsers(); }
      else alert("Lỗi: " + obj.error);
    } catch (e: any) { alert("Lỗi: " + e.message); }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm("Bạn có chắc chắn muốn huỷ Job này không?")) return;
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ jobId })
      });
      const obj = await res.json();
      if (obj.success) { alert("Đã huỷ Job"); fetchJobs(); }
      else alert("Lỗi: " + obj.error);
    } catch (e: any) { alert("Lỗi: " + e.message); }
  };

  // --- Stat Card ---
  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
    <div className={`bg-white dark:bg-[#151515] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );

  const tabs: { key: TabType; label: string; icon: string; color: string }[] = [
    { key: "overview", label: "Tổng Quan", icon: "📊", color: "from-violet-500 to-fuchsia-500" },
    { key: "users",    label: "Người Dùng", icon: "👥", color: "from-fuchsia-500 to-pink-500" },
    { key: "jobs",     label: "Tiến Trình", icon: "⚙️", color: "from-cyan-500 to-blue-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white dark:bg-[#111] rounded-2xl p-1.5 border border-gray-200 dark:border-gray-800 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === tab.key
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 text-sm font-medium">
          ❌ {errorMsg}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-fuchsia-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* ===== TAB: OVERVIEW ===== */}
          {activeTab === "overview" && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard icon="👥" label="Tổng Thành Viên" value={stats.totalUsers} color="text-violet-600 dark:text-violet-400" />
              <StatCard icon="📦" label="Tổng Tác Vụ" value={stats.totalJobs} color="text-blue-600 dark:text-blue-400" />
              <StatCard icon="✅" label="Hoàn Thành" value={stats.completedJobs} color="text-emerald-600 dark:text-emerald-400" />
              <StatCard icon="❌" label="Thất Bại" value={stats.failedJobs} color="text-red-600 dark:text-red-400" />
              <StatCard icon="⏳" label="Đang Chạy" value={stats.processingJobs} color="text-amber-600 dark:text-amber-400" />
              <StatCard icon="✨" label="Tổng Credit Trong Hệ Thống" value={stats.totalCreditsInSystem.toLocaleString()} color="text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
          )}

          {/* ===== TAB: USERS ===== */}
          {activeTab === "users" && (
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-5 font-bold">Tài khoản</th>
                      <th className="py-4 px-5 font-bold">Role</th>
                      <th className="py-4 px-5 font-bold">Credit</th>
                      <th className="py-4 px-5 font-bold text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{u.email}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {u.id.slice(0, 12)}…</p>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.role === "admin"
                              ? "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}>
                            {(u.role || "user").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-amber-600 dark:text-amber-400 font-bold">
                          ✨ {u.credits}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleEditCredit(u.id, u.credits)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 hover:text-fuchsia-700 dark:hover:text-fuchsia-400 transition-colors text-xs"
                          >
                            💰 Sửa Credit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="py-12 text-center text-gray-400 text-sm">Chưa có dữ liệu người dùng.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== TAB: JOBS ===== */}
          {activeTab === "jobs" && (
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-5 font-bold">Loại / Chủ sở hữu</th>
                      <th className="py-4 px-5 font-bold">Trạng thái</th>
                      <th className="py-4 px-5 font-bold">Tiến độ</th>
                      <th className="py-4 px-5 font-bold">Thời gian</th>
                      <th className="py-4 px-5 font-bold text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{j.type}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{j.profiles?.email || "Guest"}</p>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            j.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                            j.status === "FAILED"    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                            j.status === "PROCESSING"? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                                       "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}>
                            {j.status}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${j.status === "COMPLETED" ? "bg-emerald-500" : j.status === "FAILED" ? "bg-red-500" : "bg-cyan-500"}`} style={{ width: `${j.progress || 0}%` }} />
                            </div>
                            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">{j.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-xs text-gray-500 font-mono">
                          {new Date(j.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {(j.status === "QUEUED" || j.status === "PROCESSING") && (
                            <button
                              onClick={() => handleCancelJob(j.id)}
                              className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-xs"
                            >
                              🛑 Huỷ
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Chưa có tác vụ nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
