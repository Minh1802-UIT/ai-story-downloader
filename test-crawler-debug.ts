import * as cheerio from "cheerio";

async function run() {
    const url = "https://monkeydtruyen.com/ba-co-cuc-pham-khong-di-tranh-nan-vao-rung-sau-san-manh-thu/chuong-1.html";
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const firstMatch = $(".ql-editor.inner, .ql-editor, .content-container, #content, .reading-content, .chapter-c, #chapter-c, .chapter-content").first();
    console.log("Class cua First match:", firstMatch.attr("class"));
    console.log("ID cua First match:", firstMatch.attr("id"));
    console.log("HTML First match: \n", firstMatch.html()?.substring(0, 500));
}

run();
