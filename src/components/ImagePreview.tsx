"use client";

import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useCallback } from "react";

interface FileItem {
  id: number;
  name: string;
  mimeType: string;
  size: number;
}

interface ImagePreviewProps {
  file: FileItem;
  imageUrl: string;
  onClose: () => void;
  onDownload: (id: number) => void;
}

export function ImagePreview({
  file,
  imageUrl,
  onClose,
  onDownload,
}: ImagePreviewProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(file.id);
          }}
          className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={file.name}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        <div className="mt-4 text-center">
          <p className="text-white text-sm font-medium">{file.name}</p>
        </div>
      </div>
    </div>
  );
}
