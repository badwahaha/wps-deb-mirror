const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("Opening official WPS Linux site...");
    await page.goto('https://linux.wps.cn/', { waitUntil: 'networkidle' });

    let debUrl = null;

    // Intercept all network requests
    page.on('request', request => {
        const url = request.url();
        if (url.endsWith('.deb')) {
            debUrl = url;
            console.log("Captured WPS .deb URL:", debUrl);
        }
    });

    console.log("Clicking 立即下载...");
    await page.click('text=立即下载');

    // Wait for the .deb URL to appear
    for (let i = 0; i < 30; i++) {
        if (debUrl) break;
        await page.waitForTimeout(1000);
    }

    if (!debUrl) {
        throw new Error("Failed to capture .deb URL from network requests.");
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
