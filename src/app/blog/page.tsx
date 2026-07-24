import type { Metadata } from 'next';
import ComingSoonPage from '@/components/marketing/ComingSoonPage';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description: 'LocalRadar blog — product updates and local growth playbooks. Coming soon.',
  path: '/blog',
  noIndex: true,
});

export default function BlogPage() {
  return (
    <ComingSoonPage
      eyebrow="Coming soon"
      title="Blog & playbooks"
      description="Practical writing on local prospecting, agency workflows, and product updates. No filler posts until we have real content to ship."
    />
  );
}
