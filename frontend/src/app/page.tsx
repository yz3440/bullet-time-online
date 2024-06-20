'use client';

import {
  AsciiRenderer,
  CameraControls,
  DragControls,
  Grid,
  OrbitControls,
  PerspectiveCamera,
  PivotControls,
  PresentationControls,
  Sky,
  Splat,
  Stars,
  StatsGl,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Cameras, { SplatCamera } from '@/components/Cameras';
import { AxesHelper } from 'three';
import * as THREE from 'three';
import { Physics } from '@react-three/rapier';

import { React360Viewer } from 'react-360-product-viewer';

const CLOUDFRONT_DOMAIN = 'https://d288oh5uq4dxny.cloudfront.net';
const SPLAT_DIR = `${CLOUDFRONT_DOMAIN}/misc`;

enum SplatSource {
  BULLET_TIME_1 = `bullet-time-1`,
}

const Axes = () => {
  const axesHelper = new AxesHelper(0.4);
  axesHelper.setColors(
    new THREE.Color(0xff0000),
    new THREE.Color(0x00ff00),
    new THREE.Color(0x0000ff)
  );

  return <primitive object={axesHelper} />;
};

function makeSplatUrl(splatSrc: string) {
  return `${SPLAT_DIR}/${splatSrc}.splat`;
}

const initialSplatRotation = new THREE.Matrix4().set(
  0.324154200436926,
  -0.6214364747634248,
  -0.7132606551413755,
  0,
  -0.4419210978360894,
  0.5671740739088494,
  -0.6949959087455009,
  0,
  0.8364387590412357,
  0.5404907748696975,
  -0.09077403072636481,
  0,
  -2.1948624371368837,
  0.3743881263714215,
  0.39147497625583894,
  1
);

export default function Home() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [splatCameras, setSplatCameras] = useState<SplatCamera[]>([]);

  const { showCameras, alphaHash, alphaTest, cameraAngle } = useControls({
    // splatSrc: {
    //   value: SplatSource.BULLET_TIME_1,
    //   label: 'Splat Source',
    //   options: [SplatSource.BULLET_TIME_1],
    // },
    // showSplats: {
    //   value: true,
    //   label: 'Show Splats',
    // },
    showCameras: {
      value: true,
      label: 'Show Cameras',
    },
    alphaHash: {
      value: false,
      label: 'Alpha Hash',
    },
    alphaTest: {
      value: 0.1,
      label: 'Alpha Test',
      min: 0,
      max: 1,
      step: 0.01,
    },
    cameraAngle: {
      value: 0,
      label: 'Camera Angle',
      min: 0,
      max: 200,
      step: 1,
    },
  });

  const showSplats = true;
  const splatSrc = SplatSource.BULLET_TIME_1;

  const cameraUrl = `/cameras/${splatSrc}.json`;

  useEffect(() => {
    const fetchCameras = async () => {
      const response = await fetch(cameraUrl);
      const data = (await response.json()) as SplatCamera[];
      setSplatCameras(data);
    };

    fetchCameras();
  }, [splatSrc]);

  useEffect(() => {
    if (!cameraRef.current) return;

    if (cameraAngle >= 0 && cameraAngle < splatCameras.length) {
      const camera = splatCameras[cameraAngle];

      const rotation = camera.rotation; // rotation is a 3x3 matrix, 2d array
      const paddedRotation = new THREE.Matrix4();
      paddedRotation.set(
        rotation[0][0],
        rotation[0][1],
        rotation[0][2],
        0,
        rotation[1][0],
        rotation[1][1],
        rotation[1][2],
        0,
        rotation[2][0],
        rotation[2][1],
        rotation[2][2],
        0,
        0,
        0,
        0,
        1
      );

      // cameraRef.current.setRotationFromMatrix(paddedRotation);
      cameraRef.current.position.set(
        camera.position[0],
        camera.position[1],
        camera.position[2]
      );
      // rotate X by 90 degrees
      // cameraRef.current.rotateX(THREE.MathUtils.degToRad(90));
      // rotate Y by 90 degrees
      // cameraRef.current.rotateY(THREE.MathUtils.degToRad(180));
    }
  }, [cameraRef, cameraAngle]);

  const pivotRef = useRef<THREE.Group>(new THREE.Group());
  const splatRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!splatRef.current) return;

    splatRef.current.setRotationFromMatrix(initialSplatRotation);
  }, [splatRef]);

  const ContentSpan = ({}) => (
    <span className='text-[#00FF41] font-led px-0 text-2xl bg-black'>
      original <span className='text-blue-400 px-1'>bullet time</span> footage
      ripped from (↑) this <span className='text-blue-400 px-1'>blu-ray</span>
      {'  '} disc (↑)<span className='px-4'>/</span>
    </span>
  );

  return (
    <main className='w-full h-screen'>
      <div className='fixed bottom-0 left-0 z-10 p-8 flex flex-col gap-2'>
        <div className='mx-auto hover:scale-[200%] hover:-translate-y-1/2 hover:translate-x-1/2 transition-all'>
          <React360Viewer
            imageFilenamePrefix=''
            imagesBaseUrl='./bluray-box/'
            imagesCount={54}
            imagesFiletype='webp'
            mouseDragSpeed={20}
            reverse
            notifyOnPointerDown={function noRefCheck() {}}
            notifyOnPointerMoved={function noRefCheck() {}}
            notifyOnPointerUp={function noRefCheck() {}}
            autoplay
          />
        </div>
      </div>
      <div className='fixed bottom-0 right-0 z-10 p-8 flex flex-col gap-2'>
        <div className='mx-auto hover:scale-[200%] hover:-translate-y-1/2 hover:-translate-x-1/2 transition-all'>
          <React360Viewer
            imageFilenamePrefix=''
            imagesBaseUrl='./bluray-box/'
            imagesCount={54}
            imagesFiletype='webp'
            mouseDragSpeed={20}
            reverse
            notifyOnPointerDown={function noRefCheck() {}}
            notifyOnPointerMoved={function noRefCheck() {}}
            notifyOnPointerUp={function noRefCheck() {}}
            autoplay
          />
        </div>
      </div>

      <div className='absolute bottom-0 z-20 w-screen font-led shadow-xl shadow-neutral-800'>
        <div className='relative flex flex-row overflow-x-hidden'>
          <div className='animate-marquee whitespace-nowrap bg-black text-white'>
            <ContentSpan />
            <ContentSpan />

            <span className='hidden 3xl:inline'>
              <ContentSpan />
              <ContentSpan />
            </span>
          </div>
          <div className='absolute top-0 z-10 animate-marquee2 whitespace-nowrap bg-black text-white'>
            <ContentSpan />
            <ContentSpan />
            <span className='hidden 3xl:inline'>
              <ContentSpan />
              <ContentSpan />
            </span>
          </div>
        </div>
      </div>

      <Canvas className='w-full h-screen' color='red'>
        {showCameras && (
          <group>
            <Axes />
            <Cameras splatCameras={splatCameras} />
            <Grid />
          </group>
        )}
        {/* <ambientLight intensity={0.5} /> */}

        <Suspense fallback={null}>
          {showSplats && (
            <PivotControls
              ref={pivotRef}
              onDrag={(e) => {
                console.log(e);
                console.log(pivotRef.current.position);
                console.log(pivotRef.current.rotation);
              }}
            >
              <group ref={splatRef}>
                <Splat
                  src={makeSplatUrl(splatSrc)}
                  rotation={[0, 0, 0]}
                  alphaHash={alphaHash}
                  alphaTest={alphaTest}
                />
              </group>
            </PivotControls>
          )}
        </Suspense>
        {/* <StatsGl /> */}
        {/* <OrbitControls /> */}
        {/* <PresentationControls /> */}
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 5]}
          ref={cameraRef}
          fov={45}
        />
      </Canvas>
    </main>
  );
}
