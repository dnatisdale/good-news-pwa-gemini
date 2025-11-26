import React, { useState } from 'react';
import { parseCsv, parseExcel, mapImportedData, normalizeUrl, generateId } from '../utils/importUtils';
import { Download, Upload, Plus, Trash2, Copy, CheckCircle, FileText } from 'lucide-react';

const ImportPage = ({ t }) => {
  const [activeTab, setActiveTab] = useState('manual'); // 'file' or 'manual'
  const [importedData, setImportedData] = useState([]);
  const [manualEntry, setManualEntry] = useState({
    languageEn: '',
    title_en: '',
    verse_en: '',
    verse_th: '',
    streamUrl: '',
    trackDownloadUrl: '',
    zipDownloadUrl: '',
  });
  const [verseSelection, setVerseSelection] = useState('custom'); // 'custom' or 'auto'
  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState('3');
  const [selectedVerse, setSelectedVerse] = useState('16');

  // Mock Bible Data (Simplified for demo)
  const bibleVerses = {
    'John 3:16': {
      en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. John 3:16',
      th: 'เพราะว่าพระเจ้าทรงรักโลก จนได้ทรงประทานพระบุตรองค์เดียวของพระองค์ เพื่อทุกคนที่วางใจในพระบุตรนั้นจะไม่พินาศ แต่มีชีวิตนิรันดร์ ยอห์น 3:16'
    },
    'Romans 10:17': {
      en: 'Consequently, faith comes from hearing the message, and the message is heard through the word about Christ. Romans 10:17',
      th: 'ฉะนั้นความเชื่อเกิดขึ้นได้ก็เพราะการได้ยิน และการได้ยินเกิดขึ้นได้ก็เพราะการประกาศพระคริสต์ โรม 10:17'
    },
    'Psalm 23:1': {
      en: 'The LORD is my shepherd, I lack nothing. Psalm 23:1',
      th: 'พระยาห์เวห์ทรงเลี้ยงดูข้าพเจ้าดุจเลี้ยงแกะ ข้าพเจ้าจะไม่ขัดสน สดุดี 23:1'
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let data = [];
      if (file.name.endsWith('.csv')) {
        data = await parseCsv(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseExcel(file);
      } else {
        alert('Please upload a CSV or Excel file.');
        return;
      }
      
      const mappedData = mapImportedData(data);
      setImportedData([...importedData, ...mappedData]);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please check the format.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    let verseEn = manualEntry.verse_en;
    let verseTh = manualEntry.verse_th;

    if (verseSelection === 'auto') {
      const key = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
      // Fallback if not in mock data
      if (bibleVerses[key]) {
        verseEn = bibleVerses[key].en;
        verseTh = bibleVerses[key].th;
      } else {
         // Simple fallback generation
         verseEn = `[NIV] ${key} text placeholder... ${key}`;
         verseTh = `[TH] ${key} text placeholder... ${key}`;
      }
    }

    const newItem = {
      id: generateId(),
      ...manualEntry,
      verse_en: verseEn,
      verse_th: verseTh,
      streamUrl: normalizeUrl(manualEntry.streamUrl),
      trackDownloadUrl: normalizeUrl(manualEntry.trackDownloadUrl),
      zipDownloadUrl: normalizeUrl(manualEntry.zipDownloadUrl),
      iso3: 'ENG', // Default or add input
      langId: '0000', // Default
      programId: '0000', // Default
      stableKey: manualEntry.languageEn
    };

    setImportedData([...importedData, newItem]);
    // Reset form
    setManualEntry({
      languageEn: '',
      title_en: '',
      verse_en: '',
      verse_th: '',
      streamUrl: '',
      trackDownloadUrl: '',
      zipDownloadUrl: '',
    });
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
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Import Content</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('manual')}
        >
          Manual Entry
        </button>
        <button
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'file'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('file')}
        >
          File Upload
        </button>
      </div>

      {/* Manual Entry Form */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language (English)</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={manualEntry.languageEn}
                onChange={(e) => setManualEntry({ ...manualEntry, languageEn: e.target.value })}
                placeholder="e.g. English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (English)</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={manualEntry.title_en}
                onChange={(e) => setManualEntry({ ...manualEntry, title_en: e.target.value })}
                placeholder="e.g. Good News"
              />
            </div>
          </div>

          {/* Bible Verse Selection */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bible Verse</label>
            <div className="flex space-x-4 mb-3">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-red-600"
                  name="verseType"
                  value="custom"
                  checked={verseSelection === 'custom'}
                  onChange={() => setVerseSelection('custom')}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Custom Text</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-red-600"
                  name="verseType"
                  value="auto"
                  checked={verseSelection === 'auto'}
                  onChange={() => setVerseSelection('auto')}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Auto-Select (NIV / Thai Easy-to-Read)</span>
              </label>
            </div>

            {verseSelection === 'custom' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={manualEntry.verse_en}
                  onChange={(e) => setManualEntry({ ...manualEntry, verse_en: e.target.value })}
                  placeholder="English Verse Text"
                />
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={manualEntry.verse_th}
                  onChange={(e) => setManualEntry({ ...manualEntry, verse_th: e.target.value })}
                  placeholder="Thai Verse Text"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                >
                  <option value="John">John</option>
                  <option value="Romans">Romans</option>
                  <option value="Psalm">Psalm</option>
                  {/* Add more books as needed */}
                </select>
                <input
                  type="text"
                  className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  placeholder="Chapter"
                />
                <input
                  type="text"
                  className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedVerse}
                  onChange={(e) => setSelectedVerse(e.target.value)}
                  placeholder="Verse"
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URLs (Optional - https:// will be added automatically)</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={manualEntry.streamUrl}
              onChange={(e) => setManualEntry({ ...manualEntry, streamUrl: e.target.value })}
              placeholder="Stream URL (e.g. fivefish.org/...)"
            />
            <input
              type="text"
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={manualEntry.trackDownloadUrl}
              onChange={(e) => setManualEntry({ ...manualEntry, trackDownloadUrl: e.target.value })}
              placeholder="Download URL"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add to List
          </button>
        </form>
      )}

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Drag and drop a CSV or Excel file here, or click to select.
          </p>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg cursor-pointer transition-colors"
          >
            Select File
          </label>
          <p className="text-xs text-gray-500 mt-4">
            Supported columns: Language, Title, StreamURL, DownloadURL, ZipURL
          </p>
        </div>
      )}

      {/* Preview Section */}
      {importedData.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Preview ({importedData.length} items)
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
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Copy className="w-5 h-5" />
                Copy JSON
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {importedData.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{item.languageEn}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.title_en}</p>
                    <p className="text-xs text-gray-500 mt-1 italic">{item.verse_en}</p>
                  </div>
                  <div className="text-right">
                    {item.trackDownloadUrl && (
                      <span className="inline-flex items-center text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3 mr-1" /> MP3
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400 break-all">
                  {item.trackDownloadUrl}
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
