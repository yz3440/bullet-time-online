import { useSignal, useComputed } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import { isMobile } from '../hooks';

interface WindowDef {
  key: string;
  title: ComponentChildren;
  width?: number;
  x?: number;
  y?: number;
  anchor?: 'left' | 'right';
  visible?: boolean;
  children: ComponentChildren;
}

const TOP_BAR_HEIGHT = 28;
const MARQUEE_HEIGHT = 24;
const TITLE_BAR_HEIGHT = 29;

import { FloatingWindow } from './FloatingWindow';

export function WindowManager({ windows }: { windows: WindowDef[] }) {
  const openIndex = useSignal<number | null>(null);
  const mobile = isMobile.value;

  const availableHeight = useComputed(() => {
    if (!mobile) return 0;
    return window.innerHeight - TOP_BAR_HEIGHT - MARQUEE_HEIGHT - windows.length * TITLE_BAR_HEIGHT;
  });

  if (mobile) {
    return (
      <div style={{
        position: 'fixed',
        bottom: `${MARQUEE_HEIGHT}px`,
        left: 0,
        right: 0,
        zIndex: 9998,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {windows.map((w, i) => (
          <FloatingWindow
            key={w.key}
            title={w.title}
            mobileOpen={openIndex.value === i}
            onMobileTitleClick={() => {
              openIndex.value = openIndex.value === i ? null : i;
            }}
            mobileMaxHeight={availableHeight.value}
          >
            {w.children}
          </FloatingWindow>
        ))}
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
