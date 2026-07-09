    console.log("Opening WPS Linux site...");
    await page.goto('https://linux.wps.cn/', { waitUntil: 'networkidle' });

    console.log("Clicking 立即下载...");

    // === REPLACE FROM HERE ===
    const [popup] = await Promise.all([
        context.waitForEvent('page'),     // Wait for new window/tab
        page.click('text=立即下载')       // Then click
    ]);
    // === TO HERE ===

    console.log("Popup window detected:", popup.url());

    await popup.waitForLoadState('domcontentloaded');
