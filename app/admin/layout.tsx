"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!profile || profile.role !== "admin") {
        router.push("/");
      }
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600"></div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-5">
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-cyan-500 inline-block">
                Tổ Hợp Quản Trị Hệ Thống
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                Khu vực giới hạn. Thiết bị này ghi nhận bạn là: <span className="text-fuchsia-500 font-bold">{profile.email}</span>
            </p>
        </div>
        {children}
      </div>
    </div>
  );
}
