import React from "react";

const SelectionBadge = ({
  selectionCount,
  isHovering,
  navigateToSelectedContent,
  t,
  lang,
}) => {
  if (selectionCount === 0) return null;

  const labelSelected = t.selected_count_label || (lang === "th" ? "เลือกแล้ว" : "Selected");

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        navigateToSelectedContent();
      }}
      className="absolute -bottom-1 -right-1 cursor-pointer z-50"
      title={`${selectionCount} ${labelSelected}`}
      aria-label={`${selectionCount} ${labelSelected}`}
    >
      {/* Badge Circle */}
      <span
        key={selectionCount}
        className={`
          text-black text-xs font-bold rounded-full 
          w-6 h-6 flex items-center justify-center 
          border-2 border-white shadow-md
          origin-center
          transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${
            isHovering
              ? "bg-orange-400 scale-125 animate-bounce"
              : "bg-yellow-400 scale-100"
          }
        `}
      >
        {selectionCount}
      </span>
    </span>
  );
};

export default SelectionBadge;
