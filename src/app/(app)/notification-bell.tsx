'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications?limit=20');
    const data = await res.json();
    if (Array.isArray(data)) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    for (const id of unreadIds) {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/60 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[32rem] flex flex-col bg-black border border-white/10 rounded-md shadow-2xl z-50">
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white text-xs">✕</button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-sm">
                <div className="text-2xl mb-2">🔔</div>
                <div>No notifications</div>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-white/[0.02]' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium flex-1 ${!n.read ? 'text-white' : 'text-white/80'}`}>{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>}
                  </div>
                  <p className="text-xs text-white/60 mb-2">{n.body}</p>
                  <div className="flex justify-between items-center">
                    {n.post_id && (
                      <Link 
                        href={`/library/${n.post_id}`}
                        className="text-[10px] text-blue-400 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                        }}
                      >
                        View Post →
                      </Link>
                    )}
                    <div className="text-[10px] text-white/30">
                      {(() => {
                        const diff = Date.now() - new Date(n.created_at).getTime();
                        const minutes = Math.floor(diff / 60000);
                        const hours = Math.floor(diff / 3600000);
                        const days = Math.floor(diff / 86400000);
                        if (days > 0) return `${days}d ago`;
                        if (hours > 0) return `${hours}h ago`;
                        if (minutes > 0) return `${minutes}m ago`;
                        return 'just now';
                      })()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
