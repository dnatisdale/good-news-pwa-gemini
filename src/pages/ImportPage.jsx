import React, { useState } from "react";
import {
  Download,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Search,
  Globe,
  Music,
} from "lucide-react";
import { ChevronLeft, ChevronRight, Upload } from "../components/Icons"; // Use App icons for nav
import { generateId } from "../utils/importUtils";
import { staticContent } from "../data/staticContent";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const ACCENT_COLOR_CLASS = "text-brand-red dark:text-white";

const ImportPage = ({ t, lang, onBack, onForward, hasPrev, hasNext }) => {
  const [importedData, setImportedData] = useState([]);
  const [programId, setProgramId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProTip, setShowProTip] = useState(false);
  
  // Use offline storage hook for downloading imported messages
  const { downloadTrack } = useOfflineStorage();

  const [manualEntry, setManualEntry] = useState({
    trackNumber: "1",
  });

  // --- Program ID Finder State ---
  const [finderLang, setFinderLang] = useState("");
  const [finderMessageId, setFinderMessageId] = useState("");
  const [finderTrack, setFinderTrack] = useState("1");

  const availableMessages = React.useMemo(() => {
    if (!finderLang) return [];
    
    // Use language-specific field based on current UI language
    const langField = lang === "th" ? "langTh" : "languageEn";
    
    return staticContent
      .filter((item) => {
        const itemLang = lang === "th" ? item.langTh : item.languageEn;
        return itemLang === finderLang;
      })
      .map((item) => ({
        id: item.programId,
        title: lang === "th" 
          ? (item.title_th || item.title_en || "ไม่ระบุชื่อ") 
          : (item.title_en || item.title_th || "Unknown Title"),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, lang));
  }, [finderLang, lang]);

  const handleFinderLangChange = (e) => {
    setFinderLang(e.target.value);
    setFinderMessageId("");
    setProgramId(""); // Clear program ID when language changes
  };

  const handleFinderMessageChange = (e) => {
    const newId = e.target.value;
    setFinderMessageId(newId);
    if (newId) {
      // Set the Program ID in the input field
      setProgramId(newId);
      
      // Auto-populate language and title fields from the selected message
      const selectedItem = staticContent.find(item => item.programId === newId);
      if (selectedItem && currentItem) {
        setCurrentItem({
          ...currentItem,
          languageEn: selectedItem.languageEn || "",
          langTh: selectedItem.langTh || "",
          title_en: selectedItem.title_en || "",
          title_th: selectedItem.title_th || "",
        });
      }
    }
  };

  const handleFinderTrackChange = (e) => {
    const newTrack = e.target.value;
    setFinderTrack(newTrack);
    setManualEntry((prev) => ({ ...prev, trackNumber: newTrack }));
  };

  // --- Smart Input Logic ---
  const { topTitlesEn, topTitlesTh, existingLanguagesEn, existingLanguagesTh } =
    React.useMemo(() => {
      // 1. Top 5 Titles (EN)
      const countsEn = {};
      staticContent.forEach((item) => {
        const t = item.title_en?.trim();
        if (t) countsEn[t] = (countsEn[t] || 0) + 1;
      });
      const topEn = Object.entries(countsEn)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e) => e[0]);

      // 2. Top 5 Titles (TH)
      const countsTh = {};
      staticContent.forEach((item) => {
        const t = item.title_th?.trim();
        if (t) countsTh[t] = (countsTh[t] || 0) + 1;
      });
      const topTh = Object.entries(countsTh)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e) => e[0]);

      // 3. All Languages (EN)
      const langsEn = Array.from(
        new Set(staticContent.map((i) => i.languageEn?.trim()).filter(Boolean))
      ).sort();

      // 4. All Languages (TH)
      const langsTh = Array.from(
        new Set(staticContent.map((i) => i.langTh?.trim()).filter(Boolean))
      ).sort();

      return {
        topTitlesEn: topEn,
        topTitlesTh: topTh,
        existingLanguagesEn: langsEn,
        existingLanguagesTh: langsTh,
      };
    }, []);

  // Get random verses from staticContent
  const getRandomVerses = () => {
    const itemsWithVerses = staticContent.filter(
      (item) => item.verse_en && item.verse_th
    );
    if (itemsWithVerses.length > 0) {
      const randomItem =
        itemsWithVerses[Math.floor(Math.random() * itemsWithVerses.length)];
      return {
        verse_en: randomItem.verse_en,
        verse_th: randomItem.verse_th,
      };
    }
    return { verse_en: "", verse_th: "" };
  };

  // Temporary state for the item being added
  const [currentItem, setCurrentItem] = useState(null);

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

  const fetchMetadata = async (id) => {
    // Note: This might hit CORS issues if run directly in browser without a proxy.
    // We try to fetch the HTML and parse the title.
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      // Fetch English Page
      const resEn = await fetch(
        `https://globalrecordings.net/en/program/${id}`,
        { signal: controller.signal }
      );
      const textEn = await resEn.text();
      const parser = new DOMParser();
      const docEn = parser.parseFromString(textEn, "text/html");

      // Extract Title (e.g., "Good News - Akeu")
      const fullTitleEn = docEn.querySelector("title")?.innerText || "";
      const [titleEn, langEn] = fullTitleEn.split(" - ").map((s) => s.trim());

      // Fetch Thai Page
      const resTh = await fetch(
        `https://globalrecordings.net/th/program/${id}`,
        { signal: controller.signal }
      );
      const textTh = await resTh.text();
      const docTh = parser.parseFromString(textTh, "text/html");

      const fullTitleTh = docTh.querySelector("title")?.innerText || "";
      const [titleTh, langTh] = fullTitleTh.split(" - ").map((s) => s.trim());

      clearTimeout(timeoutId);

      return {
        languageEn: langEn || "Unknown Language",
        langTh: langTh || "ภาษาไม่ระบุ",
        title_en: titleEn || "Unknown Title",
        title_th: titleTh || "ชื่อเรื่องไม่ระบุ",
      };
    } catch (err) {
      console.warn(
        "Metadata fetch failed (likely CORS), using placeholders.",
        err
      );
      return {
        languageEn: "",
        langTh: "",
        title_en: "",
        title_th: "",
      };
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setCurrentItem(null);

    const id = extractProgramId(programId);

    if (!id) {
      setError(
        t.program_id_error || "Please enter a valid Program ID (e.g., 62808)"
      );

      setIsLoading(false);
      return;
    }

    // 1. Construct URLs immediately (Fast)
    // Default to track 1 if not specified or empty
    const trackNum = manualEntry.trackNumber || "1";
    const streamUrl = `fivefish.org/T${id}`;
    const trackDownloadUrl = `https://api.globalrecordings.net/files/track/mp3-low/${id}/${trackNum}`;
    const zipDownloadUrl = `https://api.globalrecordings.net/files/set/mp3-low/${id}`;
    const shareUrl = `5fi.sh/T${id}`;

    // 2. Try to fetch metadata (Slow, might fail)
    const metadata = await fetchMetadata(id);

    // 3. Get random verses
    const randomVerses = getRandomVerses();

    // 4. Try to get data from staticContent first (most reliable)
    const existingItem = staticContent.find(item => item.id == id);
    const iso3 = existingItem?.iso3 || "ENG";
    const langId = existingItem?.langId || "0000";

    // Use staticContent data if available, otherwise use fetched metadata
    setCurrentItem({
      id: generateId(), // Internal ID
      programId: id, // GRN ID
      iso3: iso3,
      langId: langId,
      languageEn: existingItem?.languageEn || metadata.languageEn,
      langTh: existingItem?.langTh || metadata.langTh,
      title_en: existingItem?.title_en || metadata.title_en,
      title_th: existingItem?.title_th || metadata.title_th,
      verse_en: existingItem?.verse_en || randomVerses.verse_en,
      verse_th: existingItem?.verse_th || randomVerses.verse_th,
      streamUrl,
      trackDownloadUrl,
      zipDownloadUrl,
      shareUrl,
      stableKey: existingItem?.languageEn || metadata.languageEn || "New Import",
    });


    setIsLoading(false);
  };

  const handleAddItem = () => {
    if (currentItem) {
      setImportedData([...importedData, currentItem]);
      setCurrentItem(null);
      setProgramId("");
      // Reset manual entry for next time
      setManualEntry((prev) => ({ ...prev, trackNumber: "1" }));
    }
  };

  const handleAddToLibrary = async () => {
    if (importedData.length === 0) return;
    
    setIsLoading(true);
    try {
      // Download all items in importedData to offline library
      for (const item of importedData) {
        await downloadTrack(item);
      }
      alert(t.added_to_library || "✅ Added to My Library! Find them in the My Library page.");
      setImportedData([]); // Clear the list after successful download
    } catch (error) {
      console.error("Failed to add to library:", error);
      alert("Failed to add some messages. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyJson = () => {
    const jsonString = JSON.stringify(importedData, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert(t.json_copied_alert || "✅ Copied! Your message data is now on your clipboard. You can paste it anywhere you need it.");
  };

  const handleClearData = () => {
    if (window.confirm(t.clear_data_confirm || "Are you sure?")) {
      setImportedData([]);
    }
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Navigation Header */}
      <div className="bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-white px-4 py-2 flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-600">
        <button
          onClick={onBack}
          disabled={!hasPrev}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasPrev ? "hover:text-gray-900 dark:hover:text-gray-300" : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          disabled={!hasNext}
          className={`flex items-center text-base font-semibold transition-colors ${
            hasNext ? "hover:text-gray-900 dark:hover:text-gray-300" : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      {/* Title - Centered */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center justify-center">
        <Upload className="w-8 h-8 mr-3 text-brand-red dark:text-white" />
        {t.import_new_content_title || "Import New Content"}
      </h1>

      {/* Main Content Container - Centered & Narrow */}
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* Message ID Input - Top Section */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
          <div className="flex justify-end mb-2">
             <button
              type="button"
              onClick={() => setShowProTip((prev) => !prev)}
              className="px-3 py-1 bg-brand-red hover:bg-red-800 text-white text-xs font-bold rounded-md transition-colors shadow-sm"
            >
              {showProTip ? (
                  <>Hide Pro Tip</>
              ) : (
                  <>{t.pro_tip_button || "Pro Tip"}</>
              )}
            </button>
          </div>

          <div className="flex gap-4 mb-2">
            <div className="flex-grow">
              <label className="block text-lg font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                <Search className="w-5 h-5 inline mr-2 text-white" />
                {t.find_message_id_label || "Find Message ID"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-base transition-colors"
                  placeholder="63629"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlSubmit(e);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.find_message_id_hint ||
                  "Enter the GRN Program Message ID number (e.g., 63629)"}
              </p>
            </div>
            <div className="w-24">
              <label className="block text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                {t.track_number_label || "Track #"}
              </label>
              <input
                type="text"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-base text-center transition-colors"
                value={manualEntry.trackNumber}
                onChange={(e) =>
                  setManualEntry({
                    ...manualEntry,
                    trackNumber: e.target.value,
                  })
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlSubmit(e);
                  }
                }}
              />
            </div>
          </div>
          
          {/* Find Message Button - Right after inputs */}
          <button
            onClick={handleUrlSubmit}
            disabled={isLoading}
            className="w-full bg-brand-red hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
          >
            {isLoading ? "Loading..." : <Search className="w-5 h-5 text-white" />}
            {t.find_message_btn || "Find Message"}
          </button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>

        {/* Info Notes Box */}
        {showProTip && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl slide-up">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Music className="w-4 h-4" />
              {t.url_pattern_info || "Auto-Generated URL Pattern"}
            </h3>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-semibold mb-1">
                {t.download_url_label || "Download URL Format:"}
              </p>
              <div className="bg-slate-950 dark:bg-slate-900 text-slate-50 p-2 rounded-lg border border-blue-200 dark:border-blue-700 font-mono text-xs overflow-x-auto">
                https://api.globalrecordings.net/files/track/mp3-low/
                <span className="text-orange-300 font-bold">
                  {"{ PROGRAM_ID }"}
                </span>
                /
                <span className="text-green-300 font-bold">
                  {"{ TRACK_NUMBER }"}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                💡{" "}
                {t.url_pattern_note ||
                  "The app automatically generates the download URL using your Program ID and Track Number. In production, this is proxied through Netlify (/api/proxy-audio/*) to avoid CORS issues."}
              </p>
            </div>
          </div>
        )}
        
        {/* Finder Section */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md border-2 border-blue-100 dark:border-blue-900/30">
          
          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t.select_language || "Select Language"}
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none transition-colors"
                value={finderLang}
                onChange={handleFinderLangChange}
              >
                <option value="">-- {lang === "th" ? "เลือกภาษา" : "Select Language"} --</option>
                {(lang === "th" ? existingLanguagesTh : existingLanguagesEn).map((langName, i) => (
                  <option key={i} value={langName}>
                    {langName}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t.select_message || "Select Message"}
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                value={finderMessageId}
                onChange={handleFinderMessageChange}
                disabled={!finderLang}
              >
                <option value="">-- {lang === "th" ? "เลือกข้อความ" : "Select Message"} --</option>
                {availableMessages.map((msg, i) => (
                  <option key={i} value={msg.id}>
                    {msg.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Track */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t.select_track || "Select Track"}
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                value={finderTrack}
                onChange={handleFinderTrackChange}
                disabled={!finderMessageId}
              >
                {[...Array(20)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    Track {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Review This Message Section */}
        {currentItem && (
          <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md border-2 border-green-100 dark:border-green-900/30 slide-up">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 text-center">
              {t.review_message_title || "Review This Message"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {t.review_message_hint || "Check the details below, then click 'Add This Message' to add it to your list."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  ISO3 Code
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                  value={currentItem.iso3 || ""}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, iso3: e.target.value })
                  }
                  placeholder="e.g., KSW"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Lang ID
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                  value={currentItem.langId || ""}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, langId: e.target.value })
                  }
                  placeholder="e.g., 238"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  {t.lang_en_label || "Language (EN)"}
                </label>
                <input
                  type="text"
                  list="languages-en"
                  className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                  value={currentItem.languageEn}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, languageEn: e.target.value })
                  }
                />
                <datalist id="languages-en">
                  {existingLanguagesEn.map((lang, i) => (
                    <option key={i} value={lang} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  {t.lang_th_label || "Language (TH)"}
                </label>
                <input
                  type="text"
                  list="languages-th"
                  className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                  value={currentItem.langTh}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, langTh: e.target.value })
                  }
                />
                <datalist id="languages-th">
                  {existingLanguagesTh.map((lang, i) => (
                    <option key={i} value={lang} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  {t.title_en_label || "Title (EN)"}
                </label>
                <input
                  type="text"
                  list="titles-en"
                  className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                  value={currentItem.title_en}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, title_en: e.target.value })
                  }
                />
                <datalist id="titles-en">
                  {topTitlesEn.map((title, i) => (
                    <option key={i} value={title} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  {t.title_th_label || "Title (TH)"}
                </label>
                <input
                  type="text"
                  list="titles-th"
                  className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                  value={currentItem.title_th}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, title_th: e.target.value })
                  }
                />
                <datalist id="titles-th">
                  {topTitlesTh.map((title, i) => (
                    <option key={i} value={title} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                Verse (EN)
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                value={currentItem.verse_en || ""}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, verse_en: e.target.value })
                }
                rows="2"
                placeholder="English verse text"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                Verse (TH)
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent focus:outline-none"
                value={currentItem.verse_th || ""}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, verse_th: e.target.value })
                }
                rows="2"
                placeholder="Thai verse text"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t.generated_urls_label || "Generated URLs"}
              </label>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded space-y-1 overflow-x-auto">
                <p>Stream: {currentItem.streamUrl}</p>
                <p>Download: {currentItem.trackDownloadUrl}</p>
              </div>
            </div>

            <button
              onClick={handleAddItem}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              {t.add_message_btn || "Add This Message"}
            </button>
          </div>
        )}

        {/* My Import List */}
        {importedData.length > 0 && (
          <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md border-2 border-blue-100 dark:border-blue-900/30">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {t.import_list_title || "My Import List"} ({importedData.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleClearData}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={t.clear_all || "Clear All"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddToLibrary}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-5 h-5" />
                  {isLoading ? (t.downloading || "Downloading...") : (t.add_to_library_btn || "Add to My Library")}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t.import_list_hint || "These messages are ready to add to My Library. Click 'Add to My Library' to download them for offline use."}
            </p>
            <button
              onClick={handleCopyJson}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline mb-4"
            >
              {t.export_json_link || "Export JSON (for developers)"}
            </button>

            <div className="max-h-96 overflow-y-auto space-y-4">
              {importedData.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {item.languageEn}
                    </h3>
                    {item.langTh && (
                      <p className="text-base text-gray-500 dark:text-gray-400">
                        {item.langTh}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {item.title_en}
                    </p>
                    {item.title_th && (
                      <p className="text-base text-gray-500 dark:text-gray-400">
                        {item.title_th}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      ID: {item.programId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.trackDownloadUrl && (
                      <Music className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
