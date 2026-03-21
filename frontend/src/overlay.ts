/**
 * Overlay UI: top bar controls + marquee ticker + 360 product viewer (no React).
 */

import { createElement, Eye, EyeOff, Video, VideoOff, RotateCcw } from 'lucide';

// ---- Top Bar Config ----

export interface TopBarConfig {
  cameraCount: number;
  initialCameraIndex: number;
  initialShowCones: boolean;
  initialFollowCamera: boolean;
  onCameraIndexChange: (index: number) => void;
  onShowConesChange: (show: boolean) => void;
  onFollowCameraChange: (follow: boolean) => void;
  onResetCamera: () => void;
}

export interface TopBarHandle {
  setCameraIndex: (index: number) => void;
}

// ---- Top Bar ----

function createIconToggle(
  iconOn: Parameters<typeof createElement>[0],
  iconOff: Parameters<typeof createElement>[0],
  initial: boolean,
  onChange: (active: boolean) => void,
): HTMLButtonElement {
  let active = initial;

  const btn = document.createElement('button');
  btn.className =
    'w-9 h-9 flex items-center justify-center rounded transition-colors ' +
    'hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#00FF41]/60 focus:outline-none';

  function render() {
    btn.innerHTML = '';
    const icon = createElement(active ? iconOn : iconOff, {
      size: 18,
      color: active ? '#00FF41' : '#666',
      'stroke-width': 1.5,
    });
    btn.appendChild(icon);
    btn.title = active ? 'On' : 'Off';
  }

  btn.addEventListener('click', () => {
    active = !active;
    render();
    onChange(active);
  });

  render();
  return btn;
}

// ---- Custom Slider ----

interface SliderHandle {
  element: HTMLElement;
  setValue: (index: number) => void;
}

