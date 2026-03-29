"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Link2Off,
  CheckCircle,
  AlertCircle,
  Shield,
  Bot,
  ExternalLink,
  Send,
  Copy,
} from "lucide-react";

interface UserStatus {
  id: number;
  linked: boolean;
  telegramUserId: string | null;
  telegramGroupChatId: string | null;
  registrationCode: string | null;
  botConfigured: boolean;
  botUsername: string;
  linkedAt: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [waitingConfirm, setWaitingConfirm] = useState(false);
  const [telegramLink, setTelegramLink] = useState("");
  const [dbError, setDbError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setDbError(null);
      } else {
        setDbError(data.error || "Failed to load user data");
      }
    } catch (err) {
      setDbError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/user", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Failed to connect");
        fetchStatus();
        return;
      }

      // Build the link
      const link =
        data.telegramLink ||
        (data.botUsername
          ? `https://t.me/${data.botUsername}?start=${data.registrationCode}`
          : "");

      setTelegramLink(link);
      setWaitingConfirm(true);
      fetchStatus();

      if (link) {
        window.open(link, "_blank");
        showToast("success", "Opened Telegram. Tap send, then come back here.");
      } else {
        showToast(
          "error",
          "Could not determine bot username. Set NEXT_PUBLIC_BOT_USERNAME env var."
        );
      }
    } catch (err) {
      console.error("Connect error:", err);
      showToast("error", "Failed to connect");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("success", "Telegram connected successfully!");
        setWaitingConfirm(false);
        setTelegramLink("");
        fetchStatus();
      } else {
        showToast("error", data.error || "Connection not confirmed yet");
      }
    } catch {
      showToast("error", "Failed to confirm");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Disconnect Telegram? Your files will remain in the Telegram group but won't be accessible from this app."
      )
    )
      return;

    setActionLoading(true);
    setWaitingConfirm(false);
    setTelegramLink("");
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Disconnected successfully");
        fetchStatus();
      }
    } catch {
      showToast("error", "Failed to disconnect");
    } finally {
      setActionLoading(false);
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
          Connect your Telegram for unlimited cloud storage
        </p>
      </div>

      {dbError && (
        <div className="mb-6 p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-200">
                Database Error
              </p>
              <p className="text-xs text-red-400/70 mt-0.5">{dbError}</p>
            </div>
            <button
              onClick={fetchStatus}
              className="px-3 py-1.5 bg-red-600/20 text-red-300 text-xs rounded-lg hover:bg-red-600/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!user?.botConfigured && (
        <div className="mb-6 p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-200">
                Bot not configured
              </p>
              <p className="text-xs text-red-400/70">
                The server admin needs to set TELEGRAM_BOT_TOKEN environment
                variable
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Telegram Connection
          </h2>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              user?.linked
                ? "bg-green-600/20 text-green-400"
                : "bg-neutral-700 text-neutral-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                user?.linked ? "bg-green-400" : "bg-neutral-500"
              }`}
            />
            {user?.linked ? "Connected" : "Not Connected"}
          </div>
        </div>

        {user?.linked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-600/10 border border-green-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm text-green-200">
                  Your private cloud storage is active
                </p>
                <p className="text-xs text-green-400/60 mt-0.5">
                  Files are stored in your private Telegram group
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-neutral-800 rounded-lg">
                <p className="text-neutral-500 text-xs">Telegram User ID</p>
                <p className="text-white font-mono mt-0.5">
                  {user.telegramUserId ?? "N/A"}
                </p>
              </div>
              <div className="p-3 bg-neutral-800 rounded-lg">
                <p className="text-neutral-500 text-xs">Group Chat ID</p>
                <p className="text-white font-mono mt-0.5">
                  {user.telegramGroupChatId ?? "N/A"}
                </p>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-600/30 disabled:opacity-50 transition-colors"
            >
              <Link2Off className="w-4 h-4" />
              Disconnect Telegram
            </button>
          </div>
        ) : waitingConfirm ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <Send className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-sm text-blue-200">
                  Waiting for confirmation
                </p>
                <p className="text-xs text-blue-400/60 mt-0.5">
                  Tap the button below to open Telegram and send the command
                </p>
              </div>
            </div>

            {user?.registrationCode && (
              <div className="space-y-3">
                {(() => {
                  const link =
                    telegramLink ||
                    (user.botUsername
                      ? `https://t.me/${user.botUsername}?start=${user.registrationCode}`
                      : "");

                  if (link) {
                    return (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Telegram
                      </a>
                    );
                  }
                  return null;
                })()}

                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-blue-300 font-mono">
                    /start {user.registrationCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `/start ${user.registrationCode}`
                      );
                      showToast("success", "Copied!");
                    }}
                    className="p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                    title="Copy command"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                {actionLoading ? "Checking..." : "Confirm Connection"}
              </button>
              <button
                onClick={() => {
                  setWaitingConfirm(false);
                  setTelegramLink("");
                  fetchStatus();
                }}
                className="px-4 py-2 bg-neutral-800 text-neutral-400 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-400">
              One click to connect. You&rsquo;ll be redirected to Telegram to
              authorize the bot, which will create a private storage group for
              you.
            </p>

            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {actionLoading ? "Connecting..." : "Connect Telegram"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
        <ol className="space-y-3 text-sm text-neutral-400">
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Click{" "}
              <strong className="text-neutral-300">Connect Telegram</strong> -
              you&rsquo;ll be redirected to Telegram
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>
              Tap <strong className="text-neutral-300">Send</strong> in
              Telegram to authorize the bot
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>
              Come back and click{" "}
              <strong className="text-neutral-300">Confirm Connection</strong>
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
