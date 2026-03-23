import { useSignal } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import { isMobile } from '../hooks';
import { neoOnly } from '../state';

interface WindowDef {
  key: string;
  title: ComponentChildren;
  mobileTitle?: ComponentChildren;
  width?: number;
  x?: number;
  y?: number;
  anchor?: 'left' | 'right';
  visible?: boolean;
  children: ComponentChildren;
}

const TOP_BAR_HEIGHT = 28;
const MARQUEE_HEIGHT = 24;
const GRID_ROW_HEIGHT = 29;
const GRID_ROWS = 3;

import { FloatingWindow } from './FloatingWindow';

export function WindowManager({ windows }: { windows: WindowDef[] }) {
  const openIndex = useSignal<number | null>(isMobile.value ? 0 : null);
  const mobile = isMobile.value;

  if (mobile) {
    const gridHeight = GRID_ROWS * GRID_ROW_HEIGHT;
    const fixedChrome = TOP_BAR_HEIGHT + MARQUEE_HEIGHT + gridHeight + 8;
    const maxContentHeight = `calc(100vh - ${fixedChrome}px - env(safe-area-inset-top) - env(safe-area-inset-bottom))`;

    const neo = neoOnly.value;
    const accent = neo ? '#00FF41' : '#00FF41';
    const textColor = neo ? '#000000' : '#00FF41';
    const accentDim = neo ? 'rgba(255,255,255,0.85)' : 'rgba(0,255,65,0.1)';
    const accentGlow = neo ? 'none' : '0 0 8px #00FF41';

    return (
      <div
        style={{
          position: 'fixed',
          bottom: `calc(${MARQUEE_HEIGHT}px + env(safe-area-inset-bottom))`,
          left: 0,
          right: 0,
          zIndex: 9998,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {openIndex.value !== null && (
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              borderTop: `1px solid ${accent}`,
              maxHeight: maxContentHeight,
              overflowY: 'auto',
            }}
          >
            {windows[openIndex.value].children}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          {windows.map((w, i) => {
            const active = openIndex.value === i;
            const spanFull = i === windows.length - 1 && windows.length % 2 === 1;
            return (
              <button
                key={w.key}
                class='font-led'
                style={{
                  height: `${GRID_ROW_HEIGHT}px`,
                  background: active ? accentDim : 'rgba(0,0,0,0.85)',
                  border: `1px solid ${active ? accent : '#333'}`,
                  color: active ? textColor : '#888',
                  textShadow: active ? accentGlow : 'none',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '0 8px',
                  margin: 0,
                  textAlign: 'center',
                  userSelect: 'none',
                  gridColumn: spanFull ? 'span 2' : undefined,
                  transition:
                    'background 0.15s, border-color 0.15s, color 0.15s, text-shadow 0.15s',
                }}
                onClick={() => {
                  openIndex.value = openIndex.value === i ? null : i;
                }}
              >
                {w.mobileTitle ?? w.title}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {windows.map((w) => (
        <FloatingWindow
          key={w.key}
          title={w.title}
          width={w.width}
          x={w.x}
          y={w.y}
          anchor={w.anchor}
          visible={w.visible ?? true}
        >
          {w.children}
        </FloatingWindow>
      ))}
    </>
  );
}
