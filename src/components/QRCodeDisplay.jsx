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
  fgColor = "#000000",
}) => {
  return (
    <QRCodeSVG
      value={url}
      size={size}
      level={level}
      bgColor={bgColor}
      fgColor={fgColor}
      includeMargin={false}
    />
  );
};

export default QRCodeDisplay;
