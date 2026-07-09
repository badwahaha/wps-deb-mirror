const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let debUrl = null;

    // Capture any .deb request
    page.on('request', request => {
        const url = request.url();
        if (url.endsWith('.deb')) {
            debUrl = url;
            console.log("Captured .deb URL:", debUrl);
        }
    });

    console.log("Opening WPS Linux site...");
    await page.goto('https://linux.wps.cn/', { waitUntil: 'domcontentloaded' });

    console.log("Clicking 立即下载...");
    await page.click('text=立即下载').catch(() => {
        console.log("Click failed, continuing anyway...");
    });

    // Wait up to 30 seconds for any .deb request
    for (let i = 0; i < 30; i++) {
        if (debUrl) break;
        await page.waitForTimeout(1000);
    }

    if (!debUrl) {
        throw new Error("No .deb URL captured from network requests.");
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
