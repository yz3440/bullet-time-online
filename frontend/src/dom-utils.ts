export interface ViewerOptions {
  baseUrl: string;
  count: number;
  filetype: string;
  dragSpeed: number;
  autoplay: boolean;
  reverse: boolean;
}

export function create360Viewer(options: ViewerOptions): HTMLElement {
  const { baseUrl, count, filetype, dragSpeed, autoplay, reverse } = options;

  const container = document.createElement('div');
  container.className = 'cursor-move select-none';
  container.style.width = '100%';
  container.style.aspectRatio = '1';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

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

  if (autoplay) {
    const dir = reverse ? -1 : 1;
    setInterval(() => {
      if (!dragging) showFrame(currentIndex + dir);
    }, 80);
  }

  return container;
}

export function createMarqueeElement(): HTMLElement {
  const unitHTML = `<span class="text-[#00FF41] font-led px-0 text-base">ripped from <span class="text-blue-400 px-1">blu-ray</span><span class="px-4">/</span>aligned with <span class="text-blue-400 px-1">colmap</span><span class="px-4">/</span>reconstructed with <span class="text-blue-400 px-1">gaussian splatting</span><span class="px-4">/</span></span>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'absolute bottom-0 z-20 w-screen overflow-hidden font-led select-none pointer-events-none bg-black';
  wrapper.style.textShadow = '0 0 8px #00FF41, 0 0 20px rgba(0,255,65,0.4)';

  const track = document.createElement('div');
  track.className = 'whitespace-nowrap text-white py-px';
  track.style.willChange = 'transform';

  const halfA = document.createElement('span');
  halfA.style.display = 'inline-block';
  halfA.innerHTML = unitHTML.repeat(6);
  const halfB = document.createElement('span');
  halfB.style.display = 'inline-block';
  halfB.innerHTML = unitHTML.repeat(6);

  track.appendChild(halfA);
  track.appendChild(halfB);
  wrapper.appendChild(track);

  let offset = 0;
  const speed = 60;
  let lastTime = 0;
  let halfWidth = 0;

  function tick(now: number) {
    if (!lastTime) lastTime = now;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    offset -= speed * dt;

    if (!halfWidth) halfWidth = halfA.offsetWidth;
    if (halfWidth && -offset >= halfWidth) offset += halfWidth;

    track.style.transform = `translate3d(${offset}px,0,0)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return wrapper;
}
