"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cloud, FolderOpen, Settings, Home, Bot, ChevronDown } from "lucide-react";

interface BotItem {
  id: number;
  botUsername: string;
  isActive: boolean;
  linked: boolean;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [showBots, setShowBots] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/user"), fetch("/api/bots")])
      .then(async ([userRes, botsRes]) => {
        const userData = await userRes.json();
        setConnected(!!userData?.linked);
        try {
          const botsData = await botsRes.json();
          setBots(botsData.bots ?? []);
        } catch {}
      })
      .catch(() => {});
  }, []);

  const activeBot = bots.find((b) => b.isActive && b.linked);
  const linkedBots = bots.filter((b) => b.linked);

  const handleActivate = async (botId: number) => {
    await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate", botId }),
    });
    setBots((prev) =>
      prev.map((b) => ({ ...b, isActive: b.id === botId }))
    );
    setShowBots(false);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">TelegramCloud</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? "bg-green-400" : "bg-neutral-500"
                }`}
              />
              <p className="text-xs text-neutral-400">
                {connected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Selector */}
      {linkedBots.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 font-medium">
            Active Bot
          </p>
          <button
            onClick={() => setShowBots(!showBots)}
            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-800 rounded-lg hover:bg-neutral-750 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">
                @{activeBot?.botUsername || linkedBots[0]?.botUsername}
              </span>
            </div>
            {linkedBots.length > 1 && (
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform ${
                  showBots ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {showBots && linkedBots.length > 1 && (
            <div className="mt-1 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
              {linkedBots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => handleActivate(bot.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-700 transition-colors ${
                    bot.isActive
                      ? "text-blue-400"
                      : "text-neutral-300"
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  @{bot.botUsername}
                  {bot.isActive && (
                    <span className="ml-auto text-[10px] text-blue-400">
                      ACTIVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <p className="text-xs text-neutral-500 text-center">
          Powered by Telegram Bot API
        </p>
      </div>
    </aside>
  );
}
