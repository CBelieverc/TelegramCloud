"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";

interface DropZoneProps {
  onFilesDropped: (files: FileList) => void;
  uploading: boolean;
  progress: number;
}

export function DropZone({ onFilesDropped, uploading, progress }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onFilesDropped(e.dataTransfer.files);
      }
    },
    [onFilesDropped]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesDropped(e.target.files);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragOver
          ? "border-blue-500 bg-blue-500/10"
          : "border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-sm text-neutral-400">
            Uploading to Telegram... {progress}%
          </p>
          <div className="w-48 h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-10 h-10 text-neutral-500" />
          <div>
            <p className="text-sm font-medium text-neutral-300">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Max 50MB per file &middot; Stored in your Telegram group
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
