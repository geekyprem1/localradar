import Link from 'next/link';

export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-[1.0625rem] font-semibold tracking-[-0.02em] text-[var(--text-primary,#F4F4F5)]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#2DD4A7]/12 ring-1 ring-[#2DD4A7]/25">
        <svg className="h-4 w-4 text-[#2DD4A7]" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
          <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
          <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
          <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
        </svg>
      </span>
      LocalRadar
    </Link>
  );
}
