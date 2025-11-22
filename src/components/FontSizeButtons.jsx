import React from "react";

const THAI_RED = "#CC3333";
const THAI_BLUE = "#003366";

const FontSizeButtons = ({ fontSize, setFontSize }) => {
  const handleFontSize = (size) => {
    setFontSize(size);
    // --- REMOVED: localStorage.setItem("appFontSize", size); ---
  };

  // Style for unselected buttons (THAI_BLUE)
  const unselectedStyle = { backgroundColor: THAI_BLUE, color: "#ffffff" };
  // Style for selected button (White background, THAI_RED text)
  const selectedStyle = { backgroundColor: "#ffffff", color: THAI_RED };

  // Base class for all buttons
  const baseClass = `p-1 rounded-md font-bold transition-colors shadow-sm text-center flex items-center justify-center`;

  return (
    <div className="flex items-center space-x-1">
      {/* Size 1 */}
      <button
        onClick={() => handleFontSize("14px")}
        className={`${baseClass} w-6 h-5 text-xs z-10`}
        style={fontSize === "14px" ? selectedStyle : unselectedStyle}
      >
        1
      </button>
      {/* Size 2 */}
      <button
        onClick={() => handleFontSize("16px")}
        className={`${baseClass} w-7 h-6 text-base z-20`}
        style={fontSize === "16px" ? selectedStyle : unselectedStyle}
      >
        2
      </button>
      {/* Size 3 */}
      <button
        onClick={() => handleFontSize("20px")}
        className={`${baseClass} w-8 h-7 text-xl z-30`}
        style={fontSize === "20px" ? selectedStyle : unselectedStyle}
      >
        3
      </button>
    </div>
  );
};

export default FontSizeButtons;