function createCustomSlider(
  count: number,
  initial: number,
  onChange: (index: number) => void,
): SliderHandle {
  const maxIdx = count - 1;
  let current = initial;

  const container = document.createElement('div');
  container.className = 'flex-1 flex flex-col cursor-pointer select-none';
  container.tabIndex = 0;
  container.setAttribute('role', 'slider');
  container.setAttribute('aria-valuemin', '0');
  container.setAttribute('aria-valuemax', String(maxIdx));
  container.setAttribute('aria-valuenow', String(current));

  function createTickRow(): { row: HTMLElement; ticks: HTMLElement[] } {
    const row = document.createElement('div');
    row.className = 'flex justify-between items-end';
    row.style.pointerEvents = 'none';
    const t: HTMLElement[] = [];
    for (let i = 0; i < count; i++) {
      const tick = document.createElement('div');
      const isMajor = i % 10 === 0;
      tick.style.width = '1px';
      tick.style.height = isMajor ? '6px' : '3px';
      tick.style.background = '#555';
      tick.style.transition = 'background 0.15s, box-shadow 0.15s';
      t.push(tick);
      row.appendChild(tick);
    }
    return { row, ticks: t };
  }

  // Top ticks (aligned to bottom edge)
  const topTicks = createTickRow();
  topTicks.row.style.alignItems = 'flex-end';
  container.appendChild(topTicks.row);

  // Track row (contains track, fill, thumb)
  const trackRow = document.createElement('div');
  trackRow.className = 'relative';
  trackRow.style.height = '12px';

  const track = document.createElement('div');
  track.className = 'absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] rounded-sm';
  track.style.background = '#333';
  trackRow.appendChild(track);

  const fill = document.createElement('div');
  fill.className = 'absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-sm';
  fill.style.background = 'rgba(0,255,65,0.3)';
  trackRow.appendChild(fill);

  const thumb = document.createElement('div');
  thumb.className = 'absolute top-1/2 rounded-full';
  thumb.style.width = '12px';
  thumb.style.height = '12px';
  thumb.style.background = '#00FF41';
  thumb.style.boxShadow = '0 0 6px #00ff4180';
  thumb.style.transform = 'translate(-50%, -50%)';
  thumb.style.transition = 'none';
  thumb.style.pointerEvents = 'none';
  trackRow.appendChild(thumb);

  container.appendChild(trackRow);

  // Bottom ticks (aligned to top edge)
  const bottomTicks = createTickRow();
  bottomTicks.row.style.alignItems = 'flex-start';
  container.appendChild(bottomTicks.row);

  const allTicks = [topTicks.ticks, bottomTicks.ticks];

  function update(index: number) {
    const prev = current;
    current = Math.max(0, Math.min(maxIdx, index));

    const pct = maxIdx > 0 ? (current / maxIdx) * 100 : 0;
    fill.style.width = `${pct}%`;
    thumb.style.left = `${pct}%`;

    for (const tickSet of allTicks) {
      tickSet[prev]?.style.setProperty('background', '#555');
      tickSet[prev]?.style.setProperty('box-shadow', 'none');
      tickSet[current].style.background = '#00FF41';
      tickSet[current].style.boxShadow = '0 0 4px #00FF41';
    }

    container.setAttribute('aria-valuenow', String(current));
  }

  function indexFromPointer(clientX: number): number {
    const rect = container.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * maxIdx);
  }

  let dragging = false;

  container.addEventListener('pointerdown', (e) => {
    dragging = true;
    container.setPointerCapture(e.pointerId);
    const idx = indexFromPointer(e.clientX);
    update(idx);
    onChange(idx);
  });

  container.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const idx = indexFromPointer(e.clientX);
    if (idx !== current) {
      update(idx);
      onChange(idx);
    }
  });

  container.addEventListener('pointerup', () => {
    dragging = false;
  });

  container.addEventListener('keydown', (e) => {
    let idx = current;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': idx = Math.min(maxIdx, current + 1); break;
      case 'ArrowLeft': case 'ArrowDown': idx = Math.max(0, current - 1); break;
      case 'Home': idx = 0; break;
      case 'End': idx = maxIdx; break;
      default: return;
    }
    e.preventDefault();
    update(idx);
    onChange(idx);
  });

  update(initial);

  return {
    element: container,
    setValue(index: number) {
      update(index);
    },
  };
}

// ---- Bistable Switch ----

function createBistableSwitch(
  initial: boolean,
  onChange: (active: boolean) => void,
): HTMLElement {
  let active = initial;

  const outer = document.createElement('div');
  outer.className = 'flex items-center gap-1.5 cursor-pointer select-none';

  const labelOff = document.createElement('span');
  labelOff.className = 'font-led text-[10px] leading-none';
  labelOff.textContent = 'FREE';

  const labelOn = document.createElement('span');
  labelOn.className = 'font-led text-[10px] leading-none';
  labelOn.textContent = 'LOCK';

  const track = document.createElement('div');
  track.style.width = '28px';
  track.style.height = '14px';
  track.style.position = 'relative';
  track.style.border = '1px solid #555';
  track.style.transition = 'border-color 0.15s, background 0.15s';

  const knob = document.createElement('div');
  knob.style.position = 'absolute';
  knob.style.top = '1px';
  knob.style.width = '12px';
  knob.style.height = '10px';
  knob.style.transition = 'left 0.15s, background 0.15s, box-shadow 0.15s';

  function render() {
    if (active) {
      track.style.borderColor = '#00FF41';
      track.style.background = 'rgba(0,255,65,0.1)';
      knob.style.left = '13px';
      knob.style.background = '#00FF41';
      knob.style.boxShadow = '0 0 6px #00ff4180';
      labelOn.style.color = '#00FF41';
      labelOff.style.color = '#555';
    } else {
      track.style.borderColor = '#555';
      track.style.background = 'transparent';
      knob.style.left = '1px';
      knob.style.background = '#666';
      knob.style.boxShadow = 'none';
      labelOn.style.color = '#555';
      labelOff.style.color = '#888';
    }
  }

  track.appendChild(knob);
  outer.appendChild(labelOff);
  outer.appendChild(track);
  outer.appendChild(labelOn);

  outer.addEventListener('click', () => {
    active = !active;
    render();
    onChange(active);
  });

  render();
  return outer;
}

