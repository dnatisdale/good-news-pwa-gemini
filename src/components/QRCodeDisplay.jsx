import React from "react";
import { QRCodeSVG } from "qrcode.react"; // Correct named import

/**
 * A reusable component to display a QR code.
 */
const QRCodeDisplay = ({
  url,
  size = 128,
  level = "H",
  bgColor = "#FFFFFF",
  fgColor = "#000000", // Defaulting to black
}) => {
  return (
    <QRCodeSVG
      value={url}
      size={size}
      level={level}
      bgColor={bgColor}
      fgColor={fgColor}
      includeMargin={false} // We handle padding in the parent component
    />
  );
};

export default QRCodeDisplay;
