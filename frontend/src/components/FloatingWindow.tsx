import { useRef, useCallback } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import { isMobile } from '../hooks';

interface FloatingWindowProps {
  title: ComponentChildren;
  width?: number;
  x?: number;
  y?: number;
  anchor?: 'left' | 'right';
  visible?: boolean;
  children: ComponentChildren;
  mobileOpen?: boolean;
  onMobileTitleClick?: () => void;
  mobileMaxHeight?: number;
}

export function FloatingWindow({
  title,
  width = 400,
  x = 80,
  y = 40,
  anchor = 'left',
  visible = true,
  children,
  mobileOpen,
  onMobileTitleClick,
  mobileMaxHeight,
}: FloatingWindowProps) {
  const mobile = isMobile.value;
  const minimized = useSignal(false);
  const winRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const positionedRef = useRef(false);

  const onTitlePointerDown = useCallback((e: PointerEvent) => {
    if (mobile) return;
    if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const win = winRef.current;
    if (!win) return;
    const rect = win.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!positionedRef.current) {
      win.style.top = `${rect.top}px`;
      win.style.left = `${rect.left}px`;
      win.style.bottom = '';
      win.style.right = '';
      positionedRef.current = true;
    }
  }, [mobile]);

  const onTitlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current || !winRef.current) return;
    winRef.current.style.left = `${e.clientX - dragOffsetRef.current.x}px`;
    winRef.current.style.top = `${e.clientY - dragOffsetRef.current.y}px`;
  }, []);

  const onTitlePointerUp = useCallback((e: PointerEvent) => {
    draggingRef.current = false;
    ((e.currentTarget) as HTMLElement).style.cursor = mobile ? 'default' : 'grab';
  }, [mobile]);

  if (mobile) {
    return (
      <div style={{
        width: '100%',
        background: 'rgba(0,0,0,0.85)',
        borderTop: '1px solid #00FF41',
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            cursor: 'default',
            userSelect: 'none',
            borderBottom: mobileOpen ? '1px solid #00FF4140' : 'none',
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName === 'A') return;
            onMobileTitleClick?.();
          }}
        >
          <span class="font-led" style={{ color: '#00FF41', fontSize: '11px' }}>{title}</span>
        </div>
        {mobileOpen && (
          <div style={{ overflow: 'hidden', maxHeight: mobileMaxHeight ? `${mobileMaxHeight}px` : undefined }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  const posStyle: Record<string, string> = {
    position: 'fixed',
    zIndex: '9998',
    width: `${width}px`,
    bottom: `${y}px`,
    background: 'rgba(0,0,0,0.85)',
    border: '1px solid #00FF41',
    boxShadow: '0 0 12px rgba(0,255,65,0.15)',
    display: visible ? '' : 'none',
    pointerEvents: 'auto',
  };

  if (anchor === 'right') {
    posStyle.right = `${x}px`;
  } else {
    posStyle.left = `${x}px`;
  }

  return (
    <div ref={winRef} style={posStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          cursor: 'grab',
          borderBottom: '1px solid #00FF4140',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
      >
        <span class="font-led" style={{ color: '#00FF41', fontSize: '11px' }}>{title}</span>
        <button
          style={{
            background: 'none',
            border: '1px solid #00FF4160',
            color: '#00FF41',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1',
            padding: '1px 5px',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { minimized.value = !minimized.value; }}
        >
          {minimized.value ? '□' : '_'}
        </button>
      </div>
      {!minimized.value && (
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      )}
    </div>
  );
}