// ---- Top Bar ----

function createTopBar(config: TopBarConfig): { element: HTMLElement; handle: TopBarHandle } {
  const bar = document.createElement('div');
  bar.className =
    'fixed top-0 left-0 right-0 flex items-center gap-3 px-4 py-px ' +
    'bg-black/70 backdrop-blur-sm';
  bar.style.zIndex = '9999';
  bar.style.pointerEvents = 'auto';

  const conesToggle = createIconToggle(Eye, EyeOff, config.initialShowCones, config.onShowConesChange);
  conesToggle.title = 'Show Frustums';

  const followToggle = createBistableSwitch(config.initialFollowCamera, config.onFollowCameraChange);
  followToggle.title = 'Follow Camera';

  const slider = createCustomSlider(config.cameraCount, config.initialCameraIndex, (idx) => {
    updateLabel(idx);
    config.onCameraIndexChange(idx);
  });

  const label = document.createElement('span');
  label.className = 'font-led text-[#00FF41] text-sm tabular-nums whitespace-nowrap min-w-[5ch] text-right';
  function updateLabel(index: number) {
    label.textContent = `${index + 1}/${config.cameraCount}`;
  }
  updateLabel(config.initialCameraIndex);

  const resetBtn = document.createElement('button');
  resetBtn.className =
    'w-9 h-9 flex items-center justify-center rounded transition-colors ' +
    'hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#00FF41]/60 focus:outline-none';
  resetBtn.title = 'Reset Camera';
  resetBtn.appendChild(createElement(RotateCcw, { size: 18, color: '#00FF41', 'stroke-width': 1.5 }));
  resetBtn.addEventListener('click', config.onResetCamera);

  bar.appendChild(conesToggle);
  bar.appendChild(resetBtn);
  bar.appendChild(slider.element);
  bar.appendChild(label);
  bar.appendChild(followToggle);

  const handle: TopBarHandle = {
    setCameraIndex(index: number) {
      slider.setValue(index);
      updateLabel(index);
    },
  };

  return { element: bar, handle };
}

// ---- Marquee ----

function createMarquee(): HTMLElement {
  const unitHTML = `<span class="text-[#00FF41] font-led px-0 text-base">original <span class="text-blue-400 px-1">bullet time</span> footage ripped from (↑) this <span class="text-blue-400 px-1">blu-ray</span>&nbsp; disc (↑)<span class="px-4">/</span></span>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'absolute bottom-0 z-20 w-screen overflow-hidden font-led select-none pointer-events-none bg-black';
  wrapper.style.textShadow = '0 0 8px #00FF41, 0 0 20px rgba(0,255,65,0.4)';

  const track = document.createElement('div');
  track.className = 'whitespace-nowrap text-white py-px';
  track.style.willChange = 'transform';

  // Two identical inline-block halves so we can measure the first one exactly
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
    if (!lastTime) { lastTime = now; }
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    offset -= speed * dt;

    if (!halfWidth) {
      halfWidth = halfA.offsetWidth;
    }
    if (halfWidth && -offset >= halfWidth) {
      offset += halfWidth;
    }

    track.style.transform = `translate3d(${offset}px,0,0)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

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

  const outer = document.createElement('div');
  outer.className = posClasses;

  const scaleWrap = document.createElement('div');
  scaleWrap.className = 'mx-auto group';

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

export function initOverlay(config: TopBarConfig): TopBarHandle {
  const root = document.getElementById('root')!;

  const { element, handle } = createTopBar(config);
  root.appendChild(element);
  root.appendChild(createProductCorner('left'));
  root.appendChild(createProductCorner('right'));
  root.appendChild(createMarquee());

  return handle;
}
