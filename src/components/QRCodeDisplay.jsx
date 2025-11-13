import React from "react";
import { QRCodeSVG } from "qrcode.react";

const QRCodeDisplay = ({ url, size = 128, level = "H" }) => {
  if (!url) {
    return (
      <div className="p-4 text-center text-gray-500">
        URL not available for QR code.
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4">
      <div className="p-2 border-4 border-gray-100 bg-white rounded-lg shadow-xl">
        {/* QRCodeSVG component generates an SVG image of the QR code.
                  This is great for quality and performance.
                */}
        <QRCodeSVG
          value={url}
          size={size}
          level={level}
          bgColor="#ffffff"
          fgColor="#a91b0d" // Using your brand red color
        />
      </div>
    </div>
  );
};

export default QRCodeDisplay;
