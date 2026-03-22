/**
 * Overlay UI: top bar controls + marquee ticker + 360 product viewer (no React).
 */

// ---- Sharp Icons ----

function sharpIcon(name: 'play' | 'pause' | 'reset', color: string, size: number): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 18 18');
  svg.setAttribute('fill', 'none');
  svg.style.display = 'block';

  if (name === 'play') {
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', '5,3 5,15 15,9');
    poly.setAttribute('fill', color);
    svg.appendChild(poly);
  } else if (name === 'pause') {
    for (const x of [4, 11]) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', '3');
      rect.setAttribute('width', '3');
      rect.setAttribute('height', '12');
      rect.setAttribute('fill', color);
      svg.appendChild(rect);
    }
  } else if (name === 'reset') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4 9 L4 4 L14 4 L14 14 L7 14');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linecap', 'square');
    path.setAttribute('stroke-linejoin', 'miter');
    svg.appendChild(path);
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', '4,6 4,12 7,9');
    arrow.setAttribute('fill', color);
    svg.appendChild(arrow);
  }

  return svg;
}

// ---- Top Bar Config ----

export interface TopBarConfig {
  cameraCount: number;
  initialCameraIndex: number;
  initialFollowCamera: boolean;
  onCameraIndexChange: (index: number) => void;
  onFollowCameraChange: (follow: boolean) => void;
  onResetCamera: () => void;
  onFlyToRig: () => void;
  onPlayStateChange?: (playing: boolean) => void;
}

export interface TopBarHandle {
  setCameraIndex: (index: number) => void;
  setFollowCamera: (active: boolean) => void;
  setPlaying: (state: boolean) => void;
}

// ---- Custom Slider ----

interface SliderHandle {
  element: HTMLElement;
  playBtn: HTMLButtonElement;
  setValue: (index: number) => void;
  setActive: (active: boolean) => void;
  stop: () => void;
  setPlaying: (state: boolean) => void;
}

