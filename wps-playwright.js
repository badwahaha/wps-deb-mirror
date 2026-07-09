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

    // Wait for navigation to the download page
    await page.waitForLoadState('networkidle');

    console.log("Looking for .deb link...");
    await page.waitForSelector('a[href$=".deb"]');

    const debUrl = await page.$eval('a[href$=".deb"]', el => el.href);
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
