async function testFetch(programId) {
    // 1. Fetch English Program Page
    const urlEn = `https://globalrecordings.net/en/program/${programId}`;
    console.log(`Fetching Program: ${urlEn}`);
    const resEn = await fetch(urlEn);
    const textEn = await resEn.text();
    
    // Extract Lang ID
    const langLinkMatch = textEn.match(/href="\/en\/language\/(\d+)"/);
    const langId = langLinkMatch ? langLinkMatch[1] : "0000";
    console.log("Language ID:", langId);
    
    if (langId !== "0000") {
        const langUrl = `https://globalrecordings.net/en/language/${langId}`;
        console.log(`Fetching Language Page: ${langUrl}`);
        const resLang = await fetch(langUrl);
        const textLang = await resLang.text();
        
        // Save for inspection
        require('fs').writeFileSync('temp_language.html', textLang);
        
        // Debug Regex
        // Try strict pattern vs loose pattern
        const isoMatch = textLang.match(/ISO Language Name:.*?\[(.*?)]/);
        console.log("ISO Match result:", isoMatch ? isoMatch[1] : "No match");
    }

    // 2. Fetch Thai Program Page
    const urlTh = `https://globalrecordings.net/th/program/${programId}`; 
    // force /th/ explicitly
    console.log(`Fetching Thai Program: ${urlTh}`);
    const resTh = await fetch(urlTh);
    const textTh = await resTh.text();
    
    const titleMatchTh = textTh.match(/<title>(.*?)<\/title>/);
    const titleThFull = titleMatchTh ? titleMatchTh[1] : "";
    console.log("Full Thai Title tag:", titleThFull);
    
    // Test the splitting logic we use in the app
    const parts = titleThFull.split(" - ").map(s => s.trim());
    console.log("App split logic result:", parts);
}

testFetch('67629');