function createCustomSlider(
  count: number,
  initial: number,
  onChange: (index: number) => void,
  onPlayChange?: (playing: boolean) => void,
): SliderHandle {
  const maxIdx = count - 1;
  let current = initial;
  let isActive = false;

  const ACTIVE_COLOR = '#00FF41';
  const INACTIVE_COLOR = '#888';

  const container = document.createElement('div');
  container.className = 'flex-1 flex flex-col cursor-pointer select-none';
  container.style.touchAction = 'none';
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
  track.className = 'absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px]';
  track.style.background = '#333';
  trackRow.appendChild(track);

  const fill = document.createElement('div');
  fill.className = 'absolute left-0 top-1/2 -translate-y-1/2 h-[3px]';
  fill.style.background = 'rgba(136,136,136,0.3)';
  trackRow.appendChild(fill);

  const thumb = document.createElement('div');
  thumb.className = 'absolute top-1/2 rounded-full';
  thumb.style.width = '12px';
  thumb.style.height = '12px';
  thumb.style.background = '#00FF41';
  thumb.style.animation = 'knob-glow 2s ease-in-out infinite';
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

  function applyColors() {
    const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
    fill.style.background = isActive ? 'rgba(0,255,65,0.3)' : 'rgba(136,136,136,0.3)';
    for (const tickSet of allTicks) {
      tickSet[current].style.background = color;
      tickSet[current].style.boxShadow = `0 0 4px ${color}`;
    }
  }

  function update(index: number) {
    const prev = current;
    current = Math.max(0, Math.min(maxIdx, index));

    const pct = maxIdx > 0 ? (current / maxIdx) * 100 : 0;
    fill.style.width = `${pct}%`;
    thumb.style.left = `${pct}%`;

    for (const tickSet of allTicks) {
      tickSet[prev]?.style.setProperty('background', '#555');
      tickSet[prev]?.style.setProperty('box-shadow', 'none');
    }
    applyColors();

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
    if (playing) stopPlayback();
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

  // Play/pause
  let playing = false;
  let playInterval: ReturnType<typeof setInterval> | null = null;

  const playBtn = document.createElement('button');
  playBtn.className =
    'w-7 h-7 flex items-center justify-center transition-colors shrink-0 ' +
    'hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#00FF41]/60 focus:outline-none';

  function renderPlayBtn() {
    playBtn.innerHTML = '';
    playBtn.appendChild(sharpIcon(playing ? 'pause' : 'play', '#00FF41', 14));
  }
  renderPlayBtn();

  function stopPlayback() {
    if (playInterval) { clearInterval(playInterval); playInterval = null; }
    playing = false;
    renderPlayBtn();
  }

  function startPlayback() {
    stopPlayback();
    playing = true;
    renderPlayBtn();
    playInterval = setInterval(() => {
      const next = current + 1;
      if (next > maxIdx) { stopPlayback(); onPlayChange?.(false); return; }
      update(next);
      onChange(next);
    }, 1000 / 24);
  }

  playBtn.addEventListener('click', () => {
    if (playing) stopPlayback(); else startPlayback();
    onPlayChange?.(playing);
  });

  return {
    element: container,
    playBtn,
    setValue(index: number) {
      update(index);
    },
    setActive(active: boolean) {
      isActive = active;
      applyColors();
    },
    stop() {
      stopPlayback();
    },
    setPlaying(state: boolean) {
      if (state) startPlayback(); else stopPlayback();
    },
  };
}

// ---- Bistable Switch ----

interface BistableSwitchHandle {
  element: HTMLElement;
  setState: (value: boolean) => void;
}

function createBistableSwitch(
  initial: boolean,
  onChange: (active: boolean) => void,
): BistableSwitchHandle {
  let active = initial;

  const outer = document.createElement('div');
  outer.className = 'flex items-center gap-1.5 cursor-pointer select-none shrink-0';

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
  return {
    element: outer,
    setState(value: boolean) {
      active = value;
      render();
    },
  };
}

// ---- Top Bar ----

function createTopBar(config: TopBarConfig): { element: HTMLElement; handle: TopBarHandle } {
  const bar = document.createElement('div');
  bar.className =
    'fixed top-0 left-0 right-0 flex items-center gap-1 px-1 py-px overflow-hidden ' +
    'bg-black/70 backdrop-blur-sm';
  bar.style.zIndex = '9999';
  bar.style.pointerEvents = 'auto';

  const followToggle = createBistableSwitch(config.initialFollowCamera, (active) => {
    slider.setActive(active);
    config.onFollowCameraChange(active);
  });
  followToggle.element.title = 'Follow Camera';

  const slider = createCustomSlider(config.cameraCount, config.initialCameraIndex, (idx) => {
    updateLabel(idx);
    config.onCameraIndexChange(idx);
  }, (playing) => {
    config.onPlayStateChange?.(playing);
  });

  const label = document.createElement('span');
  label.className = 'font-led text-[#00FF41] text-xs tabular-nums whitespace-nowrap shrink-0';
  function updateLabel(index: number) {
    label.textContent = `${index + 1}/${config.cameraCount}`;
  }
  updateLabel(config.initialCameraIndex);

  bar.appendChild(slider.playBtn);
  bar.appendChild(slider.element);
  bar.appendChild(label);
  bar.appendChild(followToggle.element);

  const handle: TopBarHandle = {
    setCameraIndex(index: number) {
      slider.setValue(index);
      updateLabel(index);
    },
    setFollowCamera(active: boolean) {
      followToggle.setState(active);
      slider.setActive(active);
    },
    setPlaying(state: boolean) {
      slider.setPlaying(state);
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

function createProductWindow(): HTMLElement {
  const win = createFloatingWindow('Source Blu-ray', { width: 180, x: 20, y: 40, anchor: 'right' });

  const viewer = create360Viewer({
    baseUrl: './bluray-box/',
    count: 54,
    filetype: 'webp',
    dragSpeed: 20,
    autoplay: true,
    reverse: true,
  });
  viewer.style.width = '100%';
  viewer.style.height = 'auto';
  viewer.style.aspectRatio = '1';

  const buyLabel = document.createElement('a');
  buyLabel.href = 'https://www.blu-ray.com/movies/The-Matrix-Blu-ray/75475/';
  buyLabel.target = '_blank';
  buyLabel.className = 'block text-center font-led text-[#00FF41] text-xs py-1.5';
  buyLabel.style.borderTop = '1px solid #00FF4140';
  buyLabel.style.textDecoration = 'none';
  buyLabel.style.textShadow = '0 0 8px #00FF41, 0 0 20px rgba(0,255,65,0.4)';
  buyLabel.textContent = 'BUY NOW';

  const ownedLabel = document.createElement('div');
  ownedLabel.className = 'text-center font-led text-[10px] py-1 text-[#aaa]';
  ownedLabel.textContent = '(yes i bought it)';

  win.contentEl.appendChild(ownedLabel);
  win.contentEl.appendChild(viewer);
  win.contentEl.appendChild(buyLabel);
  win.setVisible(true);

  return win.element;
}

// ---- Floating Window ----

export interface FloatingWindowHandle {
  element: HTMLElement;
  setVisible: (visible: boolean) => void;
  contentEl: HTMLElement;
}

function createFloatingWindow(title: string, opts?: { width?: number; x?: number; y?: number; anchor?: 'left' | 'right' }): FloatingWindowHandle {
  const anchor = opts?.anchor ?? 'left';
  const win = document.createElement('div');
  win.style.position = 'fixed';
  win.style.zIndex = '9998';
  if (anchor === 'right') {
    win.style.right = `${opts?.x ?? 80}px`;
  } else {
    win.style.left = `${opts?.x ?? 80}px`;
  }
  win.style.bottom = `${opts?.y ?? 40}px`;
  win.style.width = `${opts?.width ?? 400}px`;
  win.style.background = 'rgba(0,0,0,0.85)';
  win.style.border = '1px solid #00FF41';
  win.style.boxShadow = '0 0 12px rgba(0,255,65,0.15)';
  win.style.display = 'none';
  win.style.pointerEvents = 'auto';

  const titleBar = document.createElement('div');
  titleBar.style.display = 'flex';
  titleBar.style.alignItems = 'center';
  titleBar.style.justifyContent = 'space-between';
  titleBar.style.padding = '4px 8px';
  titleBar.style.cursor = 'grab';
  titleBar.style.borderBottom = '1px solid #00FF4140';
  titleBar.style.userSelect = 'none';
  titleBar.style.touchAction = 'none';

  const titleText = document.createElement('span');
  titleText.className = 'font-led';
  titleText.style.color = '#00FF41';
  titleText.style.fontSize = '11px';
  titleText.textContent = title;

  const minimizeBtn = document.createElement('button');
  minimizeBtn.style.background = 'none';
  minimizeBtn.style.border = '1px solid #00FF4160';
  minimizeBtn.style.color = '#00FF41';
  minimizeBtn.style.cursor = 'pointer';
  minimizeBtn.style.fontFamily = 'monospace';
  minimizeBtn.style.fontSize = '12px';
  minimizeBtn.style.lineHeight = '1';
  minimizeBtn.style.padding = '1px 5px';
  minimizeBtn.textContent = '_';

  titleBar.appendChild(titleText);
  titleBar.appendChild(minimizeBtn);

  const content = document.createElement('div');
  content.style.overflow = 'hidden';

  win.appendChild(titleBar);
  win.appendChild(content);

  let minimized = false;
  minimizeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  titleText.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).tagName === 'A') e.stopPropagation();
  });
  minimizeBtn.addEventListener('click', () => {
    minimized = !minimized;
    content.style.display = minimized ? 'none' : '';
    minimizeBtn.textContent = minimized ? '□' : '_';
  });

  // Drag logic
  let dragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  titleBar.addEventListener('pointerdown', (e) => {
    dragging = true;
    titleBar.style.cursor = 'grabbing';
    titleBar.setPointerCapture(e.pointerId);
    const rect = win.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    // Switch to top/left absolute positioning on first drag
    if (win.style.bottom || win.style.right) {
      const r = win.getBoundingClientRect();
      win.style.top = `${r.top}px`;
      win.style.left = `${r.left}px`;
      win.style.bottom = '';
      win.style.right = '';
    }
  });

  titleBar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  });

  titleBar.addEventListener('pointerup', () => {
    dragging = false;
    titleBar.style.cursor = 'grab';
  });

  return {
    element: win,
    contentEl: content,
    setVisible(visible: boolean) {
      win.style.display = visible ? '' : 'none';
    },
  };
}

