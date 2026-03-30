"use client";

import { useEffect, useState, useCallback } from "react";
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
  Plus,
  Trash2,
  Star,
} from "lucide-react";

interface BotItem {
  id: number;
  botUsername: string;
  telegramUserId: string | null;
  telegramChatId: string | null;
  registrationCode: string | null;
  isActive: boolean;
  linked: boolean;
  linkedAt: string | null;
}

interface UserStatus {
  id: number;
  linked: boolean;
  botUsername: string;
  botConfigured: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserStatus | null>(null);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newBotUsername, setNewBotUsername] = useState("");
  const [addingBot, setAddingBot] = useState(false);
  const [waitingConfirm, setWaitingConfirm] = useState<number | null>(null);
  const [pendingCode, setPendingCode] = useState("");
  const [pendingLink, setPendingLink] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [userRes, botsRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/bots"),
      ]);
      const userData = await userRes.json();
      const botsData = await botsRes.json();
      if (userRes.ok) setUser(userData);
      if (botsRes.ok) setBots(botsData.bots ?? []);
    } catch {
      showToast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddBot = async () => {
    const cleaned = newBotUsername.replace("@", "").trim();
    if (!cleaned) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botUsername: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to add bot");
        return;
      }
      setNewBotUsername("");
      setAddingBot(false);
      setPendingCode(data.bot.registrationCode);
      setPendingLink(data.telegramLink);
      setWaitingConfirm(data.bot.id);
      window.open(data.telegramLink, "_blank");
      showToast("success", "Bot added! Send the code in Telegram.");
      fetchData();
    } catch {
      showToast("error", "Failed to add bot");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (botId: number) => {
    setActionLoading(true);
    try {
      await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate", botId }),
      });
      showToast("success", "Bot activated");
      fetchData();
    } catch {
      showToast("error", "Failed to activate");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async (botId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/bots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", botId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Bot confirmed!");
        setWaitingConfirm(null);
        setPendingCode("");
        setPendingLink("");
        fetchData();
      } else {
        showToast("error", data.error || "Not linked yet");
      }
    } catch {
      showToast("error", "Failed to confirm");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnect = (bot: BotItem) => {
    if (!bot.registrationCode) return;
    const link = `https://t.me/${bot.botUsername}?start=${bot.registrationCode}`;
    setPendingCode(bot.registrationCode);
    setPendingLink(link);
    setWaitingConfirm(bot.id);
    window.open(link, "_blank");
  };

  const handleDelete = async (botId: number) => {
    if (!confirm("Remove this bot?")) return;
    setActionLoading(true);
    try {
      await fetch(`/api/bots?botId=${botId}`, { method: "DELETE" });
      showToast("success", "Bot removed");
      if (waitingConfirm === botId) {
        setWaitingConfirm(null);
        setPendingCode("");
        setPendingLink("");
      }
      fetchData();
    } catch {
      showToast("error", "Failed to remove");
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

  const linkedBots = bots.filter((b) => b.linked);
  const unlinkedBots = bots.filter((b) => !b.linked);

  return (
    <div className="p-8 max-w-3xl">
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
          Manage your Telegram bots for cloud storage
        </p>
      </div>

      {/* Add Bot */}
      <div className="mb-6 p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Plus className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Add a Bot</h2>
        </div>
        {!addingBot ? (
          <button
            onClick={() => setAddingBot(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Bot
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">
              Create a bot on{" "}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                @BotFather
              </a>{" "}
              with /newbot, then enter the username below.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={newBotUsername}
                  onChange={(e) =>
                    setNewBotUsername(e.target.value.replace("@", "").trim())
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddBot()}
                  placeholder="my_cloud_bot"
                  className="w-full pl-7 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>
              <button
                onClick={handleAddBot}
                disabled={!newBotUsername.trim() || actionLoading}
                className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingBot(false);
                  setNewBotUsername("");
                }}
                className="px-4 py-2.5 bg-neutral-800 text-neutral-400 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Waiting Confirm */}
      {waitingConfirm && (
        <div className="mb-6 p-5 bg-blue-600/10 border border-blue-600/30 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Send className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-blue-200">
              Waiting for confirmation
            </h2>
          </div>
          <div className="space-y-3">
            {pendingLink && (
              <a
                href={pendingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Telegram
              </a>
            )}
            {pendingCode && (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-blue-300 font-mono">
                  /start {pendingCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`/start ${pendingCode}`);
                    showToast("success", "Copied!");
                  }}
                  className="p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleConfirm(waitingConfirm)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              {actionLoading ? "Checking..." : "Confirm Connection"}
            </button>
            <button
              onClick={() => {
                setWaitingConfirm(null);
                setPendingCode("");
                setPendingLink("");
              }}
              className="px-4 py-2 bg-neutral-800 text-neutral-400 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connected Bots */}
      {linkedBots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            Connected Bots ({linkedBots.length})
          </h2>
          <div className="space-y-3">
            {linkedBots.map((bot) => (
              <div
                key={bot.id}
                className={`p-4 bg-neutral-900 border rounded-xl ${
                  bot.isActive
                    ? "border-green-600/40 bg-green-600/5"
                    : "border-neutral-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        bot.isActive ? "bg-green-600/20" : "bg-neutral-800"
                      }`}
                    >
                      <Bot
                        className={`w-5 h-5 ${
                          bot.isActive ? "text-green-400" : "text-neutral-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        @{bot.botUsername}
                        {bot.isActive && (
                          <span className="ml-2 px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] rounded-full font-bold">
                            ACTIVE
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Chat: {bot.telegramChatId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!bot.isActive && (
                      <button
                        onClick={() => handleActivate(bot.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(bot.id)}
                      disabled={actionLoading}
                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unlinked Bots */}
      {unlinkedBots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-neutral-400 mb-3">
            Not Connected ({unlinkedBots.length})
          </h2>
          <div className="space-y-3">
            {unlinkedBots.map((bot) => (
              <div
                key={bot.id}
                className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-300">
                        @{bot.botUsername}
                      </p>
                      <p className="text-xs text-neutral-500">Not connected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConnect(bot)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Connect
                    </button>
                    <button
                      onClick={() => handleDelete(bot.id)}
                      disabled={actionLoading}
                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {bots.length === 0 && !user?.linked && (
        <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-xl">
          <Bot className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-400 mb-1">No bots added yet</p>
          <p className="text-xs text-neutral-500">
            Click &quot;Add New Bot&quot; above to get started
          </p>
        </div>
      )}

      {/* Legacy */}
      {user?.linked && bots.length === 0 && (
        <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-green-200">Legacy connection active</p>
              <p className="text-xs text-green-400/60">
                Your original Telegram connection is still active
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
