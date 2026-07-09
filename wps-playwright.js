const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("Opening official WPS Linux site...");
    await page.goto('https://linux.wps.cn/', { waitUntil: 'networkidle' });

    console.log("Clicking 立即下载...");
    await page.click('text=立即下载');

    console.log("Waiting for iframe...");
    await page.waitForSelector('iframe');

    const frame = page.frameLocator('iframe');

    console.log("Waiting for .deb link inside iframe...");
    await frame.locator('a[href$=".deb"]').waitFor();

    const debUrl = await frame.locator('a[href$=".deb"]').getAttribute('href');
    console.log("Found WPS .deb URL:", debUrl);

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
