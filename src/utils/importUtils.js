import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Helper to normalize URLs (add https:// if missing)
export const normalizeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Helper to generate a unique ID (simple timestamp + random based)
export const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Parse CSV file
export const parseCsv = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

// Parse Excel file
export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Map imported data to staticContent structure
export const mapImportedData = (data) => {
  return data.map((item) => ({
    id: item.id || generateId(),
    iso3: item.iso3 || '',
    langId: item.langId || '',
    languageEn: item.languageEn || item.Language || '',
    langTh: item.langTh || '',
    title_en: item.title_en || item.Title || '',
    title_th: item.title_th || '',
    verse_en: item.verse_en || '',
    verse_th: item.verse_th || '',
    streamUrl: normalizeUrl(item.streamUrl || item.StreamURL || ''),
    trackDownloadUrl: normalizeUrl(item.trackDownloadUrl || item.DownloadURL || ''),
    zipDownloadUrl: normalizeUrl(item.zipDownloadUrl || item.ZipURL || ''),
    programId: item.programId || '',
    shareUrl: normalizeUrl(item.shareUrl || ''),
    sampleUrl: normalizeUrl(item.sampleUrl || ''),
    stableKey: item.stableKey || item.languageEn || '',
  }));
};
