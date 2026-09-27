import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Menu, X } from 'lucide-react';

import Logo from '../ui/Logo.jsx';
import Button from '../ui/Button.jsx';
import Container from '../ui/Container.jsx';
import UserMenu from './UserMenu.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_LINKS = [
  { label: 'Find parking', to: '/search' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Popular areas', to: '/#popular-areas' },
  { label: 'List your space', to: '/list-your-space' },
];

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
  }`;

export default function Navbar() {
  const { status, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <Container>
        <nav aria-label="Main" className="flex h-16 items-center justify-between gap-4">
          <Logo onClick={closeMenu} />

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) =>
              link.to.includes('#') ? (
                <Link key={link.to} to={link.to} className={linkClass({ isActive: false })}>
                  {link.label}
                </Link>
              ) : (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ),
            )}
          </div>

          <div className="hidden min-w-40 items-center justify-end gap-2 md:flex">
            {status === 'authenticated' && <UserMenu />}
            {status === 'unauthenticated' && (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  Log in
                </Button>
                <Button to="/signup" size="sm">
                  Sign up
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </nav>
      </Container>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white md:hidden">
          <Container className="py-4">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
              {status === 'authenticated' ? (
                <>
                  <Button to="/account" variant="secondary" onClick={closeMenu}>
                    My account
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="secondary" onClick={closeMenu}>
                    Log in
                  </Button>
                  <Button to="/signup" onClick={closeMenu}>
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
