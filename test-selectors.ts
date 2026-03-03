import * as cheerio from "cheerio";

async function run() {
    const url = "https://monkeydtruyen.com/ba-co-cuc-pham-khong-di-tranh-nan-vao-rung-sau-san-manh-thu/chuong-1.html";
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const selectors = [
        ".ql-editor.inner",
        ".ql-editor",
        "#chapter-content",
        ".reading-content",
        ".chapter-c",
        "#chapter-c",
        "#content",
        ".chapter-content",
        ".content-container"
    ];

    for (const sel of selectors) {
        const els = $(sel);
        console.log(`\nSelector: ${sel} - Found: ${els.length} elements`);
        if (els.length > 0) {
            console.log("   First el HTML start:", els.first().html()?.substring(0, 100).replace(/\n/g, "\\n"));
            console.log("   First el TEXT start:", els.first().text().substring(0, 100).replace(/\n/g, "\\n"));
        }
    }
}

run();
