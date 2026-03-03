import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: jobs, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(2);
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  if (!jobs || jobs.length === 0) {
    console.log("No jobs found");
    return;
  }

  const job = jobs[0];
  console.log("Latest Job ID:", job.id);
  console.log("Job Result Data:", job.result_data);

  const { downloadedUrls, storyUrl } = job.result_data;
  
  const urlToSlug = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split("/").filter(Boolean);
      return parts[parts.length - 2] || parts[parts.length - 1] || url;
    } catch {
      return encodeURIComponent(url).slice(0, 100);
    }
  };

  const extractChapterNumber = (url: string) => {
    const match = url.match(/(?:chuong|chapter|page)[/-](\d+)/i);
    return match ? parseInt(match[1]) : null;
  };

  const storySlug = urlToSlug(storyUrl || downloadedUrls[0]);
  console.log("Extracted Story Slug:", storySlug);

  const chapterNums = downloadedUrls.map(extractChapterNumber).filter(Boolean);
  console.log("Extracted Chapter Nums:", chapterNums);

  const { data: story } = await supabase
      .from("stories")
      .select("id, title")
      .eq("slug", storySlug)
      .single();

  if (!story) {
    console.log("ERROR 404: Story data not found in Database for slug:", storySlug);
    return;
  }
  console.log("Found story in DB:", story.title);

  const { data: chapters, error: chapError } = await supabase
      .from("chapters")
      .select("chapter_number, title")
      .eq("story_id", story.id)
      .in("chapter_number", chapterNums)
      .order("chapter_number", { ascending: true });

  if (chapError || !chapters || chapters.length === 0) {
      console.log("ERROR 404: Chapters data empty in Database");
      return;
  }
  console.log("Found chapters count:", chapters.length);
}

test();
