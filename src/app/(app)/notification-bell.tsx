"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  post_id: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: "all" })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/40 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-black border border-white/10 rounded-md shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-sm font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-widest font-bold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 transition-colors relative group ${n.read ? 'opacity-60' : 'bg-white/[0.02]'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-bold pr-6">{n.title}</h4>
                    {!n.read && (
                      <button 
                        onClick={() => markRead(n.id)}
                        className="p-1 hover:bg-white/10 rounded absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3 text-green-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                    {n.body}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-white/20">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                    {n.post_id && (
                      <a
                        href={`/library/${n.post_id}`}
                        onClick={() => !n.read && markRead(n.id)}
                        className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        View Post <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-white/20 text-xs italic">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
