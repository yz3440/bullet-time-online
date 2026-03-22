import { useRef, useCallback, useEffect } from 'preact/hooks';
import { Signal, useSignal } from '@preact/signals';
import { SharpIcon } from '../icons';

const ACTIVE_COLOR = '#00FF41';
const INACTIVE_COLOR = '#888';

interface SliderProps {
  count: number;
  value: Signal<number>;
  active: Signal<boolean>;
  playing: Signal<boolean>;
  onChange: (index: number) => void;
  onPlayChange?: (playing: boolean) => void;
  showPlayBtn?: boolean;
}

export function Slider({ count, value, active, playing, onChange, onPlayChange, showPlayBtn = true }: SliderProps) {
  const maxIdx = count - 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const topTicksRef = useRef<HTMLDivElement>(null);
  const bottomTicksRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(value.value);

  const updateVisual = useCallback((index: number) => {
    const prev = currentRef.current;
    currentRef.current = Math.max(0, Math.min(maxIdx, index));
    const cur = currentRef.current;
    const pct = maxIdx > 0 ? (cur / maxIdx) * 100 : 0;

    if (fillRef.current) fillRef.current.style.width = `${pct}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;

    const isAct = active.value;
    const color = isAct ? ACTIVE_COLOR : INACTIVE_COLOR;
    const fillColor = isAct ? 'rgba(0,255,65,0.3)' : 'rgba(136,136,136,0.3)';
    if (fillRef.current) fillRef.current.style.background = fillColor;

    for (const row of [topTicksRef.current, bottomTicksRef.current]) {
      if (!row) continue;
      const prevTick = row.children[prev] as HTMLElement | undefined;
      const curTick = row.children[cur] as HTMLElement | undefined;
      if (prevTick) { prevTick.style.background = '#555'; prevTick.style.boxShadow = 'none'; }
      if (curTick) { curTick.style.background = color; curTick.style.boxShadow = `0 0 4px ${color}`; }
    }
  }, [maxIdx, active]);

  useEffect(() => {
    updateVisual(value.value);
  }, [value.value, active.value, updateVisual]);

  const indexFromPointer = useCallback((clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * maxIdx);
  }, [maxIdx]);

  const stopPlayback = useCallback(() => {
    if (playIntervalRef.current) { clearInterval(playIntervalRef.current); playIntervalRef.current = null; }
    playing.value = false;
  }, [playing]);

  useEffect(() => {
    if (!playing.value && playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, [playing.value]);

  const startPlayback = useCallback(() => {
    stopPlayback();
    playing.value = true;
    playIntervalRef.current = setInterval(() => {
      const next = currentRef.current + 1;
      if (next > maxIdx) {
        stopPlayback();
        onPlayChange?.(false);
        return;
      }
      updateVisual(next);
      value.value = next;
      onChange(next);
    }, 1000 / 24);
  }, [maxIdx, onChange, onPlayChange, stopPlayback, updateVisual, value, playing]);

  const onPointerDown = useCallback((e: PointerEvent) => {
    draggingRef.current = true;
    if (playing.value) { stopPlayback(); onPlayChange?.(false); }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const idx = indexFromPointer(e.clientX);
    updateVisual(idx);
    value.value = idx;
    onChange(idx);
  }, [indexFromPointer, onChange, onPlayChange, playing, stopPlayback, updateVisual, value]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current) return;
    const idx = indexFromPointer(e.clientX);
    if (idx !== currentRef.current) {
      updateVisual(idx);
      value.value = idx;
      onChange(idx);
    }
  }, [indexFromPointer, onChange, updateVisual, value]);

  const onPointerUp = useCallback(() => { draggingRef.current = false; }, []);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    let idx = currentRef.current;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': idx = Math.min(maxIdx, idx + 1); break;
      case 'ArrowLeft': case 'ArrowDown': idx = Math.max(0, idx - 1); break;
      case 'Home': idx = 0; break;
      case 'End': idx = maxIdx; break;
      default: return;
    }
    e.preventDefault();
    updateVisual(idx);
    value.value = idx;
    onChange(idx);
  }, [maxIdx, onChange, updateVisual, value]);

  const ticks = [];
  for (let i = 0; i < count; i++) {
    const isMajor = i % 10 === 0;
    ticks.push(
      <div
        key={i}
        style={{
          width: '1px',
          height: isMajor ? '6px' : '3px',
          background: '#555',
          transition: 'background 0.15s, box-shadow 0.15s',
        }}
      />
    );
  }

  const playButton = showPlayBtn ? (
    <button
      class="w-7 h-7 flex items-center justify-center transition-colors shrink-0 hover:bg-white/10 focus:outline-none"
      onClick={() => {
        if (playing.value) stopPlayback(); else startPlayback();
        onPlayChange?.(playing.value);
      }}
    >
      <SharpIcon name={playing.value ? 'pause' : 'play'} size={14} />
    </button>
  ) : null;

  const sliderTrack = (
    <div
      ref={containerRef}
      class="flex-1 flex flex-col cursor-pointer select-none"
      style={{ touchAction: 'none', minWidth: 0 }}
      tabIndex={0}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={maxIdx}
      aria-valuenow={value.value}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
    >
        <div ref={topTicksRef} class="flex justify-between" style={{ alignItems: 'flex-end', pointerEvents: 'none' }}>
          {ticks}
        </div>
        <div class="relative" style={{ height: '12px' }}>
          <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px]" style={{ background: '#333' }} />
          <div ref={fillRef} class="absolute left-0 top-1/2 -translate-y-1/2 h-[3px]" style={{ background: 'rgba(136,136,136,0.3)', width: '0%' }} />
          <div
            ref={thumbRef}
            class="absolute top-1/2 rounded-full"
            style={{
              width: '12px',
              height: '12px',
              background: '#00FF41',
              animation: 'knob-glow 2s ease-in-out infinite',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              left: '0%',
            }}
          />
        </div>
        <div ref={bottomTicksRef} class="flex justify-between" style={{ alignItems: 'flex-start', pointerEvents: 'none' }}>
          {ticks.map((_, i) => {
            const isMajor = i % 10 === 0;
            return (
              <div
                key={i}
                style={{
                  width: '1px',
                  height: isMajor ? '6px' : '3px',
                  background: '#555',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}
              />
            );
          })}
        </div>
      </div>
  );

  return (
    <>
      {playButton}
      {sliderTrack}
    </>
  );
}
