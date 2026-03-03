import { monkeyService } from "./src/services/monkeyService";

async function testEngine() {
    const url = "https://monkeydtruyen.com/ba-co-cuc-pham-khong-di-tranh-nan-vao-rung-sau-san-manh-thu/chapter-1.html";
    const svc = monkeyService();
    console.log("---- Testing Core Crawler ----");
    const result = await svc.getMonkeyUrl(url);
    
    console.log("\nTitle: " + result.title);
    if (!result.content || result.content.includes("Không tìm thấy nội dung")) {
        console.log("\x1b[31mStatus: FAILED - " + result.content + "\x1b[0m");
    } else {
        const preview = result.content.substring(0, 150).replace(/\n/g, " | ");
        console.log("\x1b[32mStatus: SUCCESS - Preview:\x1b[0m");
        console.log(preview + "...");
    }
}
testEngine();
