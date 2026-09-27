import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth.js';
import { getInitials } from '../../utils/format.js';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click or Escape (returning focus to the trigger).
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const firstName = user.name.split(' ')[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {getInitials(user.name)}
        </span>
        <span>{firstName}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div
          id="user-menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
          <ul className="p-1">
            <li>
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                My account
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
