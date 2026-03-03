import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  content.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return env;
}

async function purgeCorruptCache() {
  try {
      const env = loadEnv();
      const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log("Starting purge for ", SUPABASE_URL);
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/chapters?select=id&raw_content=like.Lỗi: Không tìm thấy nội dung*`, {
         headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
         }
      });
      
      const chapters = await res.json();
      
      if (!Array.isArray(chapters) || chapters.length === 0) {
          console.log("No corrupt chapters found. Cache is clean.");
          return;
      }
      
      console.log(`Found ${chapters.length} corrupt chapters. Purging...`);
      
      const idsToDelete = chapters.map((c: any) => c.id).join(",");
      
      const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/chapters?id=in.(${idsToDelete})`, {
         method: "DELETE",
         headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
         }
      });
      
      if (deleteRes.ok) {
         console.log("Successfully purged corrupt chapters from DB.");
      } else {
         console.error("Delete error:", await deleteRes.text());
      }
  } catch (err) {
      console.error(err);
  }
}

purgeCorruptCache();
