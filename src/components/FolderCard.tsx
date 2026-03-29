"use client";

import { useState } from "react";
import { Folder, MoreVertical, Trash2, Pencil, FolderOpen } from "lucide-react";
import Link from "next/link";

interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
}

interface FolderCardProps {
  folder: FolderItem;
  currentFolder: number | null;
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
}

export function FolderCard({
  folder,
  currentFolder,
  onDelete,
  onRename,
}: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRename(folder.id, newName.trim());
    }
    setRenaming(false);
  };

  return (
    <div className="group relative bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 hover:border-neutral-600 transition-colors">
      <div className="flex items-center gap-3">
        <Link
          href={`/files?folder=${folder.id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 text-amber-400" />
          </div>
          {renaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="flex-1 bg-neutral-700 text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onClick={(e) => e.preventDefault()}
            />
          ) : (
            <span className="text-sm font-medium text-white truncate">
              {folder.name}
            </span>
          )}
        </Link>
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
                    setRenaming(true);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700"
                >
                  <Pencil className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    onDelete(folder.id);
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
