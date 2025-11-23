import React, { useMemo } from "react";
import ContentCard from "../components/ContentCard";
import { ChevronLeft } from "../components/Icons";

const ACCENT_COLOR_CLASS = "text-brand-red";

const ProgramDetailsPage = ({
  lang,
  t,
  programId,
  staticContent,
  onBack,
  onSelectTrack,
}) => {
  // Find all tracks for this program
  const tracks = useMemo(() => {
    return staticContent.filter((item) => String(item.programId) === String(programId));
  }, [staticContent, programId]);

  // Get Program Title from the first track
  const programTitle = useMemo(() => {
    if (tracks.length === 0) return "";
    const first = tracks[0];
    // Use the base title (stripped of M-codes if possible, but here we just use the raw title)
    // Actually, we might want to show the "Program" title which is usually the same for all.
    // Let's use the title from the first track but maybe clean it up if needed.
    return lang === "en" ? first.title_en : first.title_th;
  }, [tracks, lang]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className={`text-xl font-bold ${ACCENT_COLOR_CLASS}`}>
          {programTitle}
        </h1>
      </div>

      <p className="text-sm text-gray-500 mb-4 font-semibold ml-2">
        {tracks.length} {t.tracks || "Tracks"}
      </p>

      {tracks.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          lang={lang}
          t={t}
          onSelect={onSelectTrack}
          showLanguageName={false}
          // We don't need selection checkboxes here for now
        />
      ))}
      <div className="h-16"></div>
    </div>
  );
};

export default ProgramDetailsPage;
