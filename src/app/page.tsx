'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for PixiJS
const SpaceCanvas = dynamic(() => import('@/components/SpaceCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-navy flex items-center justify-center">
      <div className="text-white font-press-start text-sm">
        Loading Space...
      </div>
    </div>
  ),
});

export default function Home() {
  // Get seed from URL params or use default
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const seed = searchParams?.get('seed') ? parseInt(searchParams.get('seed')!, 10) : undefined;

  return <SpaceCanvas seed={seed} />;
}
