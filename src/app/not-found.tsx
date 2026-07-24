import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090A] px-6 text-center text-white">
      <p className="type-overline text-primary">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-white/50">
        That URL does not exist. Check the address or head back to LocalRadar.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#2DD4A7] px-5 py-2.5 text-sm font-semibold text-[#04130E]"
        >
          Home
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
