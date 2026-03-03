"use client";

import { useAuth } from "@/components/AuthProvider";

const features = [
  {
    title: "Tải Truyện Nhanh Chóng",
    description: "Hỗ trợ tải lẻ và tải hàng loạt các bộ truyện từ các nguồn phổ biến với dữ liệu chuẩn xác, không chứa quảng cáo.",
    icon: (
      <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bg: "bg-purple-50 dark:bg-purple-500/10",
  },
  {
    title: "AI Studio Tích Hợp",
    description: "Sử dụng sức mạnh của Gemni 2.0 Flash để dịch thuật, tóm tắt, viết lại nội dung với tốc độ cực nhanh.",
    icon: (
      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    title: "Tạo Audiobook Tự Động",
    description: "Biến hàng trăm chương truyện thành Audio với giọng đọc tự nhiên, hỗ trợ đa ngôn ngữ và tốc độ đọc tùy biến.",
    icon: (
      <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    bg: "bg-pink-50 dark:bg-pink-500/10",
  },
  {
    title: "Lưu Trữ Đám Mây",
    description: "Toàn bộ lịch sử xử lý, file txt, dữ liệu audio được đồng bộ và lưu trữ bảo mật trên đám mây.",
    icon: (
      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    bg: "bg-green-50 dark:bg-green-500/10",
  },
];

export default function LandingPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 selection:bg-purple-300 selection:text-purple-900 relative flex flex-col items-center justify-center py-20 overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-in-out"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-in-out"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Phase 2 Is Now Live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            <span className="block mb-2">Biến Nội Dung Thành</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400">
               Tài Sản Của Bạn
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
            Story Commander V2 – Giải pháp toàn diện để Scraping, Xử lý bằng Trí tuệ nhân tạo và Chuyển đổi văn bản thành Audiobooks chỉ với vài cú click chuột.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={signInWithGoogle}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white dark:bg-white dark:text-black rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
              <span className="block transition-transform group-hover:translate-x-1">→</span>
            </button>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-500">Tặng miễn phí 100 Credits lần đầu</p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          {features.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* Footer minimal */}
      <div className="absolute bottom-6 text-center w-full z-10 animate-in fade-in duration-1000 delay-500">
        <p className="text-sm font-medium text-gray-400">© 2026 Story Commander V2. Thuyết kế bởi Antigravity.</p>
      </div>

    </div>
  );
}
