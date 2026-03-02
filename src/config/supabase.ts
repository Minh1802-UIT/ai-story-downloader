import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables."
  );
}

// Client dùng ở mọi nơi (Browser & Server Components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Shorthand Database type for Supabase generics
export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow };
      stories: { Row: StoryRow };
      chapters: { Row: ChapterRow };
      jobs: { Row: JobRow };
    };
  };
};
