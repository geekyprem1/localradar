'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** YouTube embed id or full embed URL. Leave empty for product walkthrough placeholder. */
  videoSrc?: string;
  description?: string;
};

/**
 * Accessible demo video modal.
 * Set NEXT_PUBLIC_DEMO_VIDEO_URL to a YouTube/Vimeo embed URL when you publish a real demo.
 */
export default function VideoModal({ open, onClose, title, videoSrc, description }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const embed =
    videoSrc ||
    process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ||
    '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-default"
        aria-label="Close video dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0E0F11] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
          <div>
            <h2 id="video-modal-title" className="text-sm font-semibold text-white">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[11px] text-white/40">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative aspect-video w-full bg-black">
          {embed ? (
            <iframe
              src={embed}
              title={title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-[#2DD4A7]/30 bg-[#2DD4A7]/10">
                <span className="ml-1 inline-block h-0 w-0 border-y-8 border-l-[14px] border-y-transparent border-l-[#2DD4A7]" aria-hidden />
              </div>
              <p className="text-sm font-medium text-white">Product walkthrough</p>
              <p className="max-w-sm text-xs leading-relaxed text-white/45">
                Interactive product demo is available on the homepage scanner. A hosted video can be connected via{' '}
                <code className="text-white/60">NEXT_PUBLIC_DEMO_VIDEO_URL</code>.
              </p>
              <a
                href="/#demo"
                onClick={onClose}
                className="mt-2 rounded-full bg-[#2DD4A7] px-5 py-2 text-xs font-semibold text-[#04130E]"
              >
                Open live scanner demo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
