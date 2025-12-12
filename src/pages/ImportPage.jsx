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
  ExternalLink,
  Info,
} from "lucide-react";


import { ChevronLeft, ChevronRight, Upload } from "../components/Icons"; // Use App icons for nav
import { generateId } from "../utils/importUtils";
import { staticContent } from "../data/staticContent";
import { useOfflineStorage } from "../hooks/useOfflineStorage";

const ACCENT_COLOR_CLASS = "text-brand-red dark:text-white";

const ImportPage = ({ t, lang, onBack, onForward, hasPrev, hasNext, setCustomBackHandler, onNavigate, offlineTracks, downloadTrack }) => {
  // const [importedData, setImportedData] = useState([]); // REMOVED
  
  const [programId, setProgramId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProTip, setShowProTip] = useState(false);
  const [showIdHelp, setShowIdHelp] = useState(false); // NEW: Help toggle
  const [showClearConfirm, setShowClearConfirm] = useState(false); // NEW for Clear All logic
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  
  // Use props for storage
  // const { downloadTrack, offlineTracks } = useOfflineStorage(); // REMOVED LOCAL HOOK

  const [manualEntry, setManualEntry] = useState({
    trackNumber: "1",
    durationString: ""
  });

  // --- Program ID Finder State ---
  const [finderLang, setFinderLang] = useState("");
  const [finderMessageId, setFinderMessageId] = useState("");
  const [finderTrack, setFinderTrack] = useState("1");
  const trackInputRef = React.useRef(null); // Ref for Track dropdown

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
        const dString = selectedItem.duration || "";

        const newTrack = manualEntry.trackNumber || "1";
        setManualEntry(prev => ({ 
            ...prev, 
            durationString: dString
        }));

        // Focus Track Input after a brief delay to allow re-render (enabling the input)
        setTimeout(() => {
            trackInputRef.current?.focus();
        }, 50);

      } else {
         // Clear if not found
          setManualEntry(prev => ({ ...prev, durationString: "" }));
         // setCurrentItem(null); // Don't clear explicitly, just leave as is or let user decide
      }
    } else {
        setManualEntry(prev => ({ ...prev, durationString: "" }));
        // setCurrentItem(null);
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
    // Helper to try multiple proxies (Netlify -> AllOrigins)
    const fetchWithFallback = async (targetUrl, signal) => {
        // 1. Try Netlify Proxy (Production Standard)
        try {
            const res = await fetch(`/.netlify/functions/fast-proxy?url=${encodeURIComponent(targetUrl)}`, { signal });
            if (res.ok) {
                const text = await res.text();
                // Ensure we didn't get the React App HTML (common 404 behavior in SPA)
                if (!text.includes('<div id="root">') && !text.includes("<title>Good News PWA</title>")) {
                    return text;
                }
            }
        } catch (e) {}

        // 2. Try AllOrigins (Dev Fallback)
        try {
           const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, { signal });
           if (res.ok) return await res.text();
        } catch (e) {}
        
        return null;
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      // Fetch English Page
      const textEn = await fetchWithFallback(`https://globalrecordings.net/en/program/${id}`, controller.signal);
      
      let titleEn = "Unknown Title";
      let languageEn = "Unknown Language";
      let foundLangId = "0000";
      let foundIso = "ENG";

      if (textEn) {
          // 1. Parse Title & Language Name
          const parser = new DOMParser();
          const docEn = parser.parseFromString(textEn, "text/html");
          const fullTitleEn = docEn.querySelector("title")?.innerText || "";
          const parts = fullTitleEn.split(" - ").map((s) => s.trim());
          if (parts.length >= 2) {
             titleEn = parts[0];
             languageEn = parts[1];
          }

          // 2. Deep Fetch: Find Language ID Link
          // Look for href="/en/language/12345"
          const langLinkMatch = textEn.match(/href="\/en\/language\/(\d+)"/);
          if (langLinkMatch) {
              foundLangId = langLinkMatch[1];
              
              // 3. Deep Fetch: Get ISO from Language Page
              try {
                  const textLang = await fetchWithFallback(`https://globalrecordings.net/en/language/${foundLangId}`, controller.signal);
                  if (textLang) {
                      // Regex to find "ISO Language Name: ... [kor]"
                      // The [kor] might be inside an <a> tag, so we match loosely
                      // Pattern: ISO Language Name: ... [ ... iso ... ]
                      const isoMatch = textLang.match(/ISO Language Name:.*?\[(.*?)\]/);
                      if (isoMatch) {
                           // Remove any HTML tags if present (e.g. <a href...>kor</a>)
                           let rawIso = isoMatch[1];
                           rawIso = rawIso.replace(/<[^>]*>?/gm, ''); // Strip tags
                           if (rawIso && rawIso.length === 3) {
                               foundIso = rawIso.toUpperCase();
                           }
                      }
                  }
              } catch (e) {
                  console.warn("Deep fetch for ISO failed", e);
              }
          }
      }

      // Fetch Thai Page
      const textTh = await fetchWithFallback(`https://globalrecordings.net/th/program/${id}`, controller.signal);
      
      let titleTh = "ชื่อเรื่องไม่ระบุ";
      let langTh = "ภาษาไม่ระบุ";

      if (textTh) {
          const parser = new DOMParser();
          const docTh = parser.parseFromString(textTh, "text/html");
          const fullTitleTh = docTh.querySelector("title")?.innerText || "";
          const partsTh = fullTitleTh.split(" - ").map((s) => s.trim());
          if (partsTh.length >= 2) {
             titleTh = partsTh[0];
             langTh = partsTh[1];
          }
      }

      // Check if Thai title is missing, same as English, or default placeholder
      if (titleTh === titleEn || titleTh === "Unknown Title" || titleTh === "ชื่อเรื่องไม่ระบุ") {
          try {
             // Use Free Translation API
             const transRes = await fetchWithFallback(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(titleEn)}&langpair=en|th`, controller.signal);
             if (transRes) {
                 const transData = JSON.parse(transRes);
                 if (transData.responseData?.translatedText) {
                     titleTh = transData.responseData.translatedText;
                 }
             }
          } catch (e) {
              console.warn("Auto-translation for Title failed", e);
          }
      }

      // Check if Thai language name is missing, same as English, or default placeholder
      if (langTh === languageEn || langTh === "Unknown Language" || langTh === "ภาษาไม่ระบุ") {
          try {
             // Use Free Translation API
             const transRes = await fetchWithFallback(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(languageEn)}&langpair=en|th`, controller.signal);
             if (transRes) {
                 const transData = JSON.parse(transRes);
                 if (transData.responseData?.translatedText) {
                     langTh = transData.responseData.translatedText;
                 }
             }
          } catch (e) {
              console.warn("Auto-translation for Language failed", e);
          }
      }

      clearTimeout(timeoutId);

      return {
        languageEn: languageEn,
        langTh: langTh,
        title_en: titleEn,
        title_th: titleTh,
        iso3: foundIso,
        langId: foundLangId
      };
    } catch (err) {
      console.warn("Metadata fetch failed", err);
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
      iso3: existingItem?.iso3 || metadata.iso3 || "ENG",
      langId: existingItem?.langId || metadata.langId || "0000",
      languageEn: existingItem?.languageEn || metadata.languageEn || "Custom Import",
      langTh: existingItem?.langTh || metadata.langTh || "นำเข้าเอง",
      title_en: existingItem?.title_en || metadata.title_en || `Message ${id}`,
      title_th: existingItem?.title_th || metadata.title_th || `ข้อความ ${id}`,
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

  const handleDirectAdd = async () => {
    if (!currentItem) return;

    // Check for duplicates in offlineTracks
    const isDuplicate = offlineTracks.some(
        item => item.programId === currentItem.programId && item.trackNumber === currentItem.trackNumber
    );

    if (isDuplicate) {
        alert(t.duplicate_error || "This track is already in your library.");
        return; 
    }
    
    setIsLoading(true);
    try {
        const result = await downloadTrack(currentItem);
        
        if (result && result.success) {
            setSuccessCount(1);
            setShowSuccessModal(true);
            // Don't close Review modal yet, let Success modal handle navigation
        } else {
             alert(`Failed to download: ${result?.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Direct add failed", error);
        alert("Failed to download track.");
    } finally {
        setIsLoading(false);
    }
  };

  /* REMOVED: handleAddItem and handleAddToLibrary */
  
  /* REMOVED: handleCopyJson and handleClearData */

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


        
        
          {/* 1.a Language & Message Selection Row (Restored) */}
          {/* 1.a Language & Message Selection Row (Restored) */}
          <div className="grid grid-cols-1 gap-4 mb-4 border-b border-gray-100 pb-4 dark:border-gray-600">
             {/* Language Select */}
             <div>
                <div className="relative">
                  <select
                    className="block w-full px-3 py-2 border border-blue-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors text-sm font-bold text-black"
                    value={finderLang}
                    onChange={handleFinderLangChange}
                  >
                    <option value="">{t.select_language_placeholder || "-- Select Language --"}</option>
                    {(lang === "th" ? existingLanguagesTh : existingLanguagesEn).map((l, i) => (
                      <option key={i} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
             </div>

             {/* Message Select */}
             <div>
                <div className="relative">
                  <select
                    className="block w-full px-3 py-2 border border-blue-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors text-sm font-bold text-black"
                    value={finderMessageId}
                    onChange={handleFinderMessageChange}
                    disabled={!finderLang}
                  >
                    <option value="">{t.select_message_placeholder || "-- Select Message --"}</option>
                    {availableMessages.map((msg) => (
                      <option key={msg.id} value={msg.id}>
                        {msg.title}
                      </option>
                    ))}
                  </select>
                </div>
             </div>
          </div>
        
          {/* 2. Track & Duration Row */}
          <div className="pt-0 mb-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Track Number */}
                <div>
                   <div className="relative">
                          <select
                              ref={trackInputRef}
                              className="block w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:border-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors text-sm font-bold text-black"
                             value={manualEntry.trackNumber}
                             onChange={(e) => handleTrackChange(e.target.value)}
                             disabled={!finderMessageId && !programId}
                          >
                             {(() => {
                               // Default count if no message selected (though disabled)
                               const count = 20;
                               
                               if (finderMessageId) {
                                   const selectedMsg = staticContent.find(i => i.programId === finderMessageId);
                                   const msgCount = selectedMsg?.trackCount ? Math.ceil(parseFloat(selectedMsg.trackCount)) : 20;
                                   // Use msgCount if valid
                                   if (msgCount > 0) return [...Array(msgCount)].map((_, i) => (
                                     <option key={i} value={i + 1}>Track {i + 1}</option>
                                   ));
                               }
                               
                               // Fallback default options
                               return [...Array(count)].map((_, i) => (
                                 <option key={i} value={i + 1}>Track {i + 1}</option>
                               ));
                             })()}
                          </select>
                  </div>
                </div>

                {/* 2. Duration (Minutes : Seconds) - Editable & Auto-fill */}
                <div>
                   <div className="relative">
                      <input 
                          type="text" 
                          placeholder="HH:MM:SS" 
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-slate-50 dark:bg-gray-800 dark:border-gray-500 dark:text-white text-center text-sm font-mono focus:outline-none cursor-not-allowed"
                          value={manualEntry.durationString || ""}
                          readOnly
                          title="Message Duration"
                      />
                   </div>
                </div>

             </div>
          </div>

          {/* 3. Program ID Row (Full Width) */}
          <div className="mb-4">
             <div className="relative">
               <input
                 type="text"
                 className="block w-full px-3 py-2 border border-blue-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red transition-colors text-sm font-mono text-center font-bold text-black pr-10"
                 placeholder={t.message_id_placeholder || "Message # or Paste URL"}
                 value={programId}
                 onChange={(e) => setProgramId(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleUrlSubmit(e);
                    }
                 }}
               />
               <button
                  type="button"
                  onClick={() => setShowIdHelp(!showIdHelp)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 dark:text-blue-400"
               >
                 <Info className="w-5 h-5" />
               </button>
             </div>
             {showIdHelp && (
               <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-gray-700 p-2 rounded-lg border border-blue-100 dark:border-gray-600">
                  <p className="font-bold mb-1">Enter a Message ID or URL:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Message ID: <span className="font-mono">62808</span></li>
                    <li>5fish URL: <span className="font-mono break-all">https://5fish.mobi/en/62808</span></li>
                    <li>GRN URL: <span className="font-mono break-all">https://globalrecordings.net/en/program/62808</span></li>
                  </ul>
               </div>
             )}
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
        
        {/* External Lookup Section */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-600">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-brand-red dark:text-orange-400" />
              {t.external_lookup_title || "Looking for Something Else?"}
           </h3>
           <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t.external_lookup_desc || "If you can't find your message above, try searching these websites to find the Program ID:"}
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href="https://5fish.mobi/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-brand-red hover:bg-red-800 text-white rounded-lg font-bold transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-95"
              >
                 <img src="/icons/5fish-custom.png" alt="5fish" className="w-6 h-6 object-contain" />
                 5fish.mobi
              </a>
              <a 
                href="https://globalrecordings.net/en/search" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-brand-red hover:bg-red-800 text-white rounded-lg font-bold transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-95"
              >
                 <img src="/icons/grn-thick-dark.svg" alt="Global Recordings Network" className="w-6 h-6 object-contain" />
                 GlobalRecordings.net
              </a>
           </div>
        </div>
      </div>
      </div>

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
                     className="text-gray-400 hover:text-gray-600 dark:text-white dark:hover:text-gray-300 transition-colors"
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
                                <span>ID: {currentItem.programId}</span>
                             </div>
                          </div>
                      </div>

                      {/* --- DUPLICATE WARNINGS --- */}
                      {(() => {
                        const isOffline = offlineTracks.some(
                          (t) =>
                            t.programId == currentItem.programId &&
                            t.trackNumber == currentItem.trackNumber
                        );
                        // Check if program exists in static content (usually Track 1, but we warn generally)
                        const isStatic = staticContent.some(
                          (i) => i.id == currentItem.programId
                        );

                        if (!isOffline && !isStatic) return null;

                        return (
                          <div className="col-span-2 space-y-2">
                            {isOffline && (
                              <button
                                onClick={() => {
                                  if (onNavigate) {
                                      setCurrentItem(null); // Close modal
                                      onNavigate("MyLibrary");
                                  }
                                }}
                                className="w-full text-left bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer group animate-bounce"
                              >
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                <div>
                                  <p className="text-sm font-bold text-green-700 dark:text-green-300 underline decoration-green-300 underline-offset-2">
                                    {t.duplicate_warning_title || "Already in Library"}
                                  </p>
                                  <p className="text-xs text-green-600 dark:text-green-400">
                                    {t.duplicate_warning_text ||
                                      "You have already downloaded this track. Click to view in My Library."}
                                  </p>
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })()}

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
                   const isDuplicate = offlineTracks.some(
                       item => item.programId === currentItem.programId && item.trackNumber === currentItem.trackNumber
                   );
                   return (
                       <div className="flex gap-3">
                          <button
                              onClick={() => setCurrentItem(null)}
                              className="flex-1 py-3 px-4 rounded-lg font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                           >
                              {t.cancel || "Cancel"}
                          </button>
                          <button
                              onClick={handleDirectAdd}
                              disabled={isDuplicate}
                              className={`flex-[2] py-3 px-4 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 
                                  ${isDuplicate ? "bg-gray-400 cursor-not-allowed opacity-70 shadow-none" : "bg-brand-red hover:bg-red-800 shadow-lg hover:scale-[1.02] active:scale-95"}`}
                           >
                              {isDuplicate ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                              {isDuplicate ? (t.already_added || "Already Added") : (t.add_to_library_btn || "Add to My Library")}
                           </button>
                       </div>
                   );
               })()}
            </div>

             </div>
          </div>
        )}


      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {t.import_success_title || "Import Successful"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                 {(t.import_success_text || "Successfully added {{count}} messages to your library.").replace("{{count}}", successCount)}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                   setShowSuccessModal(false);
                   if (onNavigate) onNavigate("MyLibrary");
                }}
                className="w-full py-3 px-4 bg-brand-red hover:bg-red-800 text-white font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {t.go_to_library || "Go to My Library"}
              </button>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
              >
                {t.ok_close || "OK (Stay Here)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
