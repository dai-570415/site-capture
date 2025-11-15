// ver05
// import express from "express";
// import puppeteer, { Browser, Page } from "puppeteer-core";
// import archiver from "archiver";
// import pLimit from "p-limit";
// import sharp from "sharp";

// const app = express();
// app.use(express.json({ limit: "1mb" }));

// const DEFAULT_MAX_PAGES = 50;
// const DEFAULT_CONCURRENCY = 3;
// const VIEWPORT = { width: 1280, height: 800 };

// // ------------------ オリジンチェック ------------------
// function isSameOrigin(root: URL, other: URL) {
//     return root.hostname === other.hostname && root.protocol === other.protocol;
// }

// // ------------------ ページ全体スクロール ------------------
// async function autoScroll(page: Page) {
//     await page.evaluate(async () => {
//         await new Promise<void>((resolve) => {
//             let totalHeight = 0;
//             const distance = 200;
//             const timer = setInterval(() => {
//                 const scrollHeight = document.body.scrollHeight;
//                 window.scrollBy(0, distance);
//                 totalHeight += distance;
//                 if (totalHeight >= scrollHeight) {
//                     clearInterval(timer);
//                     resolve();
//                 }
//             }, 200);
//         });
//     });
// }

// app.post("/capture", async (req, res) => {
//     const { startUrl, maxPages = DEFAULT_MAX_PAGES, concurrency = DEFAULT_CONCURRENCY } = req.body;
//     if (!startUrl) return res.status(400).json({ error: "startUrl is required" });

//     let browser: Browser | null = null;

//     try {
//         const start = new URL(startUrl);

//         // ZIP ヘッダー
//         res.setHeader("Content-Type", "application/zip");
//         res.setHeader("Content-Disposition", `attachment; filename="screenshots.zip"`);
//         const archive = archiver("zip");
//         archive.pipe(res);

//         // Puppeteer 起動
//         browser = await puppeteer.launch({
//             headless: false,
//             executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
//             args: ["--no-sandbox", "--disable-setuid-sandbox"]
//         });

//         const seen = new Set<string>();
//         const queue: string[] = [start.href];
//         seen.add(start.href);

//         const limit = pLimit(concurrency);
//         let processed = 0;

//         // ------------------ BFS キュー処理 ------------------
//         while (queue.length > 0 && processed < maxPages) {
//             const url = queue.shift()!;
//             const task: Promise<void> = limit(async () => {
//                 let page: Page | null = null;
//                 try {
//                     page = await browser!.newPage();
//                     await page.setViewport(VIEWPORT);
//                     console.log("Navigating:", url);

//                     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
//                     await new Promise(resolve => setTimeout(resolve, 1000));

//                     // ------------------ ヘッダーキャプチャ ------------------
//                     let headerBuffer: Buffer | null = null;
//                     if (page) { // page が null でないことを確認
//                         try {
//                             const handle = await page.$('header, .header, .sticky, .fixed');
//                             if (handle) { // handle が null でないことを確認
//                                 headerBuffer = await handle.screenshot({ type: 'png' }) as Buffer;
//                             }
//                         } catch (e) {
//                             console.log("No header found or failed:", e);
//                         }
//                     }

//                     // ------------------ ヘッダー非表示 & スクロール ------------------
//                     await page.evaluate(() => {
//                         const headers = document.querySelectorAll('header, .header, .sticky, .fixed');
//                         headers.forEach(h => (h as HTMLElement).style.display = 'none');
//                     });

//                     await autoScroll(page);
//                     await new Promise(resolve => setTimeout(resolve, 500));

//                     // ------------------ fullPage スクリーンショット ------------------
//                     let pageBuffer: Buffer;
//                     try {
//                         pageBuffer = await page.screenshot({ fullPage: true }) as Buffer;
//                     } catch (err) {
//                         console.error("Screenshot failed for", url, err);
//                         return;
//                     }

