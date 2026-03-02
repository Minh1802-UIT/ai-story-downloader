"use client";

import { useAuth } from "@/components/AuthProvider";

export function UserMenu() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                   bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        {/* Google Icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Đăng nhập
      </button>
    );
  }

  // Đã đăng nhập: Hiển thị Avatar + Credits + Nút Sign Out
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string) || user.email || "User";

  return (
    <div className="flex items-center gap-2">
      {/* Credits Badge */}
      {profile && (
        <span className="px-2 py-1 rounded-full text-xs font-semibold
                         bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
                         border border-amber-200 dark:border-amber-700">
          ✨ {profile.credits} credits
        </span>
      )}

      {/* User Dropdown */}
      <div className="relative group">
        <button className="flex items-center gap-1.5 rounded-full ring-2 ring-transparent
                           hover:ring-violet-400 transition-all">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center
                            bg-violet-600 text-white text-sm font-semibold">
              {displayName[0].toUpperCase()}
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl
                        bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-150 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>

          <button
            onClick={signOut}
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
