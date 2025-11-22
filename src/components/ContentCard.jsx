import React from "react";
import { i18n } from "../i18n"; // Assuming i18n is in src/i18n.js

const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";

const ContentCard = ({
  item,
  lang,
  onSelect,
  t, // NEW: Translation object
  showLanguageName = true,
  isSelected, // NEW: Is this specific message selected?
  onToggle, // NEW: Function to toggle this message
}) => {
  const languageDisplayName =
    lang === "en" ? item.languageEn ?? "" : item.langTh ?? "";
  const messageTitle =
    lang === "en"
      ? item.title_en ?? "Untitled Message"
      : item.title_th ?? "ข้อความที่ไม่มีชื่อ";
  const verseDisplay =
    lang === "en" ? item.verse_en ?? "" : item.verse_th ?? "";

  return (
    <div className="bg-white p-4 mb-3 rounded-xl shadow-md border-t-4 border-gray-200 cursor-pointer card-hover flex items-start">
      {/* --- NEW: CHECKBOX AREA --- */}
      {onToggle && (
        <div
          className="pr-4 pt-1"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <input
            type="checkbox"
            className="w-6 h-6 accent-[#003366] cursor-pointer"
            checked={isSelected || false}
            onChange={() => {}} // Handled by div click
          />
        </div>
      )}

      {/* Content Info */}
      <div className="flex-grow" onClick={() => onSelect(item)}>
        {showLanguageName && (
          <p className={`text-base font-semibold ${ACCENT_COLOR_CLASS} mb-1`}>
            {languageDisplayName}
          </p>
        )}
        <h3
          className={`text-lg font-bold ${TEXT_COLOR_CLASS} ${
            showLanguageName ? "" : "mt-1"
          }`}
        >
          {messageTitle}
        </h3>
        
        {/* NEW: Verse / Track Title Display */}
        {verseDisplay && (
          <p className="text-md text-gray-700 font-medium mt-1">
            {verseDisplay}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-1.5">
          {t?.program_number || "Message No."} {item.id}
        </p>
      </div>
    </div>
  );
};

export default ContentCard;
