"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type QRCodeModalProps = {
  lotId: number;
  lotTitle: string;
  onClose: () => void;
};

export function QRCodeModal({ lotId, lotTitle, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}?lot=${lotId}` 
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Lot #${lotId} - ${lotTitle}`,
        text: `Consultez la traçabilité du lot "${lotTitle}"`,
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
        >
          ✕
        </button>

        <div className="text-center">
          <h3 className="font-semibold text-stone-900 mb-1">Partager le lot</h3>
          <p className="text-sm text-stone-500 mb-6">#{lotId} - {lotTitle}</p>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white border border-stone-200 rounded-xl">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* URL */}
          <div className="mb-4">
            <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-xs font-mono text-stone-600 bg-transparent outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-2 py-1 text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                {copied ? "✓ Copié" : "Copier"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Partager
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

