const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/staticContent.js');

const newTracks = [
  {
    title: "Introduction to Recording",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M001%20Introduction%20to%20Recording%2029270.mp3",
    idSuffix: "01"
  },
  {
    title: "Book cover notes & introduction",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M002%20Book%20cover%20notes%20introduction%20to%20Book%2029270.mp3",
    idSuffix: "02"
  },
  {
    title: "Chapter 1 - The First Records",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M003%20Chapter%201%20-%20The%20First%20Records%2029270.mp3",
    idSuffix: "03"
  },
  {
    title: "Chapter 2 - Vision Yet Unrevealed",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M004%20Chapter%202%20-%20Vision%20Yet%20Unrevealed%2029270.mp3",
    idSuffix: "04"
  },
  {
    title: "Chapter 3 - Wanted - Fellow Labourers",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M005%20Chapter%203%20-%20Wanted%20-%20Fellow%20Labourers%2029270.mp3",
    idSuffix: "05"
  },
  {
    title: "Chapter 4 - Hindrances - God's Signposts",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M006%20Chapter%204%20-%20Hindrances%20-%20God%27s%20Signposts%2029270.mp3",
    idSuffix: "06"
  },
  {
    title: "Chapter 5 - Call of the Little People",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M007%20Chapter%205%20-%20Call%20of%20the%20Little%20People%2029270.mp3",
    idSuffix: "07"
  },
  {
    title: "Chapter 6 - To Every Tribe",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M008%20Chapter%206%20-%20To%20Every%20Tribe%2029270.mp3",
    idSuffix: "08"
  },
  {
    title: "Chapter 7 - The Australian Branch",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M009%20Chapter%207%20-%20The%20Australian%20Branch%2029270.mp3",
    idSuffix: "09"
  },
  {
    title: "Chapter 8 - The Task Ahead",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M010%20Chapter%208%20-%20The%20Task%20Ahead%2029270.mp3",
    idSuffix: "10"
  },
  {
    title: "Epilogue",
    url: "https://media.globalrecordings.net/Audio_MP3_low/29/29270/English%20Australia%20Faith%20By%20Hearing%20M011%20Epilogue%2029270.mp3",
    idSuffix: "11"
  }
];

const newEntries = newTracks.map(track => ({
  "id": parseInt(`29270${track.idSuffix}`),
  "iso3": "ENG",
  "langId": "4405",
  "languageEn": "English: Australia",
  "langTh": "อังกฤษ: ออสเตรเลีย",
  "title_en": track.title,
  "title_th": track.title, // Using English title for Thai as I don't have exact translations for chapters
  "verse_en": "Romans 10:17 Consequently, faith comes from hearing the message, and the message is heard through the word about Christ.",
  "verse_th": "โรม 10:17 ดังนั้น ความเชื่อจึงเกิดขึ้นจากการได้ยิน และการได้ยินนั้นก็เกิดขึ้นจากการประกาศเรื่องของพระคริสต์",
  "streamUrl": "fivefish.org/au/4405/A29270",
  "trackDownloadUrl": track.url,
  "zipDownloadUrl": "https://api.globalrecordings.net/files/set/mp3-low/29270.zip",
  "programId": "29270",
  "shareUrl": "fivefish.org/au/4405/A29270",
  "sampleUrl": track.url,
  "stableKey": "English: Australia"
}));

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  // Find the last closing bracket
  const lastBracketIndex = data.lastIndexOf(']');
  if (lastBracketIndex === -1) {
    console.error("Could not find closing bracket");
    return;
  }

  // Construct the new content
  const newContentString = newEntries.map(entry => JSON.stringify(entry, null, 2)).join(',\n');
  
  const updatedData = data.slice(0, lastBracketIndex) + 
                      ',\n' + 
                      newContentString + 
                      '\n' + 
                      data.slice(lastBracketIndex);

  fs.writeFile(filePath, updatedData, 'utf8', (err) => {
    if (err) console.error(err);
    else console.log("Successfully added new tracks!");
  });
});
