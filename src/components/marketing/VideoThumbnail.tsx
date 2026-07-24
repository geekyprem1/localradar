'use client';

import { Play } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  onPlay: () => void;
  className?: string;
};

export default function VideoThumbnail({ title, subtitle, onPlay, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className={`group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0E0F11] text-left transition-all hover:border-[#2DD4A7]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7] cursor-pointer ${className}`}
      aria-label={`Play video: ${title}`}
    >
      <div className="relative aspect-video w-full bg-gradient-to-br from-[#0F1311] via-[#0B0C0D] to-[#08090A]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,167,0.12),transparent_65%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
          <span className="relative grid h-14 w-14 place-items-center rounded-full border border-[#2DD4A7]/40 bg-[#2DD4A7]/15 text-[#2DD4A7] shadow-[0_0_40px_-8px_rgba(45,212,167,0.5)] transition-transform group-hover:scale-110">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#2DD4A7]/20" aria-hidden />
            <Play className="relative h-5 w-5 fill-current" aria-hidden />
          </span>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{title}</p>
            {subtitle && <p className="mt-1 text-xs text-white/45">{subtitle}</p>}
          </div>
        </div>
      </div>
    </button>
  );
}
