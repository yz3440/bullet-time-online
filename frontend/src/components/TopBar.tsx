import {
  cameraIndex,
  cameraCount,
  followCamera,
  isPlaying,
  callbacks,
} from '../state';
import { Slider } from './Slider';

function BistableSwitch() {
  const active = followCamera.value;

  return (
    <div
      class='flex items-center gap-1.5 cursor-pointer select-none shrink-0'
      onClick={() => {
        followCamera.value = !followCamera.value;
        callbacks.onFollowCameraChange(followCamera.value);
      }}
    >
      <span
        class='font-led text-[10px] leading-none'
        style={{ color: active ? '#555' : '#888' }}
      >
        FREE
      </span>
      <div
        style={{
          width: '28px',
          height: '14px',
          position: 'relative',
          border: `1px solid ${active ? '#00FF41' : '#555'}`,
          background: active ? 'rgba(0,255,65,0.1)' : 'transparent',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '1px',
            width: '12px',
            height: '10px',
            left: active ? '13px' : '1px',
            background: active ? '#00FF41' : '#666',
            boxShadow: active ? '0 0 6px #00ff4180' : 'none',
            transition: 'left 0.15s, background 0.15s, box-shadow 0.15s',
          }}
        />
      </div>
      <span
        class='font-led text-[10px] leading-none'
        style={{ color: active ? '#00FF41' : '#555' }}
      >
        LOCK
      </span>
    </div>
  );
}

export function TopBar() {
  const count = cameraCount.value;

  return (
    <div
      class='fixed top-0 left-0 right-0 flex items-center gap-3 px-1 py-px overflow-hidden bg-black/70 backdrop-blur-sm'
      style={{ zIndex: 9999, pointerEvents: 'auto', paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
    >
      <Slider
        count={count}
        value={cameraIndex}
        active={followCamera}
        playing={isPlaying}
        onChange={(idx) => {
          callbacks.onCameraIndexChange(idx);
        }}
        onPlayChange={(p) => {
          isPlaying.value = p;
        }}
      />
      <span class='font-led text-[#00FF41] text-xs tabular-nums whitespace-nowrap shrink-0'>
        <span style={{ display: 'inline-block', width: '3ch', textAlign: 'right' }}>{cameraIndex.value + 1}</span>/{count}
      </span>
      <BistableSwitch />
    </div>
  );
}
