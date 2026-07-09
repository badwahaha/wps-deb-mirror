const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        acceptDownloads: true,
    });

    const page = await context.newPage();

    console.log("Opening WPS Linux site...");
    await page.goto('https://linux.wps.cn/', { waitUntil: 'networkidle' });

    console.log("Clicking 立即下载...");

    // This is the important part you asked about
    const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=立即下载')
    ]);

    console.log("Popup window detected:", popup.url());

    await popup.waitForLoadState('domcontentloaded');

    console.log("Looking for 64位 DEB格式 → for X64 button...");
    await popup.waitForSelector('text=64位 DEB格式', { timeout: 15000 });

    await popup.click('text=for X64');

    console.log("Waiting for .deb download...");
    const download = await popup.waitForEvent('download', { timeout: 45000 });

    const filename = download.suggestedFilename();
    const filePath = path.resolve(process.cwd(), filename);

    console.log("Downloading:", filename);
    await download.saveAs(filePath);

    console.log("✅ Saved:", filePath);

    await browser.close();
})();
