"use client";

import { formatBytes, getFileIcon } from "@/lib/utils";
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
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Film,
  music: Music,
  "file-text": FileText,
  archive: Archive,
  file: File,
};

export function FileCard({ file, onDelete, onDownload }: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const iconName = getFileIcon(file.mimeType);
  const Icon = iconMap[iconName] || File;

  return (
    <div className="group relative bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 hover:border-neutral-600 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-neutral-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {formatBytes(file.size)}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={() => {
                    onDownload(file.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
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
