import { useRef, useEffect } from 'preact/hooks';
import { cameraIndex, cameraCount, followCamera, isPlaying, callbacks } from '../state';
import { Slider } from './Slider';

const FRAME_FPS = 24;

export function FrameViewer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = cameraIndex.value / FRAME_FPS;
    }
  }, [cameraIndex.value]);

  return (
    <div>
      <video
        ref={videoRef}
        src="/original-frames.mp4"
        preload="auto"
        muted
        playsInline
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
