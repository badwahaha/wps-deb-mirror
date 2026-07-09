const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        acceptDownloads: true,        // Important for downloads
    });

    const page = await context.newPage();

    console.log("Opening WPS Linux site...");
    await page.goto('https://linux.wps.cn/', { waitUntil: 'networkidle' });

    console.log("Clicking 立即下载...");

    // Start waiting for the new popup window BEFORE clicking
    const popupPromise = context.waitForEvent('page');   // or page.waitForEvent('popup')

    await page.click('text=立即下载');

    const popup = await popupPromise;
    console.log("Popup opened:", popup.url());

    await popup.waitForLoadState('domcontentloaded');

    console.log("Looking for 64位 DEB格式 → for X64...");
    await popup.waitForSelector('text=64位 DEB格式', { timeout: 15000 });

    // Click the X64 button
    await popup.click('text=for X64', { timeout: 10000 });

    console.log("Waiting for download to start...");

    const download = await popup.waitForEvent('download', { timeout: 45000 });

    const filename = download.suggestedFilename();
    const filePath = path.resolve(process.cwd(), filename);

    console.log(`Downloading: ${filename}`);
    await download.saveAs(filePath);

    console.log(`✅ Saved: ${filePath}`);
    await browser.close();
})();