// ---- Original Frame Viewer ----

export interface FrameViewerHandle {
  element: HTMLElement;
  setFrameIndex: (index: number) => void;
  setActive: (active: boolean) => void;
  setPlaying: (state: boolean) => void;
}

const FRAME_FPS = 24;

function createFrameViewer(
  count: number,
  initial: number,
  onSliderChange: (index: number) => void,
  onPlayChange?: (playing: boolean) => void,
): FrameViewerHandle {
  const win = createFloatingWindow('', { width: 480, x: 80, y: 40 });
  const titleSpan = win.element.querySelector('.font-led') as HTMLElement;
  titleSpan.innerHTML = `ORIGINAL FRAME <span style="color:#aaa;font-size:10px">(ripped from the Blu-ray)</span>`;

  const video = document.createElement('video');
  video.src = '/original-frames.mp4';
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.style.width = '100%';
  video.style.display = 'block';

  const sliderWrap = document.createElement('div');
  sliderWrap.style.padding = '0 8px 0 0';
  sliderWrap.style.display = 'flex';
  sliderWrap.style.alignItems = 'center';
  sliderWrap.style.gap = '4px';

  const slider = createCustomSlider(count, initial, (idx) => {
    video.currentTime = idx / FRAME_FPS;
    onSliderChange(idx);
  }, onPlayChange);

  sliderWrap.appendChild(slider.playBtn);
  sliderWrap.appendChild(slider.element);

  win.contentEl.appendChild(video);
  win.contentEl.appendChild(sliderWrap);
  win.setVisible(true);

  return {
    element: win.element,
    setFrameIndex(index: number) {
      video.currentTime = index / FRAME_FPS;
      slider.setValue(index);
    },
    setActive(active: boolean) {
      slider.setActive(active);
    },
    setPlaying(state: boolean) {
      slider.setPlaying(state);
    },
  };
}