//                     // ------------------ ヘッダーとページを合成 ------------------
//                     let finalBuffer = pageBuffer;
//                     if (headerBuffer) {
//                         const headerMeta = await sharp(headerBuffer).metadata();
//                         const pageMeta = await sharp(pageBuffer).metadata();
//                         finalBuffer = await sharp({
//                             create: {
//                                 width: pageMeta.width!,
//                                 height: (headerMeta.height || 0) + (pageMeta.height || 0),
//                                 channels: 4,
//                                 background: 'white'
//                             }
//                         })
//                             .composite([
//                                 { input: headerBuffer!, top: 0, left: 0 },
//                                 { input: pageBuffer, top: headerMeta.height || 0, left: 0 }
//                             ])
//                             .png()
//                             .toBuffer();
//                     }

//                     // ファイル名生成
//                     const u = new URL(url);
//                     let filename = u.pathname.replace(/\/$/, "");
//                     if (!filename) filename = "index";
//                     filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
//                     if (filename === "") filename = "page_" + Math.random().toString(36).slice(2, 8);
//                     const filepath = `${u.hostname}_${filename}.png`;

//                     archive.append(finalBuffer, { name: filepath });
//                     processed++;

//                     // ------------------ 下層リンク抽出 ------------------
//                     const links: (string | null)[] = await page.$$eval("a", els =>
//                         els.map(e => e.getAttribute("href"))
//                     );

//                     for (const href of links) {
//                         if (!href) continue;
//                         try {
//                             const resolved = new URL(href, url);
//                             if ((resolved.protocol === "http:" || resolved.protocol === "https:") &&
//                                 isSameOrigin(start, resolved)) {
//                                 const normalized = resolved.href.split("#")[0];
//                                 if (!seen.has(normalized) && seen.size < maxPages * 5) {
//                                     seen.add(normalized);
//                                     queue.push(normalized);
//                                 }
//                             }
//                         } catch { }
//                     }

//                 } catch (e) {
//                     console.error("task error:", e);
//                 } finally {
//                     if (page) await page.close();
//                 }
//             });

//             await task;
//         }

//         await archive.finalize();

//     } catch (err) {
//         console.error(err);
//         if (!res.headersSent) res.status(500).json({ error: String(err) });
//     } finally {
//         if (browser) await browser.close();
//     }
// });

// app.get("/ping", (req, res) => res.json({ ok: true }));

// const port = 4000;
// app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));



// ver04
// import express from "express";
// import puppeteer, { Browser, Page } from "puppeteer-core";
// import archiver from "archiver";
// import pLimit from "p-limit";

// const app = express();
// app.use(express.json({ limit: "1mb" }));

// const DEFAULT_MAX_PAGES = 50;
// const DEFAULT_CONCURRENCY = 3;
// const VIEWPORT = { width: 1280, height: 800 };

// // ------------------ オリジンチェック ------------------
// function isSameOrigin(root: URL, other: URL) {
//     return root.hostname === other.hostname && root.protocol === other.protocol;
// }

// // ------------------ ページ全体スクロール ------------------
// async function autoScroll(page: Page) {
//     await page.evaluate(async () => {
//         await new Promise<void>((resolve) => {
//             let totalHeight = 0;
//             const distance = 200;
//             const timer = setInterval(() => {
//                 const scrollHeight = document.body.scrollHeight;
//                 window.scrollBy(0, distance);
//                 totalHeight += distance;
//                 if (totalHeight >= scrollHeight) {
//                     clearInterval(timer);
//                     resolve();
//                 }
//             }, 200);
//         });
//     });
// }

// app.post("/capture", async (req, res) => {
//     const { startUrl, maxPages = DEFAULT_MAX_PAGES, concurrency = DEFAULT_CONCURRENCY } = req.body;
//     if (!startUrl) return res.status(400).json({ error: "startUrl is required" });

//     let browser: Browser | null = null;

//     try {
//         const start = new URL(startUrl);

//         // ZIP ヘッダー
//         res.setHeader("Content-Type", "application/zip");
//         res.setHeader("Content-Disposition", `attachment; filename="screenshots.zip"`);
//         const archive = archiver("zip");
//         archive.pipe(res);

//         // Puppeteer 起動
//         browser = await puppeteer.launch({
//             headless: false,
//             executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
//             args: ["--no-sandbox", "--disable-setuid-sandbox"]
//         });

//         const seen = new Set<string>();
//         const queue: string[] = [start.href];
//         seen.add(start.href);

