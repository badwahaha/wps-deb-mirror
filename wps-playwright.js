const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("Opening WPS Linux download page...");
    await page.goto('https://www.wps.com/linux/', { waitUntil: 'networkidle' });

    await page.waitForSelector('a[href*=".deb"]');

    const debUrl = await page.$eval('a[href*=".deb"]', el => el.href);
    console.log("Real WPS .deb URL:", debUrl);

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
