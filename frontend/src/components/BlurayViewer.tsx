import { useRef, useEffect } from 'preact/hooks';
import { create360Viewer } from '../dom-utils';
import { isMobile } from '../hooks';

export function BlurayViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mobile = isMobile.value;

  useEffect(() => {
    if (!containerRef.current || containerRef.current.children.length > 0) return;
    const viewer = create360Viewer({
      baseUrl: './bluray-box/',
      count: 54,
      filetype: 'webp',
      dragSpeed: 20,
      autoplay: true,
      reverse: true,
    });
    containerRef.current.appendChild(viewer);
  }, []);

  return (
    <div>
      <div class="text-center font-led text-[10px] py-1 text-[#aaa]">(yes i bought it)</div>
      <div ref={containerRef} style={{ maxWidth: mobile ? '150px' : undefined, margin: mobile ? '0 auto' : undefined }} />
      <a
        href="https://www.blu-ray.com/movies/The-Matrix-Blu-ray/75475/"
        target="_blank"
        class="block text-center font-led text-[#00FF41] text-xs py-1.5"
        style={{
          borderTop: '1px solid #00FF4140',
          textDecoration: 'none',
          textShadow: '0 0 8px #00FF41, 0 0 20px rgba(0,255,65,0.4)',
        }}
      >
        BUY NOW
      </a>
    </div>
  );
}
