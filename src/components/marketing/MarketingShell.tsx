import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative min-h-screen overflow-hidden bg-[#08090A] font-sans text-white selection:bg-[#2DD4A7]/25 selection:text-[#2DD4A7]">
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
