import * as THREE from 'three';

const PyramidOutline = (size = new THREE.Vector3(1, 1, 1)) => {
  // Define the vertices of the pyramid
  const baseCenter = new THREE.Vector3(0, -size.y, 0);
  const baseCorners = [
    new THREE.Vector3(1, -size.y, -1).multiply(
      new THREE.Vector3(size.x, 1, size.z)
    ),
    new THREE.Vector3(1, -size.y, 1).multiply(
      new THREE.Vector3(size.x, 1, size.z)
    ),
    new THREE.Vector3(-1, -size.y, 1).multiply(
      new THREE.Vector3(size.x, 1, size.z)
    ),
    new THREE.Vector3(-1, -size.y, -1).multiply(
      new THREE.Vector3(size.x, 1, size.z)
    ),
  ];
  const apex = new THREE.Vector3(0, 0, 0);

  // Define the lines that form the pyramid outline
  const baseLines = [
    baseCorners[0],
    baseCorners[1],
    baseCorners[1],
    baseCorners[2],
    baseCorners[2],
    baseCorners[3],
    baseCorners[3],
    baseCorners[0],
  ];
  const sideLines = baseCorners.map((corner) => [corner, apex]);

  // Create a material
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Create a BufferGeometry for the base
  const baseGeometry = new THREE.BufferGeometry();
  const baseVertices = new Float32Array([
    baseCorners[0].x,
    baseCorners[0].y,
    baseCorners[0].z,
    baseCorners[1].x,
    baseCorners[1].y,
    baseCorners[1].z,
    baseCorners[2].x,
    baseCorners[2].y,
    baseCorners[2].z,
    baseCorners[0].x,
    baseCorners[0].y,
    baseCorners[0].z,
    baseCorners[2].x,
    baseCorners[2].y,
    baseCorners[2].z,
    baseCorners[3].x,
    baseCorners[3].y,
    baseCorners[3].z,
  ]);
  baseGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(baseVertices, 3)
  );

  // Create a MeshBasicMaterial
  const baseMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff41,
    side: THREE.DoubleSide,
  });
  baseMaterial.transparent = true;
  baseMaterial.opacity = 0.7;

  // Create a Mesh from the geometry and material
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

  // Create a group to hold the line segments
  const group = new THREE.Group();
  group.add(baseMesh);

  // Create the line segments for each line and add them to the group
  [baseLines, ...sideLines].forEach((lineVertices) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(lineVertices);
    const lineSegments = new THREE.LineSegments(geometry, material);
    group.add(lineSegments);
  });

  return group;
};

export default PyramidOutline;
