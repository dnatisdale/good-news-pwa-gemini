import React, { useState } from 'react';
import { Download, Plus, Trash2, Copy, CheckCircle, Search, Globe, Music } from 'lucide-react';
import { generateId } from '../utils/importUtils';

const ImportPage = ({ t }) => {
  const [importedData, setImportedData] = useState([]);
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Temporary state for the item being added
  const [currentItem, setCurrentItem] = useState(null);

  const extractProgramId = (url) => {
    // Matches /program/12345 or just 12345
    const match = url.match(/program\/(\d+)/) || url.match(/(\d{5,})/);
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

    const id = extractProgramId(inputUrl);

    if (!id) {
      setError('Could not extract Program ID from URL. Please enter a valid GRN Program URL (e.g., https://globalrecordings.net/en/program/62808)');
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
      setInputUrl('');
      // Reset manual entry for next time
      setManualEntry(prev => ({ ...prev, trackNumber: '1' }));
    }
  };

  const handleCopyJson = () => {
    const jsonString = JSON.stringify(importedData, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert('JSON copied to clipboard! You can now paste it into src/data/staticContent.js');
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all imported data?')) {
      setImportedData([]);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Import Content</h1>

      {/* URL Input Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <form onSubmit={handleUrlSubmit}>
          <div className="flex gap-4 mb-4">
            <div className="flex-grow">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GRN Program URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="https://globalrecordings.net/en/program/62808"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Track #
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
              Fetch & Generate
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Review & Edit Section */}
      {currentItem && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8 border-2 border-red-100 dark:border-red-900/30">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Review & Edit</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Language (EN)</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.languageEn}
                onChange={(e) => setCurrentItem({...currentItem, languageEn: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Language (TH)</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.langTh}
                onChange={(e) => setCurrentItem({...currentItem, langTh: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Title (EN)</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.title_en}
                onChange={(e) => setCurrentItem({...currentItem, title_en: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Title (TH)</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={currentItem.title_th}
                onChange={(e) => setCurrentItem({...currentItem, title_th: e.target.value})}
              />
            </div>
          </div>

          <div className="mb-4">
             <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Generated URLs (Read-only)</label>
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
            Add to List
          </button>
        </div>
      )}

      {/* List of Imported Items */}
      {importedData.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Ready to Export ({importedData.length})
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
                Copy JSON
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
