/**
 * Overlay UI: marquee ticker + 360 product viewer (no React).
 */

// ---- Marquee ----

function createMarquee(): HTMLElement {
  const contentHTML = `<span class="text-[#00FF41] font-led px-0 text-2xl bg-black">original <span class="text-blue-400 px-1">bullet time</span> footage ripped from (↑) this <span class="text-blue-400 px-1">blu-ray</span>&nbsp; disc (↑)<span class="px-4">/</span></span>`;
  const repeated = contentHTML.repeat(4);
  const extraForWide = `<span class="hidden 3xl:inline">${contentHTML.repeat(4)}</span>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'absolute bottom-0 z-20 w-screen font-led shadow-xl shadow-neutral-800';
  wrapper.innerHTML = `
    <div class="relative flex flex-row overflow-x-hidden">
      <div class="animate-marquee whitespace-nowrap bg-black text-white">
        ${repeated}${extraForWide}
      </div>
      <div class="absolute top-0 z-10 animate-marquee2 whitespace-nowrap bg-black text-white">
        ${repeated}${extraForWide}
      </div>
    </div>
  `;
  return wrapper;
}

// ---- 360 Product Viewer ----

interface ViewerOptions {
  baseUrl: string;
  count: number;
  filetype: string;
  dragSpeed: number;
  autoplay: boolean;
  reverse: boolean;
}

function create360Viewer(options: ViewerOptions): HTMLElement {
  const { baseUrl, count, filetype, dragSpeed, autoplay, reverse } = options;

  const container = document.createElement('div');
  container.className = 'cursor-move select-none';
  container.style.width = '150px';
  container.style.height = '150px';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  // Preload all images
  const images: HTMLImageElement[] = [];
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    img.src = `${baseUrl}${i}.${filetype}`;
    img.draggable = false;
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = i === 1 ? 'block' : 'none';
    container.appendChild(img);
    images.push(img);
  }

  let currentIndex = 0;
  let accumulatedDrag = 0;

  function showFrame(index: number) {
    images[currentIndex].style.display = 'none';
    currentIndex = ((index % count) + count) % count;
    images[currentIndex].style.display = 'block';
  }

  // Mouse drag
  let dragging = false;
  let lastX = 0;

  container.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    accumulatedDrag += dx;
    const threshold = dragSpeed;
    if (Math.abs(accumulatedDrag) >= threshold) {
      const steps = Math.floor(Math.abs(accumulatedDrag) / threshold);
      const direction = reverse ? -Math.sign(accumulatedDrag) : Math.sign(accumulatedDrag);
      showFrame(currentIndex + direction * steps);
      accumulatedDrag = accumulatedDrag % threshold;
    }
  });

  container.addEventListener('pointerup', () => {
    dragging = false;
    accumulatedDrag = 0;
  });

  // Autoplay
  if (autoplay) {
    const dir = reverse ? -1 : 1;
    setInterval(() => {
      if (!dragging) showFrame(currentIndex + dir);
    }, 80);
  }

  return container;
}

function createProductCorner(position: 'left' | 'right'): HTMLElement {
  const posClasses = position === 'left'
    ? 'fixed bottom-0 left-0 z-10 p-8 md:flex flex-col gap-2 w-36 md:w-auto hidden'
    : 'fixed bottom-0 right-0 z-10 p-8 md:flex flex-col gap-2 w-36 md:w-auto flex';

  const hoverTranslate = position === 'left'
    ? 'hover:translate-x-1/2'
    : 'hover:-translate-x-1/2';

  const outer = document.createElement('div');
  outer.className = posClasses;

  const scaleWrap = document.createElement('div');
  scaleWrap.className = `mx-auto hover:scale-[200%] hover:-translate-y-1/2 ${hoverTranslate} transition-all group`;

  // Buy now label (visible on hover)
  const buyLabel = document.createElement('div');
  buyLabel.className = 'text-center hidden group-hover:block font-led text-[#00FF41] animate-led-text-glow-green';
  buyLabel.innerHTML = `<span class="px-2 py-1 bg-black mx-auto"><a href="https://www.blu-ray.com/movies/The-Matrix-Blu-ray/75475/" target="_blank">BUY NOW</a></span>`;

  const viewer = create360Viewer({
    baseUrl: './bluray-box/',
    count: 54,
    filetype: 'webp',
    dragSpeed: 20,
    autoplay: true,
    reverse: true,
  });

  scaleWrap.appendChild(buyLabel);
  scaleWrap.appendChild(viewer);
  outer.appendChild(scaleWrap);

  return outer;
}

// ---- Init ----

export function initOverlay() {
  const root = document.getElementById('root')!;

  root.appendChild(createProductCorner('left'));
  root.appendChild(createProductCorner('right'));
  root.appendChild(createMarquee());
}
