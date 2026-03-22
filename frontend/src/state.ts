import { signal } from '@preact/signals';

export const cameraIndex = signal(0);
export const cameraCount = signal(237);
export const followCamera = signal(false);
export const isPlaying = signal(false);
export const neoOnly = signal(false);

export const callbacks = {
  onCameraIndexChange: (_index: number) => {},
  onFollowCameraChange: (_follow: boolean) => {},
  onFlyToRig: () => {},
  onNeoOnlyChange: (_neo: boolean) => {},
};
