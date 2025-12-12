async function testTranslate(text) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|th`;
    console.log(`Translating: "${text}"`);
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        console.log("Response Status:", res.status);
        console.log("Full Response:", JSON.stringify(data, null, 2));

        if (data.responseData) {
            console.log("Translated Text:", data.responseData.translatedText);
        }
    } catch (e) {
        console.error("Translation failed:", e);
    }
}

testTranslate("Jesus Is Lord");
