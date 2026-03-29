"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { DropZone } from "@/components/DropZone";
import { FileCard } from "@/components/FileCard";
import { FolderCard } from "@/components/FolderCard";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  FolderPlus,
  ChevronRight,
  Home,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";

interface FileItem {
  id: number;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId: number | null;
  createdAt: string | number;
}

interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
}

export default function FilesPage() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder")
    ? parseInt(searchParams.get("folder")!)
    : null;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFolders, setAllFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { uploading, progress, uploadFiles } = useFileUpload(folderId);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const fetchData = useCallback(async () => {
    try {
      const params = folderId ? `?folderId=${folderId}` : "";
      const [filesRes, foldersRes] = await Promise.all([
        fetch(`/api/files${params}`),
        fetch("/api/folders"),
      ]);

      const filesData = await filesRes.json();
      const allFoldersData = await foldersRes.json();

      setFiles(filesData.files ?? []);
      setFolders(filesData.folders ?? []);
      setAllFolders(allFoldersData ?? []);
    } catch {
      showToast("error", "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [folderId, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleUpload = async (fileList: FileList) => {
    const success = await uploadFiles(fileList);
    if (success) {
      showToast("success", "Files uploaded successfully");
      fetchData();
    } else {
      showToast("error", "Upload failed");
    }
  };

  const handleDeleteFile = async (id: number) => {
    try {
      const res = await fetch(`/api/files/download?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("success", "File deleted");
        fetchData();
      }
    } catch {
      showToast("error", "Failed to delete file");
    }
  };

  const handleDownloadFile = async (id: number) => {
    try {
      const res = await fetch(`/api/files/download?id=${id}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      showToast("error", "Failed to get download link");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), parentId: folderId }),
      });
      setNewFolderName("");
      setCreatingFolder(false);
      showToast("success", "Folder created");
      fetchData();
    } catch {
      showToast("error", "Failed to create folder");
    }
  };

  const handleDeleteFolder = async (id: number) => {
    try {
      await fetch(`/api/folders?id=${id}`, { method: "DELETE" });
      showToast("success", "Folder deleted");
      fetchData();
    } catch {
      showToast("error", "Failed to delete folder");
    }
  };

  const handleRenameFolder = async (id: number, name: string) => {
    try {
      await fetch("/api/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      showToast("success", "Folder renamed");
      fetchData();
    } catch {
      showToast("error", "Failed to rename folder");
    }
  };

  const getBreadcrumbs = () => {
    const crumbs: FolderItem[] = [];
    let currentId = folderId;
    while (currentId) {
      const folder = allFolders.find((f) => f.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const filteredFiles = searchQuery
    ? files.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const filteredFolders = searchQuery
    ? folders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : folders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-600/20 border border-green-600/30 text-green-300"
              : "bg-red-600/20 border border-red-600/30 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Files</h1>
          <div className="flex items-center gap-1 mt-1 text-sm text-neutral-400">
            <a href="/files" className="hover:text-white">
              <Home className="w-4 h-4" />
            </a>
            {getBreadcrumbs().map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <a
                  href={`/files?folder=${crumb.id}`}
                  className="hover:text-white"
                >
                  {crumb.name}
                </a>
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setCreatingFolder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-sm font-medium text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-700"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 transition-colors"
          />
        </div>
      </div>

      {creatingFolder && (
        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            placeholder="Folder name..."
            className="flex-1 max-w-xs px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500"
          >
            Create
          </button>
          <button
            onClick={() => {
              setCreatingFolder(false);
              setNewFolderName("");
            }}
            className="px-4 py-2 bg-neutral-800 text-neutral-400 text-sm rounded-lg hover:bg-neutral-700"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="mb-6">
        <DropZone
          onFilesDropped={handleUpload}
          uploading={uploading}
          progress={progress}
        />
      </div>

      {filteredFolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-neutral-400 mb-3">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                currentFolder={folderId}
                onDelete={handleDeleteFolder}
                onRename={handleRenameFolder}
              />
            ))}
          </div>
        </div>
      )}

      {filteredFiles.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-400 mb-3">Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={handleDeleteFile}
                onDownload={handleDownloadFile}
              />
            ))}
          </div>
        </div>
      )}

      {filteredFiles.length === 0 && filteredFolders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-neutral-500">
            {searchQuery
              ? "No files or folders match your search"
              : "No files or folders yet. Upload files or create a folder to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
