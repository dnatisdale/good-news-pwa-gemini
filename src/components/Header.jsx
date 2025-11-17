// src/components/Header.jsx
import React from "react";
import "./Header.css"; // Import the new CSS file

// The Header component takes all necessary functions and values as props
const Header = ({
  onLogoClick,
  searchTerm,
  onSearchChange,
  languageControls,
  fontSizeControls,
}) => {
  return (
    <header className="header">
      {/* Top Row: Logo & Controls */}
      <div className="header-top-row">
        {/* Logo/Banner: Now clickable */}
        <div
          className="logo-container"
          onClick={onLogoClick}
          role="button"
          tabIndex="0"
        >
          {/* Replace this with your actual logo/banner content (e.g., text or image) */}
          <h1>Thai Good News</h1>
        </div>

        {/* Controls: Language Switch & Font Size buttons */}
        <div className="controls-container">
          {/* Place your language switch button component/JSX here */}
          {languageControls}
          {/* Place your font size buttons (1, 2, 3) component/JSX here */}
          {fontSizeControls}
        </div>
      </div>

      {/* Bottom Row: Search Bar */}
      <div className="header-bottom-row">
        <input
          type="search"
          placeholder="Search for articles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
    </header>
  );
};

export default Header;
