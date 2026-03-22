/**
 * Overlay UI: Preact-based overlay with top bar, floating windows, marquee.
 * Provides the same interface to main.ts via signals.
 */

import { render, h } from 'preact';
import { Overlay } from './components/Overlay';
import { cameraIndex, cameraCount, followCamera, isPlaying, neoOnly, callbacks } from './state';

export interface TopBarConfig {
  cameraCount: number;
  initialCameraIndex: number;
  initialFollowCamera: boolean;
  onCameraIndexChange: (index: number) => void;
  onFollowCameraChange: (follow: boolean) => void;
  onResetCamera: () => void;
  onFlyToRig: () => void;
  onNeoOnlyChange: (neo: boolean) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

export interface TopBarHandle {
  setCameraIndex: (index: number) => void;
  setFollowCamera: (active: boolean) => void;
  setPlaying: (state: boolean) => void;
  setNeoOnly: (neo: boolean) => void;
}

export interface FrameViewerHandle {
  setFrameIndex: (index: number) => void;
  setActive: (active: boolean) => void;
  setPlaying: (state: boolean) => void;
}

export function initOverlay(config: TopBarConfig): TopBarHandle & { frameViewer: FrameViewerHandle } {
  cameraCount.value = config.cameraCount;
  cameraIndex.value = config.initialCameraIndex;
  followCamera.value = config.initialFollowCamera;

  callbacks.onCameraIndexChange = config.onCameraIndexChange;
  callbacks.onFollowCameraChange = config.onFollowCameraChange;
  callbacks.onFlyToRig = config.onFlyToRig;
  callbacks.onNeoOnlyChange = config.onNeoOnlyChange;

  const overlayRoot = document.createElement('div');
  overlayRoot.id = 'overlay-root';
  document.getElementById('root')!.appendChild(overlayRoot);

  render(h(Overlay, null), overlayRoot);

  return {
    setCameraIndex(index: number) {
      cameraIndex.value = index;
    },
    setFollowCamera(active: boolean) {
      followCamera.value = active;
    },
    setPlaying(state: boolean) {
      isPlaying.value = state;
    },
    setNeoOnly(neo: boolean) {
      neoOnly.value = neo;
    },
    frameViewer: {
      setFrameIndex(index: number) {
        cameraIndex.value = index;
      },
      setActive(active: boolean) {
        followCamera.value = active;
      },
      setPlaying(state: boolean) {
        isPlaying.value = state;
      },
    },
  };
}
