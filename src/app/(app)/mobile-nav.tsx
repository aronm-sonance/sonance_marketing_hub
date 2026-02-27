'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileNavProps {
  navItems: { href: string; label: string; icon: string }[];
  adminItems: { href: string; label: string }[];
  isAdmin: boolean;
  userName: string;
  userRole: string;
}

export default function MobileNav({ navItems, adminItems, isAdmin, userName, userRole }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black">
        <div>
          <span className="text-sm font-medium tracking-widest uppercase text-white/90">
            Son<span className="text-cyan-400">a</span>nce
          </span>
          <span className="text-[10px] text-white/40 tracking-wider uppercase ml-2">Hub</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          )}
        </button>
      </div>

      {/* Slide-down menu */}
      {open && (
        <nav className="border-b border-white/10 bg-black/95 backdrop-blur px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <div className="text-[10px] font-medium tracking-widest uppercase text-white/30">Admin</div>
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
          <div className="pt-3 mt-2 border-t border-white/10 px-3">
            <div className="text-xs text-white/50">{userName}</div>
            <div className="text-[10px] text-white/30 capitalize">{userRole}</div>
          </div>
        </nav>
      )}
    </div>
  );
}
