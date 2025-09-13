'use client';

export default function CanvasPlaceholder() {
  return (
    <div className="w-full h-screen bg-navy flex items-center justify-center relative overflow-hidden">
      {/* 우주 배경 효과를 위한 별들 */}
      <div className="absolute inset-0">
        {/* 작은 별들 */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-lime rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-blue rounded-full animate-pulse delay-1500"></div>
        
        {/* 더 많은 별들 */}
        <div className="absolute top-1/6 left-1/6 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-300"></div>
        <div className="absolute top-2/3 right-1/6 w-0.5 h-0.5 bg-lime rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/6 right-1/2 w-0.5 h-0.5 bg-blue rounded-full animate-pulse delay-1200"></div>
        <div className="absolute top-1/2 right-1/5 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-800"></div>
        <div className="absolute bottom-1/2 left-1/5 w-0.5 h-0.5 bg-lime rounded-full animate-pulse delay-400"></div>
      </div>

      {/* 메인 플레이스홀더 텍스트 */}
      <div className="text-center z-10">
        <h2 className="text-white text-2xl md:text-3xl font-press-start mb-4 tracking-wider">
          Canvas Area
        </h2>
        <p className="text-gray-light text-sm md:text-base font-press-start">
          WebGL 우주 렌더링 영역
        </p>
        
        {/* 사이버펑크 느낌의 글로우 효과 */}
        <div className="mt-8 flex justify-center">
          <div className="w-32 h-32 border border-blue/30 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 border border-lime/50 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 border border-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
