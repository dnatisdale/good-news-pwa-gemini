/**
 * Helper function to format content items for display.
 * Handles extracting M-codes from titles, associating them with track names,
 * and ensuring consistent message/program number display.
 * 
 * @param {Object} item - The content item object
 * @param {String} lang - Current language code ('en' or 'th')
 * @returns {Object} Formatted display values
 */
export const formatContentItem = (item, lang) => {
  if (!item) return { languageDisplay: "", messageTitle: "", trackTitle: "", programNumber: "" };

  // 1. Language Display
  // Use the passed 'lang' to decide which language name to show primarily,
  // but for the "Language" field in the card, we usually show the English name or both.
  // The previous logic often just showed item.languageEn.
  // Let's stick to item.languageEn for consistency with the "Language" label,
  // or use a bilingual format if desired. For now, item.languageEn is safe.
  const languageDisplay = item.languageEn || "";

  // 2. Message Title
  // The user wants to display EXACTLY what is in the CSV.
  // The CSV usually has "Good News" without "(Mxxx)".
  // staticContent.js often has "Good News (M015)".
  // We will strip the "(Mxxx)" pattern from the title if it exists.
  const rawTitle = lang === "th" ? (item.title_th || item.title_en) : (item.title_en || item.title_th);
  
  // Regex to find (M followed by digits)
  const mCodeRegex = /\s*\(M\d+\)\s*/i;
  const mCodeMatch = rawTitle ? rawTitle.match(/\((M\d+)\)/i) : null;
  const mCode = mCodeMatch ? mCodeMatch[1] : null;

  const messageTitle = rawTitle ? rawTitle.replace(mCodeRegex, "").trim() : "";

  // 3. Track Title
  // The user wants the M-code (Mxxx) at the end of the Track title.
  const rawTrackTitle = lang === "th" ? (item.verse_th || item.verse_en) : (item.verse_en || item.verse_th);
  let trackTitle = rawTrackTitle || "";
  
  if (mCode) {
      trackTitle = `${trackTitle} (${mCode})`;
  }

  // 4. Program Number (Message #)
  // We want the pure program ID (e.g. 62808), not 62808001.
  // staticContent.js has a 'programId' field which is usually the clean string "62808".
  // If not, we fall back to item.program (from CSV) or item.id.
  let programNumber = item.programId || item.program || String(item.id);

  // If programNumber looks like "62808001", try to strip the last 3 digits if they are track numbers.
  // But 'programId' in staticContent should already be correct.
  // Let's just ensure we don't show the long ID if a short one is available.
  if (!programNumber && item.id) {
      const idStr = String(item.id);
      // Heuristic: if > 5 digits, might contain track info?
      // But program IDs can be long.
      // Best to rely on programId field if populated.
      programNumber = idStr;
  }

  return {
    languageDisplay,
    messageTitle,
    trackTitle,
    programNumber,
  };
};
