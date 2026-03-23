import { useRef, useEffect } from 'preact/hooks';
import { TopBar } from './TopBar';
import { WindowManager } from './WindowManager';
import { FrameViewer, FrameViewerTitle } from './FrameViewer';
import { BtsVideo, BtsVideoTitle } from './BtsVideo';
import { CameraRig, CameraRigTitle } from './CameraRig';
import { BlurayViewer } from './BlurayViewer';
import { About } from './About';
import { createMarqueeElement } from '../dom-utils';

function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || ref.current.children.length > 0) return;
    ref.current.appendChild(createMarqueeElement());
  }, []);
  return <div ref={ref} />;
}

export function Overlay() {
  const windows = [
    {
      key: 'frame',
      title: <FrameViewerTitle />,
      mobileTitle: 'ORIG. FRAME',
      width: 480, x: 20, y: 40,
      children: <FrameViewer />,
    },
    {
      key: 'bluray',
      title: 'Source Blu-ray',
      mobileTitle: 'BLU-RAY',
      width: 180, x: 20, y: 310,
      children: <BlurayViewer />,
    },
    {
      key: 'bts',
      title: <BtsVideoTitle />,
      mobileTitle: 'BTS VIDEO',
      width: 300, x: 20, y: 40, anchor: 'right' as const,
      children: <BtsVideo />,
    },
    {
      key: 'rig',
      title: <CameraRigTitle />,
      mobileTitle: 'CAMERA RIG',
      width: 260, x: 20, y: 300, anchor: 'right' as const,
      children: <CameraRig />,
    },
    {
      key: 'about',
      title: 'About',
      mobileTitle: 'ABOUT',
      width: 280, x: 340, y: 40, anchor: 'right' as const,
      children: <About />,
    },
  ];

  return (
    <>
      <TopBar />
      <Marquee />
      <WindowManager windows={windows} />
    </>
  );
}
