"use client";

import { useEffect, useState } from "react";
import { Bot, MessageSquare, Save, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data?.botToken) setBotToken(data.botToken);
        if (data?.chatId) setChatId(data.chatId);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setToast({ type: "error", message: "Both fields are required" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
        }),
      });

      if (res.ok) {
        setToast({ type: "success", message: "Settings saved successfully" });
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to save" });
      }
    } catch {
      setToast({ type: "error", message: "Failed to save settings" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-neutral-400 mt-1">
          Configure your Telegram bot connection
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Telegram Configuration
        </h2>

        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Bot className="w-4 h-4" />
              Bot Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                className="w-full px-4 py-2.5 pr-10 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              Create a bot via{" "}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                @BotFather
              </a>{" "}
              and paste the token here
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <MessageSquare className="w-4 h-4" />
              Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-1001234567890"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Create a private Telegram group, add your bot, then use{" "}
              <a
                href="https://t.me/RawDataBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                @RawDataBot
              </a>{" "}
              to get the chat ID
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Setup Guide</h2>
        <ol className="space-y-3 text-sm text-neutral-400">
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Open{" "}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                @BotFather
              </a>{" "}
              on Telegram and create a new bot with{" "}
              <code className="px-1.5 py-0.5 bg-neutral-800 rounded text-xs">
                /newbot
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>
              Copy the bot token provided by BotFather and paste it above
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>
              Create a new private Telegram group and add your bot as a member
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>
              Send a message in the group, then add{" "}
              <a
                href="https://t.me/RawDataBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                @RawDataBot
              </a>{" "}
              to get the chat ID
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              5
            </span>
            <span>
              Copy the chat ID (starts with -100) and paste it above
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
