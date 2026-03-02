
import { monkeyService } from "./src/services/monkeyService.ts";

const TARGET_URL = "https://monkeydtruyen.com/bac-ca-bao-nha-toi-gop-tien-cho-anh-ho-di-du-hoc.html";
const TARGET_CHAPTER_URL = "https://monkeydtruyen.com/bac-ca-bao-nha-toi-gop-tien-cho-anh-ho-di-du-hoc/chuong-1.html";

async function run() {
    console.log("--- REGRESSION TEST START (MonkeyD) ---");
    const service = monkeyService();

    // 1. Test List Parsing
    console.log(`\n[Test] getChapterList: ${TARGET_URL}`);
    const listRes = await service.getChapterList(TARGET_URL);
    if (listRes.success) {
        console.log(`Success! Found ${listRes.chapters?.length} chapters.`);
        if (listRes.chapters && listRes.chapters.length > 0) {
            console.log("Sample Chapter 1:", listRes.chapters[0]);
        } else {
            console.log("Warning: 0 chapters found.");
        }
    } else {
        console.error("List Error:", listRes.error);
    }

    // 2. Test Content Parsing
    console.log(`\n[Test] getMonkeyUrl: ${TARGET_CHAPTER_URL}`);
    const contentRes = await service.getMonkeyUrl(TARGET_CHAPTER_URL);
    console.log("Title:", contentRes.title);
    
    if (contentRes.content.includes("Lỗi:") || !contentRes.content.trim()) {
        console.error("Content Error:", contentRes.content);
    } else {
        console.log("SUCCESS! Content Preview:");
        console.log(contentRes.content.substring(0, 100).replace(/\n/g, " "));
        
        // Assertions
        if (contentRes.content.length > 100) console.log("Assertion: Content length > 100 [PASS]");
        else console.log("Assertion: Content length > 100 [FAIL]");
    }
}

run();
