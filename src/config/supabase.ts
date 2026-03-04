import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Fallback if missing, but should be set in .env

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables."
  );
}

// Client dùng chung (Browser & Server Components với Anon Context)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client có quyền cao nhất (Chỉ dùng Backend/Admin, Bypass RLS)
export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Hàm tạo Client nhúng Token Xác Thực (Dùng bên trong API Server Route)
export function createAuthClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// ----- Type Definitions (Sync với Database Schema) -----

export type ProfileRow = {
  id: string;
  email: string;
  credits: number;
  created_at: string;
};

export type StoryRow = {
  id: string;
  slug: string;
  source_url: string;
  title: string;
  created_at: string;
};

export type ChapterRow = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  raw_content: string;
  ai_rewritten_content: string | null;
  audio_url: string | null;
  created_at: string;
};

export type JobRow = {
  id: string;
  user_id: string | null;
  type: "BATCH_DOWNLOAD" | "AI_REWRITE" | "TTS_GENERATE";
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  result_data: Record<string, unknown> | null;
  created_at: string;
};


