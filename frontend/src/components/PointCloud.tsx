import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { Points } from '@react-three/drei';

interface PointCloudProps {
  filename: string;
}

interface PointData {
  positions: Float32Array;
  colors: Float32Array;
}

const PointCloud: React.FC<PointCloudProps> = ({ filename }) => {
  const [pointData, setPointData] = useState<PointData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(filename);
      const text = await response.text();
      const lines = text.split('\n');

      const data = lines.map((line) => {
        const [id, x, y, z, r, g, b] = line.split(' ').map(Number);
        const point = new THREE.Vector3(x, -y, -z);
        const color = new THREE.Color(`rgb(${r}, ${g}, ${b})`);

        return { point, color };
      });

      const positions = new Float32Array(
        data.flatMap((d) => d.point.toArray())
      );
      const colors = new Float32Array(data.flatMap((d) => d.color.toArray()));

      setPointData({ positions, colors });
    };

    fetchData();
  }, [filename]);

  return (
    <>
      {pointData && (
        <Points positions={pointData.positions} colors={pointData.colors}>
          <pointsMaterial vertexColors size={2} sizeAttenuation={false} />
        </Points>
      )}
    </>
  );
};

export default PointCloud;
