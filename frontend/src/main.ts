import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pane } from 'tweakpane';
import colmapData from '@/data/postshot-colmap.json';
import './index.css';
import { initOverlay } from './overlay';

interface ColmapImage {
  id: number;
  name: string;
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  center: number[];
  width: number;
  height: number;
  params: number[];
}

interface ParsedCamera {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  fov: number;
}

// ---- Leveling rotation (derived from camera 0, assumed level in reality) ----

const cam0Raw = (colmapData as ColmapImage[])[0];
// Camera 0 c2w orientation in Three.js (OpenGL) convention
const _cam0_w2c = new THREE.Quaternion(cam0Raw.qx, cam0Raw.qy, cam0Raw.qz, cam0Raw.qw);
const _cam0_c2w = _cam0_w2c.clone().invert();
_cam0_c2w.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI));

// Extract camera 0's up vector and forward vector in the un-leveled world
const cam0Up = new THREE.Vector3(0, 1, 0).applyQuaternion(_cam0_c2w);
const cam0Fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_cam0_c2w);

// Build a right-handed orthonormal basis from camera 0's up and forward
const cam0Right = new THREE.Vector3().crossVectors(cam0Fwd, cam0Up).normalize();
// Z = cross(X, Y) for right-handed system
const cam0Z = new THREE.Vector3().crossVectors(cam0Right, cam0Up).normalize();

// This matrix maps level-world axes to COLMAP-world axes; invert to go the other way
const levelMatrix = new THREE.Matrix4().makeBasis(cam0Right, cam0Up, cam0Z);
const levelRotation = new THREE.Quaternion().setFromRotationMatrix(levelMatrix).invert();

// ---- Parse cameras ----

function parseColmapCamera(raw: ColmapImage): ParsedCamera {
  const position = new THREE.Vector3(raw.center[0], raw.center[1], raw.center[2]);

  // COLMAP quaternion (qw, qx, qy, qz) → world-to-camera in OpenCV convention
  const q_w2c = new THREE.Quaternion(raw.qx, raw.qy, raw.qz, raw.qw);
  const q_c2w = q_w2c.clone().invert();

  // OpenCV→OpenGL flip: 180° around local X
  const flipX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  q_c2w.multiply(flipX);

  // Apply leveling rotation to position and orientation
  position.applyQuaternion(levelRotation);
  q_c2w.premultiply(levelRotation);

  // Vertical FOV from OPENCV intrinsics: params = [fx, fy, cx, cy, ...]
  const fy = raw.params[1];
  const fov = 2 * Math.atan(raw.height / (2 * fy)) * (180 / Math.PI);

  return { position, quaternion: q_c2w, fov };
}

const cameras: ParsedCamera[] = (colmapData as ColmapImage[]).map(parseColmapCamera);

// Centroid of all cameras
const centroid = new THREE.Vector3();
for (const cam of cameras) centroid.add(cam.position);
centroid.divideScalar(cameras.length);

// ---- Scene setup ----

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('root')!.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(centroid.x + 5, centroid.y + 5, centroid.z + 5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(centroid);
controls.update();

// Axes
scene.add(new THREE.AxesHelper(1));

// ---- Camera frustum cones ----

function createCameraFrustums(cams: ParsedCamera[], coneScale: number): THREE.Group {
  const group = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.03 * coneScale, 0.08 * coneScale, 4);
  coneGeo.rotateX(Math.PI / 2);

  cams.forEach((cam, i) => {
    const color = new THREE.Color().setHSL(i / cams.length, 1, 0.5);
    const mat = new THREE.MeshBasicMaterial({ color });
    const cone = new THREE.Mesh(coneGeo, mat);
    cone.position.copy(cam.position);
    cone.quaternion.copy(cam.quaternion);
    group.add(cone);
  });

  return group;
}

let frustumGroup = createCameraFrustums(cameras, 1);
scene.add(frustumGroup);

// ---- Gaussian splat viewer ----

const viewer = new GaussianSplats3D.Viewer({
  threeScene: scene,
  renderer,
  camera,
  selfDrivenMode: false,
  useBuiltInControls: false,
});

viewer
  .addSplatScene('/splats/bullet-time.ply', {
    showLoadingUI: true,
    rotation: [levelRotation.x, levelRotation.y, levelRotation.z, levelRotation.w],
  })
  .then(() => {
    viewer.start();
  });

// ---- Tweakpane ----

const params = {
  showSplat: true,
  coneScale: 1,
  showCones: true,
  cameraIndex: 0,
  followCamera: false,
};

const pane = new Pane();
pane.addBinding(params, 'showCones', { label: 'Show Cones' }).on('change', (ev) => {
  frustumGroup.visible = ev.value;
});
pane
  .addBinding(params, 'coneScale', { label: 'Cone Scale', min: 0.1, max: 20, step: 0.1 })
  .on('change', (ev) => {
    scene.remove(frustumGroup);
    frustumGroup = createCameraFrustums(cameras, ev.value);
    frustumGroup.visible = params.showCones;
    scene.add(frustumGroup);
  });

pane.addBinding(params, 'followCamera', { label: 'Follow Camera' }).on('change', (ev) => {
  controls.enabled = !ev.value;
  if (ev.value) {
    const cam = cameras[params.cameraIndex];
    camera.position.copy(cam.position);
    camera.quaternion.copy(cam.quaternion);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
  }
});

pane
  .addBinding(params, 'cameraIndex', {
    label: 'Camera',
    min: 0,
    max: cameras.length - 1,
    step: 1,
  })
  .on('change', (ev) => {
    if (params.followCamera) {
      const cam = cameras[ev.value];
      camera.position.copy(cam.position);
      camera.quaternion.copy(cam.quaternion);
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
  });

// ---- Render loop ----

function animate() {
  requestAnimationFrame(animate);
  if (!params.followCamera) {
    controls.update();
  }
  viewer.update();
  viewer.render();
}

animate();

// ---- Resize ----

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Overlay UI ----

initOverlay();
