import React, { useState } from 'react';
import { Download, Plus, Trash2, Copy, CheckCircle, Search, Globe, Music } from 'lucide-react';
import { generateId } from '../utils/importUtils';
import { staticContent } from '../data/staticContent';

const ImportPage = ({ t }) => {
  const [importedData, setImportedData] = useState([]);
  const [programId, setProgramId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [manualEntry, setManualEntry] = useState({
    trackNumber: '1'
  });

  // --- Smart Input Logic ---
  const { topTitlesEn, topTitlesTh, existingLanguagesEn, existingLanguagesTh } = React.useMemo(() => {
    // 1. Top 5 Titles (EN)
    const countsEn = {};
    staticContent.forEach(item => {
      const t = item.title_en?.trim();
      if (t) countsEn[t] = (countsEn[t] || 0) + 1;
    });
    const topEn = Object.entries(countsEn)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    // 2. Top 5 Titles (TH)
    const countsTh = {};
    staticContent.forEach(item => {
      const t = item.title_th?.trim();
      if (t) countsTh[t] = (countsTh[t] || 0) + 1;
    });
    const topTh = Object.entries(countsTh)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    // 3. All Languages (EN)
    const langsEn = Array.from(new Set(staticContent.map(i => i.languageEn?.trim()).filter(Boolean))).sort();

    // 4. All Languages (TH)
    const langsTh = Array.from(new Set(staticContent.map(i => i.langTh?.trim()).filter(Boolean))).sort();

    return { topTitlesEn: topEn, topTitlesTh: topTh, existingLanguagesEn: langsEn, existingLanguagesTh: langsTh };
  }, []);

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
      const resEn = await fetch(`https://globalrecordings.net/en/program/${id}`, { signal: controller.signal });
      const textEn = await resEn.text();
      const parser = new DOMParser();
      const docEn = parser.parseFromString(textEn, 'text/html');
      
      // Extract Title (e.g., "Good News - Akeu")
      const fullTitleEn = docEn.querySelector('title')?.innerText || '';
      const [titleEn, langEn] = fullTitleEn.split(' - ').map(s => s.trim());

      // Fetch Thai Page
      const resTh = await fetch(`https://globalrecordings.net/th/program/${id}`, { signal: controller.signal });
      const textTh = await resTh.text();
      const docTh = parser.parseFromString(textTh, 'text/html');
      
      const fullTitleTh = docTh.querySelector('title')?.innerText || '';
      const [titleTh, langTh] = fullTitleTh.split(' - ').map(s => s.trim());

      clearTimeout(timeoutId);

      return {
        languageEn: langEn || 'Unknown Language',
        langTh: langTh || 'ภาษาไม่ระบุ',
        title_en: titleEn || 'Unknown Title',
        title_th: titleTh || 'ชื่อเรื่องไม่ระบุ',
      };
    } catch (err) {
      console.warn('Metadata fetch failed (likely CORS), using placeholders.', err);
      return {
        languageEn: '',
        langTh: '',
        title_en: '',
        title_th: '',
      };
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setCurrentItem(null);

    const id = extractProgramId(programId);

    if (!id) {
      setError('Please enter a valid Program ID (e.g., 62808)');
      setIsLoading(false);
      return;
    }

    // 1. Construct URLs immediately (Fast)
    // Default to track 1 if not specified or empty
    const trackNum = manualEntry.trackNumber || '1';
    const streamUrl = `fivefish.org/T${id}`;
    const trackDownloadUrl = `https://api.globalrecordings.net/files/track/mp3-low/${id}/${trackNum}`;
    const zipDownloadUrl = `https://api.globalrecordings.net/files/set/mp3-low/${id}`; 
    const shareUrl = `5fi.sh/T${id}`;

    // 2. Try to fetch metadata (Slow, might fail)
    const metadata = await fetchMetadata(id);

    setCurrentItem({
      id: generateId(), // Internal ID
      programId: id,    // GRN ID
      iso3: 'ENG',      // Placeholder
      langId: '0000',   // Placeholder
      ...metadata,
      verse_en: '',
      verse_th: '',
      streamUrl,
      trackDownloadUrl,
      zipDownloadUrl,
      shareUrl,
      stableKey: metadata.languageEn || 'New Import'
    });

    setIsLoading(false);
  };

  const handleAddItem = () => {
    if (currentItem) {
      setImportedData([...importedData, currentItem]);
      setCurrentItem(null);
      setProgramId('');
      // Reset manual entry for next time
      setManualEntry(prev => ({ ...prev, trackNumber: '1' }));
    }
  };

  const handleCopyJson = () => {
    const jsonString = JSON.stringify(importedData, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert(t.json_copied_alert || 'JSON copied to clipboard!');
  };

  const handleClearData = () => {
    if (window.confirm(t.clear_data_confirm || 'Are you sure?')) {
      setImportedData([]);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t.import_content_title || 'Import Content'}</h1>

      {/* Program ID Input Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-4">
        <form onSubmit={handleUrlSubmit}>
          <div className="flex gap-4 mb-4">
            <div className="flex-grow">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.program_id_label || 'Program ID'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="62808"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.program_id_hint || 'Enter the GRN Program ID number (e.g., 62808)'}
              </p>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.track_number_label || 'Track #'}
              </label>
              <input
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-center"
                value={manualEntry.trackNumber}
                onChange={(e) => setManualEntry({ ...manualEntry, trackNumber: e.target.value })}
              />
            </div>
          </div>
          <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : <Search className="w-5 h-5" />}
              {t.fetch_generate_btn || 'Fetch & Generate'}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      
      {/* Info Notes Box */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Music className="w-4 h-4" />
          {t.url_pattern_info || 'Auto-Generated URL Pattern'}
        </h3>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p className="font-semibold mb-1">Download URL Format:</p>
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700 font-mono text-xs break-all">
            https://api.globalrecordings.net/files/track/mp3-low/<span className="text-red-600 dark:text-red-400 font-bold">{'{'}{' PROGRAM_ID '}{'}'}</span>/<span className="text-green-600 dark:text-green-400 font-bold">{'{'}{' TRACK_NUMBER '}{'}'}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
            💡 {t.url_pattern_note || 'The app automatically generates the download URL using your Program ID and Track Number. In production, this is proxied through Netlify (/api/proxy-audio/*) to avoid CORS issues.'}
          </p>
        </div>
      </div>

      {/* Review & Edit Section */}
      {currentItem && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8 border-2 border-red-100 dark:border-red-900/30">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t.review_edit_title || 'Review & Edit'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t.lang_en_label || 'Language (EN)'}</label>
              <input
                type="text"
                list="languages-en"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.languageEn}
                onChange={(e) => setCurrentItem({...currentItem, languageEn: e.target.value})}
              />
              <datalist id="languages-en">
                {existingLanguagesEn.map((lang, i) => <option key={i} value={lang} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t.lang_th_label || 'Language (TH)'}</label>
              <input
                type="text"
                list="languages-th"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.langTh}
                onChange={(e) => setCurrentItem({...currentItem, langTh: e.target.value})}
              />
              <datalist id="languages-th">
                {existingLanguagesTh.map((lang, i) => <option key={i} value={lang} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t.title_en_label || 'Title (EN)'}</label>
              <input
                type="text"
                list="titles-en"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.title_en}
                onChange={(e) => setCurrentItem({...currentItem, title_en: e.target.value})}
              />
              <datalist id="titles-en">
                {topTitlesEn.map((title, i) => <option key={i} value={title} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t.title_th_label || 'Title (TH)'}</label>
              <input
                type="text"
                list="titles-th"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.title_th}
                onChange={(e) => setCurrentItem({...currentItem, title_th: e.target.value})}
              />
              <datalist id="titles-th">
                {topTitlesTh.map((title, i) => <option key={i} value={title} />)}
              </datalist>
            </div>
          </div>

          <div className="mb-4">
             <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{t.generated_urls_label || 'Generated URLs'}</label>
             <div className="text-xs text-gray-500 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded space-y-1">
                <p>Stream: {currentItem.streamUrl}</p>
                <p>Download: {currentItem.trackDownloadUrl}</p>
             </div>
          </div>

          <button
            onClick={handleAddItem}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.add_to_list_btn || 'Add to List'}
          </button>
        </div>
      )}

      {/* List of Imported Items */}
      {importedData.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t.ready_to_export_title || 'Ready to Export'} ({importedData.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleClearData}
                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Clear All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopyJson}
                className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Copy className="w-5 h-5" />
                {t.copy_json_btn || 'Copy JSON'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {importedData.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.languageEn} <span className="text-sm font-normal text-gray-500">({item.langTh})</span></h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.title_en}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">ID: {item.programId}</p>
                </div>
                <div className="flex items-center gap-2">
                   {item.trackDownloadUrl && <Music className="w-4 h-4 text-green-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
