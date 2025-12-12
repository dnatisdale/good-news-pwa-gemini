const extractProgramId = (input) => {
    // Clean the input - remove whitespace
    const cleaned = input.trim();

    // If it's just numbers, return it
    if (/^\d+$/.test(cleaned)) {
        return cleaned;
    }

    // Otherwise try to extract from URL patterns
    const match = cleaned.match(/program\/(\d+)/) || cleaned.match(/(\d{4,})/);
    return match ? match[1] : null;
};

const tests = [
    "67629",
    "https://globalrecordings.net/en/program/67629",
    "https://5fish.mobi/en/67629",
    " 67629 ",
    "http://example.com/program/67629",
    "random text 67629",
];

console.log("Testing extractProgramId:");
tests.forEach(t => {
    const res = extractProgramId(t);
    console.log(`Input: "${t}" -> Extracted: "${res}"`);
});

const id1 = extractProgramId("67629");
const id2 = extractProgramId("https://globalrecordings.net/en/program/67629");

if (id1 === id2) {
    console.log("\nPASS: Both inputs yield the same ID.");
} else {
    console.log(`\nFAIL: Inputs yield different IDs! "${id1}" vs "${id2}"`);
}
