const fetch = require('node-fetch'); // Mocked in logic below

// MOCK FETCH function simulating the User's failure scenario
async function mockFetchWithFallback(url) {
    if (url.includes("/en/program/")) {
        console.log("Mock: English Program Fetch FAILED");
        return null; // Simulating failure
    }
    if (url.includes("/th/program/")) {
        console.log("Mock: Thai Program Fetch SUCCEEDED");
        // Returns English text inside Thai page (common GRN behavior)
        return `<html><head><title>Jesus Is Lord - Korean: Hamgyongdo - GRN</title></head><body><a href="/th/language/12270">Language</a></body></html>`;
    }
    if (url.includes("mymemory")) {
        console.log("Mock: Translation API hit");
        return JSON.stringify({ responseData: { translatedText: "พระเยซูทรงเป็นพระเจ้า" } });
    }
    return null;
}

// Logic to Tester
async function runLogic(id) {
    let titleEn = "Unknown Title";
    let titleTh = "ชื่อเรื่องไม่ระบุ";
    let langEn = "Unknown Language";
    let langTh = "ภาษาไม่ระบุ"; // Default
    let foundLangId = "0000";

    // 1. Fetch EN (Fails)
    const textEn = await mockFetchWithFallback(`.../en/program/${id}`);
    if (textEn) {
        // ... extraction logic ...
    }

    // 2. Fetch TH (Succeeds)
    const textTh = await mockFetchWithFallback(`.../th/program/${id}`);
    if (textTh) {
        // Extract Title/Lang
        const match = textTh.match(/<title>(.*?)<\/title>/);
        const full = match ? match[1] : "";
        const parts = full.split(" - ");
        if (parts.length >= 2) {
             titleTh = parts[0].trim(); // "Jesus Is Lord"
             langTh = parts[1].trim();  // "Korean: Hamgyongdo"
        }
        
        // NEW: Recover ID from Thai Page if missing
        if (foundLangId === "0000") {
             const idMatch = textTh.match(/href="\/[^/]+\/language\/(\d+)"/);
             if (idMatch) foundLangId = idMatch[1]; 
        }
    }

    console.log("State after fetch:", { titleEn, titleTh, langEn, langTh, foundLangId });

    // 3. RECOVERY LOGIC (The Fix)
    if (titleEn === "Unknown Title" && titleTh !== "ชื่อเรื่องไม่ระบุ") {
         console.log("Triggering Recovery: Copying TH -> EN");
         titleEn = titleTh;
         langEn = langTh;
    }

    // 4. TRANSLATION LOGIC
    if (titleTh === titleEn || titleTh === "Unknown Title") {
         console.log("Triggering Translation...");
         const trans = await mockFetchWithFallback("mymemory...");
         const json = JSON.parse(trans);
         titleTh = json.responseData.translatedText;
    }

    console.log("Final State:", { titleEn, titleTh, langEn, langTh, foundLangId });
}

runLogic('67629');
