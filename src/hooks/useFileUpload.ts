"use client";

import { useState, useCallback } from "react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB Telegram Bot API limit

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function useFileUpload(folderId: number | null = null) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        const names = oversized.map((f) => f.name).join(", ");
        setState({
          uploading: false,
          progress: 0,
          error: `File${oversized.length > 1 ? "s" : ""} exceed 50MB limit: ${names}`,
        });
        return false;
      }

      const validFiles = files.filter((f) => f.size > 0);
      if (validFiles.length === 0) {
        setState({
          uploading: false,
          progress: 0,
          error: "No valid files to upload",
        });
        return false;
      }

      setState({ uploading: true, progress: 0, error: null });

      try {
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          const formData = new FormData();
          formData.append("file", file);
          if (folderId) {
            formData.append("folderId", String(folderId));
          }

          const res = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
          }

          setState((prev) => ({
            ...prev,
            progress: Math.round(((i + 1) / validFiles.length) * 100),
          }));
        }

        setState({ uploading: false, progress: 100, error: null });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ uploading: false, progress: 0, error: message });
        return false;
      }
    },
    [folderId]
  );

  return { ...state, uploadFiles };
}
