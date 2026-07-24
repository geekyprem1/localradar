import type { Metadata } from 'next';
import ComingSoonPage from '@/components/marketing/ComingSoonPage';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Roadmap',
  description: 'LocalRadar product roadmap — coming soon. Transparent planned work for agencies and partners.',
  path: '/roadmap',
  noIndex: true,
});

export default function RoadmapPage() {
  return (
    <ComingSoonPage
      eyebrow="Coming soon"
      title="Public product roadmap"
      description="We are preparing a public roadmap so agencies can see what ships next—without fake launch calendars. Until then, tell us what you need via Contact."
    />
  );
}