// ---- BTS Video Window ----

function createBtsVideoWindow(): HTMLElement {
  const win = createFloatingWindow('', { width: 300, x: 580, y: 40 });
  const titleSpan = win.element.querySelector('.font-led') as HTMLElement;
  titleSpan.innerHTML =
    'MATRIX BTS VIDEO ' +
    '<a href="https://www.newworlddesigns.co.uk/creating-the-matrix-bullet-time-effect/" target="_blank" style="color:#aaa;font-size:10px;text-decoration:none" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">(Source)</a>';

  const videoWrap = document.createElement('div');
  videoWrap.style.position = 'relative';
  videoWrap.style.width = '100%';
  videoWrap.style.paddingBottom = '75%'; // 4:3

  const iframe = document.createElement('iframe');
  iframe.src = 'https://player.vimeo.com/video/564167222?h=c0583d44ec&dnt=1&app_id=122963';
  iframe.title = 'Bullet Time and The Matrix.mp4';
  iframe.setAttribute('credentialless', '');
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';

  videoWrap.appendChild(iframe);

  win.contentEl.appendChild(videoWrap);
  win.setVisible(true);

  return win.element;
}

// ---- Camera Rig Window ----

function createRigWindow(onFlyToRig: () => void): HTMLElement {
  const win = createFloatingWindow('', { width: 260, x: 580, y: 320 });
  const titleSpan = win.element.querySelector('.font-led') as HTMLElement;
  titleSpan.innerHTML =
    'MATRIX CAMERA RIG ' +
    '<a href="https://beforesandafters.com/2021/07/15/vfx-artifacts-the-bullet-time-rig-from-the-matrix/" target="_blank" style="color:#aaa;font-size:10px;text-decoration:none" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">(Source)</a>';

  const rigImg = document.createElement('img');
  rigImg.src = '/Bulletime.webp';
  rigImg.style.width = '100%';
  rigImg.style.display = 'block';

  const flyBtn = document.createElement('button');
  flyBtn.className = 'font-led';
  flyBtn.textContent = 'FLY TO RIG';
  flyBtn.style.display = 'block';
  flyBtn.style.width = '100%';
  flyBtn.style.padding = '6px';
  flyBtn.style.background = 'none';
  flyBtn.style.border = '1px solid #00FF41';
  flyBtn.style.color = '#00FF41';
  flyBtn.style.fontSize = '11px';
  flyBtn.style.cursor = 'pointer';
  flyBtn.style.textShadow = '0 0 8px #00FF41';
  flyBtn.style.transition = 'background 0.15s';
  flyBtn.addEventListener('mouseenter', () => { flyBtn.style.background = 'rgba(0,255,65,0.1)'; });
  flyBtn.addEventListener('mouseleave', () => { flyBtn.style.background = 'none'; });
  flyBtn.addEventListener('click', onFlyToRig);

  win.contentEl.appendChild(rigImg);
  win.contentEl.appendChild(flyBtn);
  win.setVisible(true);

  return win.element;
}

// ---- Mobile Drawer ----

const MOBILE_BREAKPOINT = 768;

function isMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

