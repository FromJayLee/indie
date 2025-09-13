'use client';

import { Info } from 'lucide-react';

export default function GlobalHeader() {
  const handleInfoClick = () => {
    console.log('Info icon clicked');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-12 md:h-14 bg-navy/50 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* 로고 - 모바일에서는 중앙, 데스크톱에서는 좌측 */}
        <div className="flex items-center md:block">
          <h1 className="text-blue text-lg md:text-xl font-press-start tracking-wider absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0">
            PIXEL SPACE
          </h1>
        </div>

        {/* 정보 아이콘 - 우측 고정 */}
        <button 
          onClick={handleInfoClick}
          className="text-white hover:text-lime transition-colors duration-200 hover:drop-shadow-[0_0_8px_rgba(191,255,0,0.5)]"
          aria-label="정보"
        >
          <Info className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
