import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import PyramidOutline from './PyramidOutline';

interface CamerasProps {
  splatCameras: SplatCamera[];
}

export interface SplatCamera {
  position: [number, number, number];
  rotation: number[][];
}
const Cameras: React.FC<CamerasProps> = ({ splatCameras }) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    const fetchCameras = () => {
      // clear existing cameras
      // groupRef.current.children = [];
      // const response = await fetch(url);
      // const data = await response.json();
      // console.log(data);
      splatCameras.forEach((item: any) => {
        const materialB = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          wireframe: true,
        });
        const camera = PyramidOutline(new THREE.Vector3(0.06, 0.06, 0.045));

        // camera.quaternion.set(
        //   ...(item.quaternion as [number, number, number, number])
        // );
        const rotation = item.rotation; // rotation is a 3x3 matrix, 2d array

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
        camera.position.set(...(item.position as [number, number, number]));

        camera.setRotationFromMatrix(paddedRotation);
        // camera.rotate(THREE.MathUtils.degToRad(180));

        groupRef.current.add(camera);
      });
    };

    fetchCameras();
  }, [splatCameras]);

  return <primitive object={groupRef.current} />;
};

export default Cameras;