interface DrawerPanel {
  titleBar: HTMLElement;
  content: HTMLElement;
  wrapper: HTMLElement;
}

function createMobileDrawer(windows: FloatingWindowHandle[]): HTMLElement {
  const drawer = document.createElement('div');
  drawer.style.position = 'fixed';
  drawer.style.bottom = '0';
  drawer.style.left = '0';
  drawer.style.right = '0';
  drawer.style.zIndex = '9998';
  drawer.style.pointerEvents = 'auto';
  drawer.style.display = 'flex';
  drawer.style.flexDirection = 'column';

  const panels: DrawerPanel[] = [];

  for (const win of windows) {
    const el = win.element;
    const titleBar = el.querySelector('div') as HTMLElement;
    const content = el.children[1] as HTMLElement;

    // Reset floating window styles
    el.style.position = 'static';
    el.style.left = '';
    el.style.right = '';
    el.style.top = '';
    el.style.bottom = '';
    el.style.width = '100%';
    el.style.display = '';
    el.style.boxShadow = 'none';
    el.style.border = 'none';
    el.style.borderTop = '1px solid #00FF41';

    // Disable drag on mobile
    titleBar.style.cursor = 'default';
    titleBar.style.touchAction = 'auto';

    // Content starts collapsed
    content.style.display = 'none';
    content.style.overflow = 'hidden';

    // Remove minimize button on mobile
    const minBtn = titleBar.querySelector('button');
    if (minBtn) minBtn.style.display = 'none';

    panels.push({ titleBar, content, wrapper: el });
    drawer.appendChild(el);
  }

  const TOP_BAR_HEIGHT = 28;
  const MARQUEE_HEIGHT = 24;

  function getAvailableHeight(): number {
    const titleBarsHeight = panels.length * 29;
    return window.innerHeight - TOP_BAR_HEIGHT - MARQUEE_HEIGHT - titleBarsHeight;
  }

  function openPanel(index: number) {
    const available = getAvailableHeight();
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      if (i === index && p.content.style.display === 'none') {
        p.content.style.display = '';
        p.content.style.maxHeight = `${available}px`;
      } else {
        p.content.style.display = 'none';
      }
    }
  }

  panels.forEach((p, i) => {
    p.titleBar.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'A') return;
      openPanel(i);
    });
  });

  window.addEventListener('resize', () => {
    const available = getAvailableHeight();
    for (const p of panels) {
      if (p.content.style.display !== 'none') {
        p.content.style.maxHeight = `${available}px`;
      }
    }
  });

  return drawer;
}

// ---- Init ----

export function initOverlay(config: TopBarConfig): TopBarHandle & { frameViewer: FrameViewerHandle } {
  const root = document.getElementById('root')!;

  // Late-bound ref so the top bar play button can sync the frame viewer
  let frameViewerRef: FrameViewerHandle | null = null;
  const origOnPlay = config.onPlayStateChange;
  config.onPlayStateChange = (playing) => {
    frameViewerRef?.setPlaying(playing);
    origOnPlay?.(playing);
  };

  const { element, handle } = createTopBar(config);
  root.appendChild(element);
  root.appendChild(createMarquee());

  const frameViewer = createFrameViewer(config.cameraCount, config.initialCameraIndex, (idx) => {
    handle.setCameraIndex(idx);
    config.onCameraIndexChange(idx);
  }, (playing) => {
    handle.setPlaying(playing);
  });
  frameViewerRef = frameViewer;

  const productWin = createProductWindow();
  const btsWin = createBtsVideoWindow();
  const rigWin = createRigWindow(config.onFlyToRig);

  if (isMobile()) {
    // Collect all window handles for the drawer
    const allWindows: FloatingWindowHandle[] = [
      { element: frameViewer.element, setVisible: () => {}, contentEl: frameViewer.element.children[1] as HTMLElement },
      { element: btsWin, setVisible: () => {}, contentEl: btsWin.children[1] as HTMLElement },
      { element: rigWin, setVisible: () => {}, contentEl: rigWin.children[1] as HTMLElement },
      { element: productWin, setVisible: () => {}, contentEl: productWin.children[1] as HTMLElement },
    ];
    root.appendChild(createMobileDrawer(allWindows));
  } else {
    root.appendChild(frameViewer.element);
    root.appendChild(btsWin);
    root.appendChild(rigWin);
    root.appendChild(productWin);
  }

  return { ...handle, frameViewer };
}
