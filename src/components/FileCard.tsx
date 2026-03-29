"use client";

import { formatBytes, formatDate, getFileIcon, getFileExtension } from "@/lib/utils";
import {
  File,
  Image,
  Film,
  Music,
  FileText,
  Archive,
  Download,
  Trash2,
  MoreVertical,
  Check,
} from "lucide-react";
import { useState } from "react";

interface FileItem {
  id: number;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId: number | null;
  createdAt: string | number;
}

interface FileCardProps {
  file: FileItem;
  selected: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onPreview: (file: FileItem) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Film,
  music: Music,
  "file-text": FileText,
  archive: Archive,
  file: File,
};

const typeColors: Record<string, string> = {
  image: "bg-purple-600/20 text-purple-400",
  video: "bg-pink-600/20 text-pink-400",
  music: "bg-green-600/20 text-green-400",
  "file-text": "bg-blue-600/20 text-blue-400",
  archive: "bg-amber-600/20 text-amber-400",
  file: "bg-neutral-600/20 text-neutral-400",
};

export function FileCard({
  file,
  selected,
  onSelect,
  onDelete,
  onDownload,
  onPreview,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const iconName = getFileIcon(file.mimeType);
  const Icon = iconMap[iconName] || File;
  const ext = getFileExtension(file.name);
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div
      className={`group relative bg-neutral-800/50 border rounded-lg p-4 transition-colors cursor-pointer ${
        selected
          ? "border-blue-500 bg-blue-600/10"
          : "border-neutral-700/50 hover:border-neutral-600"
      }`}
      onClick={() => {
        if (isImage) onPreview(file);
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(file.id);
          }}
          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
            selected
              ? "bg-blue-600 border-blue-600"
              : "border-neutral-600 opacity-0 group-hover:opacity-100"
          }`}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-neutral-300" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500">
              {formatBytes(file.size)}
            </span>
            {ext && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  typeColors[iconName] || typeColors.file
                }`}
              >
                {ext}
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-600 mt-0.5">
            {formatDate(file.createdAt)}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-neutral-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
