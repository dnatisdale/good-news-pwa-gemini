import React from "react";
import { i18n } from "../i18n"; // Assuming i18n is in src/i18n.js

const ACCENT_COLOR_CLASS = "text-brand-red";
const TEXT_COLOR_CLASS = "text-gray-800";

const ContentCard = ({
  item,
  lang,
  onSelect,
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

  return (
    <div className="bg-white p-4 mb-3 rounded-xl shadow-md border-t-4 border-gray-200 cursor-pointer transition-transform hover:shadow-lg hover:border-brand-red flex items-start">
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
        <p className="text-sm text-gray-500 mt-0.5">Program No. {item.id}</p>
      </div>
    </div>
  );
};

export default ContentCard;
