import React from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * A reusable component to display a QR code.
 * @param {string} url - The URL/data to encode in the QR code.
 * @param {number} size - The width and height of the QR code in pixels.
 * @param {string} level - The error correction level ('L', 'M', 'Q', 'H').
 * @param {string} bgColor - The background color of the QR code.
 * @param {string} fgColor - The foreground color (the code itself).
 */
const QRCodeDisplay = ({
  url,
  size = 128,
  level = "H",
  bgColor = "#FFFFFF",
  fgColor = "#000000", // Defaulting to black as requested
}) => {
  return (
    <QRCodeSVG
      value={url}
      size={size}
      level={level}
      bgColor={bgColor}
      fgColor={fgColor}
      includeMargin={false} // We will handle padding in the parent component
    />
  );
};

export default QRCodeDisplay;
