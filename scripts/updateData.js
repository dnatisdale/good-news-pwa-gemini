const fs = require("fs");
const beautify = require("json-beautify");

const filePath = "./src/data/staticContent.js";

try {
  // 1. Read the file content
  let content = fs.readFileSync(filePath, "utf8");

  // 2. Extract the array string (The regex ensures we only get the array part)
  const arrayMatch = content.match(
    /export\s+const\s+staticContent\s*=\s*(\[[^\]]*\]\s*);\s*/s
  );

  if (!arrayMatch) {
    console.error(
      "Error: Could not find 'export const staticContent = [...];' structure."
    );
    process.exit(1);
  }

  const jsonArrayString = arrayMatch[1];

  // 3. Evaluate the array string to a real JS object (This is safe because we control the file)
  // We use eval or Function to safely parse the JS array definition
  const data = new Function("return " + jsonArrayString)();

  // 4. Process the data: Add stableKey
  const updatedData = data.map((item) => {
    // Check if languageEn exists before assigning
    if (item.languageEn) {
      item.stableKey = item.languageEn;
    } else {
      console.warn(
        `Warning: Item with ID ${item.id} is missing 'languageEn'. Skipping stableKey.`
      );
    }
    return item;
  });

  // 5. Re-serialize the updated data using json-beautify
  // We use null for replacer, 2 for indentation, and 100 for line length for clean output
  const updatedJson = beautify(updatedData, null, 2, 100);

  // 6. Replace the old array string in the original content
  const newContent = content.replace(jsonArrayString, updatedJson + ";"); // Ensure trailing semicolon is added back

  // 7. Save the updated content back to the file
  fs.writeFileSync(filePath, newContent, "utf8");

  console.log(
    "✅ Successfully added stableKey to all items in src/data/staticContent.js."
  );
} catch (error) {
  console.error("An error occurred during data processing:", error.message);
  process.exit(1);
}
