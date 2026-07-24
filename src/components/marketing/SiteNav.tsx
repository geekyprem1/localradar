'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/#how', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#security', label: 'Security' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/demo', label: 'Demo' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090A]/80 backdrop-blur-xl"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <div className="hidden items-center gap-6 text-sm font-medium tracking-snug text-white/55 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded transition-colors hover:text-[#F4F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7]"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="type-button hidden rounded text-white/65 transition-colors hover:text-[#F4F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7] sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="type-button rounded-full bg-[#2DD4A7] px-4 py-2.5 text-[#04130E] transition-all hover:bg-[#3ee2b6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090A]"
          >
            Start Free
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-2 text-white/70 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7] cursor-pointer"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-white/[0.06] bg-[#08090A] px-5 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-white/70 sm:hidden"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
