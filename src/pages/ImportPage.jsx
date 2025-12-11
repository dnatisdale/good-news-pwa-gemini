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
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { ChevronLeft, ChevronRight, Upload } from "../components/Icons"; // Use App icons for nav
import { generateId } from "../utils/importUtils";
import { staticContent } from "../data/staticContent";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const ACCENT_COLOR_CLASS = "text-brand-red dark:text-white";

const ImportPage = ({ t, lang, onBack, onForward, hasPrev, hasNext, setCustomBackHandler }) => {
  // Load initial data from localStorage if available
  const [importedData, setImportedData] = useState(() => {
    const saved = localStorage.getItem("import_staging_list");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever importedData changes
  React.useEffect(() => {
    localStorage.setItem("import_staging_list", JSON.stringify(importedData));
  }, [importedData]);

  // Clear localStorage when successfully added to library
  const clearStaging = () => {
      setImportedData([]);
      localStorage.removeItem("import_staging_list");
  };
  const [programId, setProgramId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProTip, setShowProTip] = useState(false);
  
  // Use offline storage hook for downloading imported messages
  const { downloadTrack } = useOfflineStorage();

  const [manualEntry, setManualEntry] = useState({
    trackNumber: "1",
    durationString: ""
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
    setFinderMessageId("");
    setProgramId(""); // Clear program ID when language changes
    setManualEntry(prev => ({ ...prev, trackNumber: "1", durationString: "" }));
  };

  const handleFinderMessageChange = (e) => {
    const newId = e.target.value;
    setFinderMessageId(newId);
    if (newId) {
      // Set the Program ID in the input field
      setProgramId(newId);
      
      // Auto-populate all fields from the selected message
      const selectedItem = staticContent.find(item => item.programId === newId);
      if (selectedItem) {
        // 1. Auto-fill duration if available
        // 1. Auto-fill duration if available
        const dString = selectedItem.duration || "";

        const newTrack = manualEntry.trackNumber || "1";
        setManualEntry(prev => ({ 
            ...prev, 
            durationString: dString
        }));

        // 2. ALWAYS update Current Item (Review Card) to be in sync
        const streamUrl = `fivefish.org/T${newId}`;
        const trackDownloadUrl = `https://api.globalrecordings.net/files/track/mp3-low/${newId}/${newTrack}`;
        const zipDownloadUrl = `https://api.globalrecordings.net/files/set/mp3-low/${newId}`;
        const shareUrl = `5fi.sh/T${newId}`;

        setCurrentItem({
             id: generateId(),
             programId: newId,
             iso3: selectedItem.iso3 || "ENG",
             langId: selectedItem.langId || "0000",
             trackNumber: newTrack,
             languageEn: selectedItem.languageEn || "",
             langTh: selectedItem.langTh || "",
             title_en: selectedItem.title_en || "",
             title_th: selectedItem.title_th || "",
             verse_en: selectedItem.verse_en || "",
             verse_th: selectedItem.verse_th || "",
             streamUrl,
             trackDownloadUrl,
             zipDownloadUrl,
             shareUrl,
             stableKey: selectedItem.languageEn || "New Import"
        });

      } else {
         // Clear if not found
          setManualEntry(prev => ({ ...prev, durationString: "" }));
         setCurrentItem(null); 
      }
    } else {
        setManualEntry(prev => ({ ...prev, durationString: "" }));
        setCurrentItem(null);
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

  // --- NEW: Audio Player State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    // Reset player when item changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  }, [currentItem?.trackDownloadUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time) => {
    if (!time && time !== 0) return "0:00:00";
    
    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Always show hours as requested: H:MM:SS or HH:MM:SS
    // User requested "hours field too". Let's do H:MM:SS at minimum.
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- NEW: Soft Back Handler ---
  React.useEffect(() => {
    if (!setCustomBackHandler) return;

    if (currentItem) {
      setCustomBackHandler(() => () => {
         // Close the card (Review Mode) when Back is clicked
         setCurrentItem(null);
      });
    } else {
      setCustomBackHandler(null); // Default behavior (Go Back / Home)
    }
    
    // Cleanup
    return () => setCustomBackHandler(null);
  }, [currentItem, setCustomBackHandler]);

  // --- NEW: Dynamic URL Update on Track Change ---
  const handleTrackChange = (newTrack) => {
      // 1. Update Input State
      setManualEntry(prev => ({ ...prev, trackNumber: newTrack }));
      setFinderTrack(newTrack);

      // 2. If we are already reviewing an item, update its URL live!
      if (currentItem && programId) {
          const newUrl = `https://api.globalrecordings.net/files/track/mp3-low/${programId}/${newTrack}`;
          setCurrentItem(prev => ({
              ...prev,
              trackDownloadUrl: newUrl,
              trackNumber: newTrack
          }));
      }
  };

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
      trackNumber: trackNum,
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
      // Check for duplicates
      const isDuplicate = importedData.some(
        item => item.programId === currentItem.programId && item.trackNumber === currentItem.trackNumber
      );

      if (isDuplicate) {
          alert(`Duplicate Warning: Track ${currentItem.trackNumber} (ID: ${currentItem.programId}) is already in your list.`);
          return;
      }

      setImportedData([...importedData, currentItem]);
      setCurrentItem(null);
      // setProgramId(""); // Keep program ID for next add
      
      // Reset Finder State? NO, keep it for multi-track add
      // setFinderLang("");
      // setFinderMessageId("");
      // setFinderTrack("1");
      
      // Reset manual entry? NO, keep it, maybe user just wants to increment
      // setManualEntry((prev) => ({ ...prev, trackNumber: "1", durationString: "" }));
    }
  };

  const handleAddToLibrary = async () => {
    if (importedData.length === 0) return;
    
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Download all items in importedData to offline library
      for (const item of importedData) {
        const success = await downloadTrack(item);
        if (success) successCount++;
        else failCount++;
      }
      
      if (successCount > 0) {
          alert(t.added_to_library || `✅ Added ${successCount} messages to My Library!`);
          
          if (failCount === 0) {
              clearStaging(); 
          } else {
              alert(`Warning: ${failCount} messages failed to download.`);
          }
      } else {
          // All failed
          // Alert is already shown by downloadTrack for individual failures
      }

    } catch (error) {
      console.error("Failed to add to library:", error);
      alert("Failed to add messages. Please try again.");
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

        {/* 1. Finder Section (Language & Message) - MOVED TO TOP */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md space-y-4">
          
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
              <Search className="w-5 h-5 mr-2 text-brand-red dark:text-red-400" />
              {t.find_content_label || "Find Content"}
            </h2>
            <button
               type="button"
               onClick={() => setShowProTip((prev) => !prev)}
               className="text-brand-red hover:text-red-800 dark:text-red-300 text-xs font-bold transition-colors"
             >
               {showProTip ? "Hide Tip" : t.pro_tip_button || "Pro Tip"}
             </button>
          </div>

          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t.select_language || "Step 1: Select Language"}
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
                {t.select_message || "Step 2: Select Message"}
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
          </div>
        
          {/* 2. Track Details Row (Track -> Duration -> ID) */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-600">
             <div className="grid grid-cols-3 gap-4">
                
                {/* 1. Track Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    {t.track_number_label || "Track #"}
                  </label>
                   <div className="relative">
                      {finderMessageId ? (
                         <select
                            className="block w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:border-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors text-sm font-bold text-blue-900"
                            value={manualEntry.trackNumber}
                            onChange={(e) => handleTrackChange(e.target.value)}
                         >
                            {(() => {
                              const selectedMsg = staticContent.find(i => i.programId === finderMessageId);
                              const count = selectedMsg?.trackCount ? Math.ceil(parseFloat(selectedMsg.trackCount)) : 20;
                              const safeCount = count > 0 ? count : 20;
                              return [...Array(safeCount)].map((_, i) => (
                                <option key={i} value={i + 1}>Track {i + 1}</option>
                              ));
                            })()}
                         </select>
                      ) : (
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-blue-300 rounded-lg bg-slate-50 dark:bg-gray-800 dark:border-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors text-sm text-center"
                          value={manualEntry.trackNumber}
                          onChange={(e) => handleTrackChange(e.target.value)}
                        />
                      )}
                  </div>
                </div>

                {/* 2. Duration (Minutes : Seconds) - Editable & Auto-fill */}
                <div>
                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      {t.full_message_length_label || "Full Message Length"}
                   </label>
                   <div className="relative">
                      <input 
                          type="text" 
                          placeholder="MM:SS" 
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-slate-50 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-400 text-center text-sm font-mono focus:outline-none cursor-not-allowed"
                          value={manualEntry.durationString || ""}
                          readOnly
                          title="Message Duration"
                      />
                   </div>
                </div>

                {/* 3. Program ID (Read Only / Auto-filled) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    {t.message_id_label || "Message ID"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 focus:outline-none transition-colors text-sm font-mono text-center cursor-not-allowed"
                      placeholder="---"
                      value={programId}
                      readOnly
                    />
                  </div>
                </div>

             </div>
          </div>

          {/* Find Message Button */}
          <button
            onClick={handleUrlSubmit}
            disabled={isLoading}
            className="w-full bg-brand-red hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
          >
            {isLoading ? "Loading..." : <Search className="w-5 h-5 text-white" />}
            {t.find_message_btn || "Load Message Data"}
          </button>
          
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>

        {/* Info Notes Box (Default Hidden) */}
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
                  "The app automatically generates the download URL using your Program ID and Track Number. In production, this is proxied through Netlify to avoid CORS issues."}
              </p>
            </div>
          </div>
        )}
        
        {/* Review This Message Section */}

        {/* Modal Overlay for Review */}
        {currentItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto slide-in-from-bottom-4 duration-300">
                
                {/* Modal Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                   <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {t.review_message_title || "Review Selection"}
                   </h2>
                   <button 
                     onClick={() => setCurrentItem(null)}
                     className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                   >
                     <span className="sr-only">Close</span>
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      {t.review_message_hint || "Review the details below. You can change the track number here if needed."}
                    </p>

                   {/* Main Info Grid */}
                   <div className="grid grid-cols-2 gap-4">
                      {/* Combined Info Card */}
                      <div className="col-span-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex flex-col gap-4">
                          {/* Language */}
                          <div>
                             <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                 {t.language_label || "Language"}
                              </label>
                             <p className="font-bold text-gray-800 dark:text-white">
                                {currentItem.languageEn} <span className="text-gray-400 font-normal">/ {currentItem.langTh}</span>
                             </p>
                          </div>

                          {/* Title */}
                          <div>
                             <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                 {t.title_label || "Title"}
                              </label>
                             <p className="font-bold text-gray-800 dark:text-white">
                                {currentItem.title_en} <span className="text-gray-400 font-normal">/ {currentItem.title_th}</span>
                             </p>
                             <div className="text-xs text-gray-400 mt-1 flex gap-3">
                                <span>ISO: {currentItem.iso3}</span>
                                <span>ID: {currentItem.langId}</span>
                             </div>
                          </div>
                      </div>

                      {/* TRACK NUMBER EDITING */}
                      <div className="col-span-2 border-t border-b border-gray-100 dark:border-gray-700 py-4 my-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                               {t.track_number_label || "Track Number"}:
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                   onClick={() => {
                                      const prev = Math.max(1, parseInt(manualEntry.trackNumber) - 1);
                                      handleTrackChange(prev.toString());
                                   }}
                                   className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                >
                                   <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-mono text-xl font-bold w-12 text-center text-brand-red dark:text-white">
                                   {manualEntry.trackNumber}
                                </span>
                                <button
                                   onClick={() => {
                                      const next = parseInt(manualEntry.trackNumber) + 1;
                                      handleTrackChange(next.toString());
                                   }}
                                   className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                >
                                   <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                   </div>

                   {/* Audio Player */}
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                        {t.preview_audio_label || "Preview Audio"}
                      </label>
                      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-full border border-gray-200 dark:border-gray-600">
                          <button 
                              onClick={togglePlay}
                              className="text-brand-red dark:text-red-400 hover:scale-110 transition-transform focus:outline-none"
                          >
                              {isPlaying ? <PauseCircle className="w-10 h-10 fill-current" /> : <PlayCircle className="w-10 h-10 fill-current" />}
                          </button>
                          
                          <div className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 w-16 text-center">
                              {formatTime(currentTime)}
                          </div>
                          
                          <input
                              type="range"
                              min="0"
                              max={duration || 0}
                              value={currentTime}
                              onChange={onSeek}
                              className="flex-grow h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-brand-red"
                          />
                          
                          <div className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 w-16 text-center">
                              {formatTime(duration)}
                          </div>

                          <audio
                            ref={audioRef}
                            src={currentItem.trackDownloadUrl}
                            onTimeUpdate={onTimeUpdate}
                            onLoadedMetadata={onLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                            preload="metadata"
                          />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mt-2 font-mono break-all px-4">
                         Source: {currentItem.trackDownloadUrl}
                      </p>
                   </div>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
               {(() => {
                   // Check for duplicates in render
                   const isDuplicate = importedData.some(
                      item => item.programId === currentItem.programId && String(item.trackNumber) === String(manualEntry.trackNumber)
                   );

                   return (
                     <div className="flex flex-col gap-3">
                        {isDuplicate && (
                             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-300 animate-bounce">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                 </svg>
                                 <span className="font-bold">{t.duplicate_warning || "This track is already in your Import List."}</span>
                             </div>
                        )}
                        <div className="flex gap-3">
                           <button
                              onClick={() => setCurrentItem(null)}
                              className="flex-1 py-3 px-4 rounded-lg font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                            >
                              {t.cancel || "Cancel"}
                           </button>
                           <button
                              onClick={handleAddItem}
                              disabled={isDuplicate}
                              className={`flex-[2] py-3 px-4 rounded-lg font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2
                                  ${isDuplicate 
                                      ? "bg-gray-400 cursor-not-allowed opacity-70" 
                                      : "bg-[#003366] hover:bg-[#002244] dark:bg-orange-500 dark:hover:bg-orange-600"
                                  }`}
                           >
                              <Plus className="w-5 h-5" />
                              {isDuplicate ? (t.already_added || "Already Added") : (t.add_to_list_btn || "Add to Import List")}
                           </button>
                        </div>
                     </div>
                   );
               })()}
            </div>

             </div>
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
                  onClick={() => {
                      if(window.confirm(t.clear_data_confirm)) {
                          clearStaging();
                      }
                  }}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={t.clear_all || "Clear All"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddToLibrary}
                  disabled={isLoading}
                  className="bg-[#003366] hover:bg-[#002244] dark:bg-orange-500 dark:hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
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
                    {/* Row 1: Languages (Combined) */}
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {item.languageEn}
                      {item.langTh && (
                        <span className="ml-2 text-gray-600 dark:text-gray-300 font-normal">
                          / {item.langTh}
                        </span>
                      )}
                    </h3>

                    {/* Row 2: Titles (Combined) */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-1">
                      <span className="font-medium text-gray-900 dark:text-white">{item.title_en}</span>
                      {item.title_th && (
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                           / {item.title_th}
                        </span>
                      )}
                    </p>

                    {/* Row 3: Details */}
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      ID: {item.programId} <span className="mx-1">•</span> Track: {item.trackNumber}
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
