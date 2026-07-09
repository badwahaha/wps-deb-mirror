const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        javaScriptEnabled: true,
        bypassCSP: true,
    });

    const page = await context.newPage();

    console.log("Opening WPS Linux site...");
    await page.goto('https://linux.wps.cn/', { waitUntil: 'domcontentloaded' });

    console.log("Clicking 立即下载...");

    // Wait for popup window
    const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=立即下载')
    ]);

    console.log("Popup window detected:", popup.url());

    // Wait for the download page to load
    await popup.waitForLoadState('domcontentloaded');

    console.log("Looking for 64位 DEB格式 → for X64 button...");
    await popup.waitForSelector('text=64位 DEB格式');

    // Click the "for X64" button
    const x64Button = popup.locator('text=for X64');
    await x64Button.click();

    console.log("Waiting for .deb request...");

    let debUrl = null;

    popup.on('request', req => {
        const url = req.url();
        if (url.endsWith('.deb')) {
            debUrl = url;
            console.log("Captured .deb URL:", debUrl);
        }
    });

    // Wait up to 30 seconds for the .deb request
    for (let i = 0; i < 30; i++) {
        if (debUrl) break;
        await popup.waitForTimeout(1000);
    }

    if (!debUrl) {
        throw new Error("Failed to capture .deb URL.");
    }

    const filename = debUrl.split('/').pop();
    const file = fs.createWriteStream(filename);

    console.log("Downloading:", filename);
    https.get(debUrl, response => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log("Saved:", filename);
        });
    });

    await browser.close();
})();
