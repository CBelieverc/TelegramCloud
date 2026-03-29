"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";
import {
  Cloud,
  File,
  FolderOpen,
  HardDrive,
  ArrowRight,
  Upload,
  Link2,
} from "lucide-react";

interface Stats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  linked: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    linked: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [filesRes, foldersRes, userRes] = await Promise.all([
          fetch("/api/files"),
          fetch("/api/folders"),
          fetch("/api/user"),
        ]);

        const filesData = await filesRes.json();
        const foldersData = await foldersRes.json();
        const userData = await userRes.json();

        setStats({
          totalFiles: filesData.files?.length ?? 0,
          totalFolders: foldersData?.length ?? 0,
          totalSize: filesData.totalSize ?? 0,
          linked: !!userData?.linked,
        });
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-neutral-400 mt-1">
          Manage your Telegram cloud storage
        </p>
      </div>

      {!stats.linked && (
        <div className="mb-8 p-4 bg-amber-600/10 border border-amber-600/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-200">
                  Telegram not connected
                </p>
                <p className="text-xs text-amber-400/70">
                  Connect your Telegram to start uploading files to your private
                  cloud storage
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-500 transition-colors"
            >
              Connect
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <File className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
              <p className="text-sm text-neutral-400">Total Files</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-600/20 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.totalFolders}
              </p>
              <p className="text-sm text-neutral-400">Folders</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatBytes(stats.totalSize)}
              </p>
              <p className="text-sm text-neutral-400">Storage Used</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/files"
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  Upload Files
                </p>
                <p className="text-sm text-neutral-400">
                  Drag & drop or browse to upload
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link
          href="/files"
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Browse Files</p>
                <p className="text-sm text-neutral-400">
                  View and manage your cloud files
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
