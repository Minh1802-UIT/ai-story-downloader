
import { monkeyService } from "./src/services/monkeyService.ts";

const TARGET_URL = "https://truyenfull.vision/luu-day-than-y-mang-theo-khong-gian-chay-nan/";
const TARGET_CHAPTER_URL = "https://truyenfull.vision/luu-day-than-y-mang-theo-khong-gian-chay-nan/chuong-1/";

async function run() {
    console.log("--- DEBUG START (Fixed) ---");
    const service = monkeyService();

    // 2. Test Content Parsing
    console.log(`\n[Test] getMonkeyUrl: ${TARGET_CHAPTER_URL}`);
    const contentRes = await service.getMonkeyUrl(TARGET_CHAPTER_URL);
    console.log("Title:", contentRes.title);
    
    if (contentRes.content.includes("Lỗi:")) {
        console.error("Content Error:", contentRes.content);
    } else {
        console.log("SUCCESS! Content Preview:");
        console.log(contentRes.content.substring(0, 300).replace(/\n/g, " "));
    }
}

run();
