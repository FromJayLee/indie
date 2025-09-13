import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import GlobalHeader from '@/components/layout/GlobalHeader';

export const metadata: Metadata = {
  title: 'Pixel Space - 우주 픽셀아트 감상',
  description: 'SANNABI 스타일의 고해상도 픽셀아트로 구현된 우주 공간을 실시간으로 감상하는 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <GlobalHeader />
          <main className="pt-14 md:pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
