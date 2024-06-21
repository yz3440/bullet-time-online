import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import PyramidOutline from './PyramidOutline';

interface CamerasProps {
  splatCameras: SplatCameraParsed[];
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}

export interface SplatCamera {
  position: [number, number, number];
  rotation: number[][];
}

export interface SplatCameraParsed {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  quaternion: THREE.Quaternion;
}

const Cameras: React.FC<CamerasProps> = ({
  splatCameras: splatCamerasParsed,
  cameraRef,
}) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    const fetchCameras = () => {
      splatCamerasParsed.forEach((splatCamera, i) => {
        const cameraPyramid = PyramidOutline(
          new THREE.Vector3(0.06, 0.06, 0.045)
        );

        cameraPyramid.position.set(
          splatCamera.position.x,
          splatCamera.position.y,
          splatCamera.position.z
        );
        cameraPyramid.rotation.setFromQuaternion(splatCamera.quaternion);
        cameraPyramid.rotateX(THREE.MathUtils.degToRad(90));

        groupRef.current.add(cameraPyramid);
      });
    };

    fetchCameras();
  }, [splatCamerasParsed]);

  return <primitive object={groupRef.current} />;
};

export default Cameras;
