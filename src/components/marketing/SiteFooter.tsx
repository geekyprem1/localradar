import Link from 'next/link';
import Logo from './Logo';

const product = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#how', label: 'How it works' },
  { href: '/#security', label: 'Security' },
  { href: '/demo', label: 'Demo' },
  { href: '/blog', label: 'Blog', badge: 'Coming Soon' },
  { href: '/roadmap', label: 'Roadmap', badge: 'Coming Soon' },
  { href: '/status', label: 'Status' },
];

const company = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Sign in' },
  { href: '/signup', label: 'Start Free' },
];

const legal = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/refund', label: 'Refund' },
  { href: '/security-policy', label: 'Security' },
  { href: '/ai-usage', label: 'AI Policy' },
  { href: '/acceptable-use', label: 'Acceptable Use' },
  { href: '/subprocessors', label: 'Subprocessors' },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-[#08090A]" role="contentinfo">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              AI-powered local growth intelligence for agencies and SMBs. Scan markets, score opportunities, and generate outreach.
            </p>
          </div>
          <FooterCol title="Product" links={product} />
          <FooterCol title="Company" links={company} />
          <FooterCol title="Legal" links={legal} />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] text-white/30">
            © {new Date().getFullYear()} LocalRadar. All rights reserved.
          </p>
          <nav aria-label="Legal quick links" className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-white/30">
            <Link href="/privacy" className="hover:text-white/60">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60">Terms</Link>
            <Link href="/cookies" className="hover:text-white/60">Cookies</Link>
            <Link href="/security-policy" className="hover:text-white/60">Security</Link>
            <Link href="/status" className="hover:text-white/60">Status</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; badge?: string }[];
}) {
  return (
    <div>
      <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
              {l.label}
              {l.badge && (
                <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-white/30">
                  {l.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