//         const limit = pLimit(concurrency);
//         let processed = 0;

//         // ------------------ BFS キュー処理 ------------------
//         while (queue.length > 0 && processed < maxPages) {
//             const url = queue.shift()!;
//             const task: Promise<void> = limit(async () => {
//                 let page: Page | null = null;
//                 try {
//                     page = await browser!.newPage();
//                     await page.setViewport(VIEWPORT);
//                     console.log("Navigating:", url);

//                     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
//                     await new Promise(resolve => setTimeout(resolve, 1000));

//                     // ↓ ヘッダー固定解除
//                     await page.evaluate(() => {
//                         const headers = document.querySelectorAll('header, .header, .sticky, .fixed');
//                         headers.forEach(h => {
//                             (h as HTMLElement).style.position = 'static';
//                         });
//                     });

//                     // ↓ lazy-load 対応スクロール
//                     await autoScroll(page);
//                     await new Promise(resolve => setTimeout(resolve, 500));

//                     // スクリーンショット取得
//                     let buffer: Buffer;
//                     try {
//                         buffer = await page.screenshot({ fullPage: true }) as Buffer;
//                         console.log("Screenshot buffer length:", buffer.length);

//                         const u = new URL(url);
//                         let filename = u.pathname.replace(/\/$/, "");
//                         if (!filename) filename = "index";
//                         filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
//                         if (!filename) filename = "page_" + Math.random().toString(36).slice(2, 8);
//                         const filepath = `${u.hostname}_${filename}.png`;

//                         archive.append(buffer, { name: filepath });
//                         processed++;
//                     } catch (err) {
//                         console.error("Screenshot failed for", url, err);
//                         return;
//                     }

//                     // 下層リンク抽出
//                     const links: (string | null)[] = await page.$$eval("a", els =>
//                         els.map(e => e.getAttribute("href"))
//                     );

//                     for (const href of links) {
//                         if (!href) continue;
//                         try {
//                             const resolved = new URL(href, url);
//                             if ((resolved.protocol === "http:" || resolved.protocol === "https:") &&
//                                 isSameOrigin(start, resolved)) {
//                                 const normalized = resolved.href.split("#")[0];
//                                 if (!seen.has(normalized) && seen.size < maxPages * 5) {
//                                     seen.add(normalized);
//                                     queue.push(normalized);
//                                 }
//                             }
//                         } catch { }
//                     }

//                 } catch (e) {
//                     console.error("task error:", e);
//                 } finally {
//                     if (page) await page.close();
//                 }
//             });

//             // BFS 待機
//             await task;
//         }

//         await archive.finalize();

//     } catch (err) {
//         console.error(err);
//         if (!res.headersSent) res.status(500).json({ error: String(err) });
//     } finally {
//         if (browser) await browser.close();
//     }
// });

// app.get("/ping", (req, res) => res.json({ ok: true }));

// const port = 4000;
// app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));


// ver03-2
import express from "express";
import puppeteer, { Browser, Page } from "puppeteer-core";
import archiver from "archiver";
import pLimit from "p-limit";
import sharp from "sharp";

const app = express();
app.use(express.json({ limit: "1mb" }));

const DEFAULT_MAX_PAGES = 50;
const DEFAULT_CONCURRENCY = 3;
const VIEWPORT = { width: 1280, height: 800 };

function isSameOrigin(root: URL, other: URL) {
    return root.hostname === other.hostname && root.protocol === other.protocol;
}

// ページ全体スクロール
async function autoScroll(page: Page) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 200;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });
}

