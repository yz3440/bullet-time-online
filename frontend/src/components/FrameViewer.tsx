import { useRef, useEffect } from 'preact/hooks';
import { cameraIndex, cameraCount, followCamera, isPlaying, callbacks } from '../state';
import { Slider } from './Slider';

const TOTAL_FRAMES = 237;

/** Pad number to 3 digits: 0 → "000", 42 → "042" */
function frameSrc(idx: number) {
  return `/frames/${String(idx).padStart(3, '0')}.webp`;
}

/** Preload all frames into memory so scrubbing is instant. */
const preloaded: HTMLImageElement[] = [];
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const img = new Image();
  img.src = frameSrc(i);
  preloaded.push(img);
}

export function FrameViewer() {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.src = frameSrc(cameraIndex.value);
    }
  }, [cameraIndex.value]);

  return (
    <div>
      <img
        ref={imgRef}
        src={frameSrc(0)}
        alt="Original frame"
        style={{ width: '100%', display: 'block' }}
      />
      <div style={{ padding: '0 8px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Slider
          count={cameraCount.value}
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
      </div>
    </div>
  );
}

export function FrameViewerTitle() {
  return <>ORIGINAL FRAME <span style="color:#aaa;font-size:10px">(ripped from the Blu-ray)</span></>;
}
