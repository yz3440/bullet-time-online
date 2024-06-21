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
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Cameras, { SplatCamera, SplatCameraParsed } from '@/components/Cameras';
import { AxesHelper } from 'three';
import * as THREE from 'three';
import { Physics } from '@react-three/rapier';
import { RAW_CAMERAS, RawCamera } from '@/data/splat-cameras';
import { React360Viewer } from 'react-360-product-viewer';

const CLOUDFRONT_DOMAIN = 'https://d288oh5uq4dxny.cloudfront.net';
const SPLAT_DIR = `${CLOUDFRONT_DOMAIN}/misc`;

enum SplatSource {
  // BULLET_TIME_1 = `bullet-time-1`,
  BULLET_TIME_1 = `5c4ca143-0`,
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

export default function Home() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  const splatCamerasParsed: SplatCameraParsed[] = useMemo(() => {
    return RAW_CAMERAS['5c4ca143-0'].map(parseRawCamera);
  }, []);

  const { cameraAngle } = useControls({
    cameraAngle: {
      value: 0,
      label: 'Camera Angle',
      min: 0,
      max: 237,
      step: 1,
    },
  });

  const showSplats = true;
  const splatSrc = SplatSource.BULLET_TIME_1;
  const cameraUrl = `/cameras/${splatSrc}.json`;

  const projectionMatrix = useMemo(() => {
    const width = 3754;
    const height = 1618;

    const fy = 6606.288093186245;
    const fx = 6606.288093186245;
    const projectionMatrixFlat = getProjectionMatrix(fx, fy, width, height);
    return new THREE.Matrix4().fromArray(projectionMatrixFlat);
  }, []);

  useEffect(() => {
    if (!cameraRef.current) return;
    const splatCameraParsed = splatCamerasParsed[cameraAngle];
    if (!splatCameraParsed) return;
    flyToSplatCamera(cameraRef.current, splatCameraParsed);
  }, [cameraRef, cameraAngle, splatCamerasParsed]);

  const pivotRef = useRef<THREE.Group>(new THREE.Group());
  const splatRef = useRef<THREE.Group>(null);

  const ContentSpan = ({}) => (
    <span className='text-[#00FF41] font-led px-0 text-2xl bg-black'>
      original <span className='text-blue-400 px-1'>bullet time</span> footage
      ripped from (↑) this <span className='text-blue-400 px-1'>blu-ray</span>
      {'  '} disc (↑)<span className='px-4'>/</span>
    </span>
  );

  return (
    <main className='w-full h-screen'>
      <Canvas className='w-full h-screen bg-black' color='black'>
        <group>
          {/* <Axes /> */}
          <Cameras splatCameras={splatCamerasParsed} cameraRef={cameraRef} />
          {/* <Grid /> */}
        </group>
        {/* <ambientLight intensity={0.5} /> */}

        <Suspense fallback={null}>
          {showSplats && (
            // <PivotControls
            //   ref={pivotRef}
            //   onDrag={(e) => {
            //     console.log(e);
            //     console.log(pivotRef.current.position);
            //     console.log(pivotRef.current.rotation);
            //   }}
            // >
            <group ref={splatRef}>
              <Splat
                src={makeSplatUrl(splatSrc)}
                rotation={[0, 0, 0]}
                // alphaHash={alphaHash}
                toneMapped={true}
                alphaTest={0.1}
              />
            </group>
            // </PivotControls>
          )}
        </Suspense>
        {/* <StatsGl /> */}
        {/* <OrbitControls target={new THREE.Vector3(0, 0, 0)} /> */}
        {/* <PresentationControls /> */}
        <PerspectiveCamera
          makeDefault
          position={splatCamerasParsed[0].position}
          ref={cameraRef}
          projectionMatrix={projectionMatrix}
          rotation={splatCamerasParsed[0].rotation}
          near={1}
          far={200}
        />
      </Canvas>

      <div className='fixed bottom-0 left-0 z-10 p-8 md:flex flex-col gap-2 w-36 md:w-auto hidden'>
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
      <div className='fixed bottom-0 right-0 z-10 p-8 md:flex flex-col gap-2 w-36 md:w-auto flex'>
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
    </main>
  );
}

function getProjectionMatrix(
  fx: number,
  fy: number,
  width: number,
  height: number
) {
  const znear = 0.2;
  const zfar = 200;
  return [
    [(2 * fx) / width, 0, 0, 0],
    [0, -(2 * fy) / height, 0, 0],
    [0, 0, zfar / (zfar - znear), 1],
    [0, 0, -(zfar * znear) / (zfar - znear), 0],
  ].flat();
}

function getViewMatrix(camera: SplatCamera) {
  const R = camera.rotation.flat();
  const t = camera.position;
  const camToWorld = [
    [R[0], R[1], R[2], 0],
    [R[3], R[4], R[5], 0],
    [R[6], R[7], R[8], 0],
    [
      -t[0] * R[0] - t[1] * R[3] - t[2] * R[6],
      -t[0] * R[1] - t[1] * R[4] - t[2] * R[7],
      -t[0] * R[2] - t[1] * R[5] - t[2] * R[8],
      1,
    ],
  ].flat();
  return camToWorld;
}

function parseRawCamera(rawCamera: RawCamera): SplatCameraParsed {
  const position = new THREE.Vector3(...rawCamera.position);
  position.x = -position.x;
  position.y = -position.y;
  position.z = -position.z;

  const paddedRotation = new THREE.Matrix4();
  paddedRotation.set(
    rawCamera.rotation[0][0],
    rawCamera.rotation[0][1],
    rawCamera.rotation[0][2],
    0,
    rawCamera.rotation[1][0],
    rawCamera.rotation[1][1],
    rawCamera.rotation[1][2],
    0,
    rawCamera.rotation[2][0],
    rawCamera.rotation[2][1],
    rawCamera.rotation[2][2],
    0,
    0,
    0,
    0,
    1
  );
  const euler = new THREE.Euler();
  euler.setFromRotationMatrix(paddedRotation);

  // euler.x -= Math.PI / 2;

  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(euler);

  return { position, rotation: euler, quaternion };
}

function flyToSplatCamera(
  camera: THREE.PerspectiveCamera,
  splatCamera: SplatCameraParsed
) {
  camera.position.set(
    splatCamera.position.x,
    splatCamera.position.y,
    splatCamera.position.z
  );
  camera.setRotationFromQuaternion(splatCamera.quaternion);
}