app.post("/capture", async (req, res) => {
    const { startUrl, maxPages = DEFAULT_MAX_PAGES, concurrency = DEFAULT_CONCURRENCY } = req.body;
    if (!startUrl) return res.status(400).json({ error: "startUrl is required" });

    let browser: Browser | null = null;

    try {
        const start = new URL(startUrl);

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="screenshots.zip"`);
        const archive = archiver("zip");
        archive.pipe(res);

        browser = await puppeteer.launch({
            headless: false,
            executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const seen = new Set<string>();
        const queue: string[] = [start.href];
        seen.add(start.href);

        const limit = pLimit(concurrency);
        let processed = 0;

        while (queue.length > 0 && processed < maxPages) {
            const url = queue.shift()!;
            const task: Promise<void> = limit(async () => {
                let page: Page | null = null;
                try {
                    page = await browser!.newPage();
                    await page.setViewport(VIEWPORT);
                    console.log("Navigating:", url);

                    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // ------------------ ヘッダーキャプチャ ------------------
                    let headerBuffer: Buffer | null = null;
                    if (page) {
                        try {
                            const handle = await page.$('header, .header, .sticky, .fixed');
                            if (handle) {
                                headerBuffer = await handle.screenshot({ type: 'png' }) as Buffer;
                            }
                        } catch (e) {
                            console.log("No header found or failed:", e);
                        }
                    }

                    // ヘッダーを非表示にしてスクロール
                    await page.evaluate(() => {
                        const headers = document.querySelectorAll('header, .header, .sticky, .fixed');
                        headers.forEach(h => (h as HTMLElement).style.display = 'none');
                    });
                    await autoScroll(page);
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // fullPage スクショ
                    let pageBuffer: Buffer;
                    try {
                        pageBuffer = await page.screenshot({ fullPage: true }) as Buffer;
                    } catch (err) {
                        console.error("Screenshot failed for", url, err);
                        return;
                    }

                    // ------------------ ヘッダーとページを合成 ------------------
                    let finalBuffer = pageBuffer;
                    if (headerBuffer) {
                        const headerMeta = await sharp(headerBuffer).metadata();
                        const pageMeta = await sharp(pageBuffer).metadata();
                        finalBuffer = await sharp({
                            create: {
                                width: pageMeta.width!,
                                height: (headerMeta.height || 0) + (pageMeta.height || 0),
                                channels: 4,
                                background: 'white'
                            }
                        })
                            .composite([
                                { input: headerBuffer!, top: 0, left: 0 },
                                { input: pageBuffer, top: headerMeta.height || 0, left: 0 }
                            ])
                            .png()
                            .toBuffer();
                    }

                    // ファイル名生成
                    const u = new URL(url);
                    let filename = u.pathname.replace(/\/$/, "");
                    if (!filename) filename = "index";
                    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
                    if (filename === "") filename = "page_" + Math.random().toString(36).slice(2, 8);
                    const filepath = `${u.hostname}_${filename}.png`;

                    archive.append(finalBuffer, { name: filepath });
                    processed++;

                    // ------------------ 下層リンク抽出 ------------------
                    const links: (string | null)[] = await page.$$eval("a", els =>
                        els.map(e => e.getAttribute("href"))
                    );
                    for (const href of links) {
                        if (!href) continue;
                        try {
                            const resolved = new URL(href, url);
                            if ((resolved.protocol === "http:" || resolved.protocol === "https:") &&
                                isSameOrigin(start, resolved)) {
                                const normalized = resolved.href.split("#")[0];
                                if (!seen.has(normalized) && seen.size < maxPages * 5) {
                                    seen.add(normalized);
                                    queue.push(normalized);
                                }
                            }
                        } catch { }
                    }

                } catch (e) {
                    console.error("task error:", e);
                } finally {
                    if (page) await page.close();
                }
            });

            await task;
        }

        await archive.finalize();

    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ error: String(err) });
    } finally {
        if (browser) await browser.close();
    }
});

app.get("/ping", (req, res) => res.json({ ok: true }));

const port = 4000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));



// ver03-1
// import express from "express";
// import puppeteer, { Browser, Page } from "puppeteer-core";
// import archiver from "archiver";
// import pLimit from "p-limit";

// const app = express();
// app.use(express.json({ limit: "1mb" }));

// const DEFAULT_MAX_PAGES = 50;
// const DEFAULT_CONCURRENCY = 3;
// const VIEWPORT = { width: 1280, height: 800 };

// // ------------------ オリジンチェック ------------------
// function isSameOrigin(root: URL, other: URL) {
//     return root.hostname === other.hostname && root.protocol === other.protocol;
// }

// // ------------------ ページ全体スクロール ------------------
// async function autoScroll(page: Page) {
//     await page.evaluate(async () => {
//         await new Promise<void>((resolve) => {
//             let totalHeight = 0;
//             const distance = 200;
//             const timer = setInterval(() => {
//                 const scrollHeight = document.body.scrollHeight;
//                 window.scrollBy(0, distance);
//                 totalHeight += distance;

//                 if (totalHeight >= scrollHeight) {
//                     clearInterval(timer);
//                     resolve();
//                 }
//             }, 200);
//         });
//     });
// }

// app.post("/capture", async (req, res) => {
//     const { startUrl, maxPages = DEFAULT_MAX_PAGES, concurrency = DEFAULT_CONCURRENCY } = req.body;
//     if (!startUrl) return res.status(400).json({ error: "startUrl is required" });

//     let browser: Browser | null = null;

//     try {
//         const start = new URL(startUrl);

//         res.setHeader("Content-Type", "application/zip");
//         res.setHeader("Content-Disposition", `attachment; filename="screenshots.zip"`);

//         const archive = archiver("zip");
//         archive.pipe(res);

//         browser = await puppeteer.launch({
//             headless: false,
//             executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
//             args: ["--no-sandbox", "--disable-setuid-sandbox"]
//         });

//         const seen = new Set<string>();
//         const queue: string[] = [start.href];
//         seen.add(start.href);

//         const limit = pLimit(concurrency);
//         let processed = 0;

//         // ------------------ BFS キュー処理 ------------------
//         while (queue.length > 0 && processed < maxPages) {
//             const url = queue.shift()!;
//             const task: Promise<void> = limit(async () => {
//                 let page: Page | null = null;
//                 try {
//                     page = await browser!.newPage();
//                     await page.setViewport(VIEWPORT);
//                     console.log("Navigating:", url);

//                     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
//                     await new Promise(resolve => setTimeout(resolve, 1000));

//                     // ↓ lazy load 対応: ページを下までスクロール
//                     await autoScroll(page);
//                     await new Promise(resolve => setTimeout(resolve, 500));

//                     // ------------------ スクリーンショット取得 ------------------
//                     let buffer: Buffer;
//                     try {
//                         buffer = await page.screenshot({ fullPage: true }) as Buffer;
//                         console.log("Screenshot buffer length:", buffer.length);

//                         const u = new URL(url);
//                         let filename = u.pathname.replace(/\/$/, "");
//                         if (!filename) filename = "index";
//                         filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
//                         if (!filename) filename = "page_" + Math.random().toString(36).slice(2, 8);
//                         const filepath = `${u.hostname}_${filename}.png`;

//                         archive.append(buffer, { name: filepath });
//                         processed++;
//                     } catch (err) {
//                         console.error("Screenshot failed for", url, err);
//                         return;
//                     }

//                     // ------------------ 下層リンク抽出 ------------------
//                     const links: (string | null)[] = await page.$$eval("a", els =>
//                         els.map(e => e.getAttribute("href"))
//                     );

//                     for (const href of links) {
//                         if (!href) continue;
//                         try {
//                             const resolved = new URL(href, url);
//                             if ((resolved.protocol === "http:" || resolved.protocol === "https:") &&
//                                 isSameOrigin(start, resolved)) {
//                                 const normalized = resolved.href.split("#")[0];
//                                 if (!seen.has(normalized) && seen.size < maxPages * 5) {
//                                     seen.add(normalized);
//                                     queue.push(normalized);
//                                 }
//                             }
//                         } catch { }
//                     }

//                 } catch (e) {
//                     console.error("task error:", e);
//                 } finally {
//                     if (page) await page.close();
//                 }
//             });

//             // ------------------ BFS 待機 ------------------
//             await task;
//         }

//         await archive.finalize();

//     } catch (err) {
//         console.error(err);
//         if (!res.headersSent) res.status(500).json({ error: String(err) });
//     } finally {
//         if (browser) await browser.close();
//     }
// });

// app.get("/ping", (req, res) => res.json({ ok: true }));

// const port = 4000;
// app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));


// ver02
// import express from "express";
// import puppeteer, { Browser, Page } from "puppeteer-core";
// import archiver from "archiver";
// import pLimit from "p-limit";

// const app = express();
// app.use(express.json({ limit: "1mb" }));

// // ------------------ 定数 ------------------
// const DEFAULT_MAX_PAGES = 50;
// const DEFAULT_CONCURRENCY = 3;
// const VIEWPORT = { width: 1280, height: 800 };

// // ------------------ オリジンチェック関数 ------------------
// function isSameOrigin(root: URL, other: URL) {
//     return root.hostname === other.hostname && root.protocol === other.protocol;
// }

// // ------------------ Express POST /capture ------------------
// app.post("/capture", async (req, res) => {
//     const { startUrl, maxPages = DEFAULT_MAX_PAGES, concurrency = DEFAULT_CONCURRENCY } = req.body;
//     if (!startUrl) return res.status(400).json({ error: "startUrl is required" });

//     let browser: Browser | null = null;

//     try {
//         const start = new URL(startUrl);

//         // ------------------ ZIP ヘッダー ------------------
//         res.setHeader("Content-Type", "application/zip");
//         res.setHeader("Content-Disposition", `attachment; filename="screenshots.zip"`);

//         const archive = archiver("zip");
//         archive.pipe(res);

//         // ------------------ Puppeteer 起動 ------------------
//         browser = await puppeteer.launch({
//             headless: false, // 描画確認のため false
//             executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
//             args: ["--no-sandbox", "--disable-setuid-sandbox"]
//         });

//         const seen = new Set<string>();
//         const queue: string[] = [start.href];
//         seen.add(start.href);

//         const limit = pLimit(concurrency);
//         let processed = 0;

//         // ------------------ BFS キュー処理 ------------------
//         while (queue.length > 0 && processed < maxPages) {
//             const url = queue.shift()!;

//             // limit を使った並列処理
//             const task: Promise<void> = limit(async () => {
//                 let page: Page | null = null;
//                 try {
//                     page = await browser!.newPage();
//                     await page.setViewport(VIEWPORT);
//                     console.log("Navigating:", url);

//                     // ページ遷移
//                     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

//                     // JS描画待機（500ms では短い場合あり、2秒に延長）
//                     await new Promise(resolve => setTimeout(resolve, 2000));

//                     // ------------------ スクリーンショット取得 ------------------
//                     let buffer: Buffer;
//                     try {
//                         buffer = await page.screenshot({ fullPage: true }) as Buffer;
//                         console.log("Screenshot buffer length:", buffer.length);

//                         // ファイル名生成
//                         const u = new URL(url);
//                         let filename = u.pathname.replace(/\/$/, "");
//                         if (!filename) filename = "index";
//                         filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
//                         if (!filename) filename = "page_" + Math.random().toString(36).slice(2, 8);
//                         const filepath = `${u.hostname}_${filename}.png`;

//                         archive.append(buffer, { name: filepath });
//                         processed++;
//                     } catch (err) {
//                         console.error("Screenshot failed for", url, err);
//                         return;
//                     }

//                     // ------------------ 下層リンク抽出 ------------------
//                     const links: (string | null)[] = await page.$$eval("a", els =>
//                         els.map(e => e.getAttribute("href"))
//                     );

//                     for (const href of links) {
//                         if (!href) continue;
//                         try {
//                             const resolved = new URL(href, url);
//                             if ((resolved.protocol === "http:" || resolved.protocol === "https:") &&
//                                 isSameOrigin(start, resolved)) {
//                                 const normalized = resolved.href.split("#")[0];
//                                 if (!seen.has(normalized) && seen.size < maxPages * 5) {
//                                     seen.add(normalized);
//                                     queue.push(normalized);
//                                 }
//                             }
//                         } catch { }
//                     }

//                 } catch (e) {
//                     console.error("task error:", e);
//                 } finally {
//                     if (page) await page.close();
//                 }
//             });

//             // ------------------ ここ重要 ------------------
//             // task() ではなく await task とする
//             await task;
//         }

//         // ------------------ ZIP finalize ------------------
//         await archive.finalize();

//     } catch (err) {
//         console.error(err);
//         if (!res.headersSent) res.status(500).json({ error: String(err) });
//     } finally {
//         if (browser) await browser.close();
//     }
// });

// // ------------------ Ping ------------------
// app.get("/ping", (req, res) => res.json({ ok: true }));

// // ------------------ サーバ起動 ------------------
// const port = 4000;
// app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));


// ver01
// import express from "express";
// import puppeteer, { Browser } from "puppeteer-core";
// import archiver from "archiver";
// import pLimit from "p-limit";

// const app = express();
// app.use(express.json({ limit: "1mb" }));

// const DEFAULT_MAX_PAGES = 50;
// const DEFAULT_CONCURRENCY = 3;
// const VIEWPORT = { width: 1280, height: 800 };

// function isSameOrigin(root: URL, other: URL) {
//     return root.hostname === other.hostname && root.protocol === other.protocol;
// }

// async function extractLinks(pageUrl: string, html: string): Promise<string[]> {
//     const links: string[] = [];
//     const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
//     let m;
//     while ((m = hrefRegex.exec(html)) !== null) {
//         links.push(m[1]);
//     }
//     return links;
// }

// app.post("/capture", async (req, res) => {
//     const { startUrl, maxPages = DEFAULT_MAX_PAGES, concurrency = DEFAULT_CONCURRENCY } = req.body;
//     if (!startUrl) return res.status(400).json({ error: "startUrl is required" });

//     let browser: Browser | null = null;

//     try {
//         const start = new URL(startUrl);
//         res.setHeader("Content-Type", "application/zip");
//         res.setHeader("Content-Disposition", `attachment; filename="screenshots.zip"`);

//         const archive = archiver("zip");
//         archive.pipe(res);

//         // Puppeteer launch
//         browser = await puppeteer.launch({
//             headless: false, // ← ヘッドレス解除
//             executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
//             args: ["--no-sandbox", "--disable-setuid-sandbox"]
//         });

//         const page = await browser.newPage();
//         await page.setViewport(VIEWPORT);

//         const seen = new Set<string>();
//         const queue: string[] = [start.href];
//         seen.add(start.href);

//         const limit = pLimit(concurrency);
//         let processed = 0;
//         const tasks: Promise<void>[] = [];

//         while (queue.length > 0 && processed < maxPages) {
//             const url = queue.shift()!;
//             const task = limit(async () => {
//                 try {
//                     console.log("Navigating:", url);
//                     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => { });
//                     // ページ描画待機
//                     await new Promise(resolve => setTimeout(resolve, 2000));

//                     const u = new URL(url);
//                     let filename = u.pathname.replace(/\/$/, "");
//                     if (!filename) filename = "index";
//                     filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
//                     if (!filename) filename = "page_" + Math.random().toString(36).slice(2, 8);
//                     const filepath = `${u.hostname}_${filename}.png`;

//                     let buffer: Buffer;
//                     try {
//                         buffer = await page.screenshot({ fullPage: true }) as Buffer;
//                         console.log("Screenshot buffer length:", buffer.length);
//                         archive.append(buffer, { name: filepath });
//                         processed++;
//                     } catch (err) {
//                         console.error("Screenshot failed for", url, err);
//                         return;
//                     }

//                     const html = await page.content();
//                     const rawLinks = await extractLinks(url, html);
//                     for (const href of rawLinks) {
//                         try {
//                             const resolved = new URL(href, url);
//                             if ((resolved.protocol === "http:" || resolved.protocol === "https:") && isSameOrigin(start, resolved)) {
//                                 const normalized = resolved.href.split("#")[0];
//                                 if (!seen.has(normalized) && seen.size < maxPages * 5) {
//                                     seen.add(normalized);
//                                     queue.push(normalized);
//                                 }
//                             }
//                         } catch { }
//                     }
//                 } catch (e) {
//                     console.error("task error:", e);
//                 }
//             });
//             tasks.push(task);

//             if (tasks.length > concurrency * 50) {
//                 await Promise.all(tasks.splice(0, tasks.length - concurrency * 10));
//             }
//         }

//         await Promise.all(tasks);
//         await archive.finalize();
//     } catch (err) {
//         console.error(err);
//         if (!res.headersSent) res.status(500).json({ error: String(err) });
//     } finally {
//         if (browser) await browser.close();
//     }
// });

// app.get("/ping", (req, res) => res.json({ ok: true }));

// const port = 4000;
// app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
