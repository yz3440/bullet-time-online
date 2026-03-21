import * as pc from 'playcanvas';
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
  position: pc.Vec3;
  quaternion: pc.Quat;
  fov: number;
}

// ---- Leveling rotation (derived from camera 0, assumed level in reality) ----

const cam0Raw = (colmapData as ColmapImage[])[0];

const _cam0_w2c = new pc.Quat(cam0Raw.qx, cam0Raw.qy, cam0Raw.qz, cam0Raw.qw);
const _cam0_c2w = new pc.Quat().invert(_cam0_w2c);
_cam0_c2w.mul(new pc.Quat().setFromAxisAngle(pc.Vec3.RIGHT, 180));

const cam0Up = _cam0_c2w.transformVector(new pc.Vec3(0, 1, 0));
const cam0Fwd = _cam0_c2w.transformVector(new pc.Vec3(0, 0, -1));

const cam0Right = new pc.Vec3().cross(cam0Fwd, cam0Up).normalize();
const cam0Z = new pc.Vec3().cross(cam0Right, cam0Up).normalize();

// Column-major: columns are right, up, z
const levelMatrix = new pc.Mat4();
levelMatrix.set([
  cam0Right.x, cam0Right.y, cam0Right.z, 0,
  cam0Up.x, cam0Up.y, cam0Up.z, 0,
  cam0Z.x, cam0Z.y, cam0Z.z, 0,
  0, 0, 0, 1,
]);
const levelRotation = new pc.Quat().setFromMat4(levelMatrix).invert();

// ---- Parse cameras ----

function parseColmapCamera(raw: ColmapImage): ParsedCamera {
  const position = new pc.Vec3(raw.center[0], raw.center[1], raw.center[2]);

  const q_w2c = new pc.Quat(raw.qx, raw.qy, raw.qz, raw.qw);
  const q_c2w = new pc.Quat().invert(q_w2c);

  // OpenCV→OpenGL flip: 180° around local X
  q_c2w.mul(new pc.Quat().setFromAxisAngle(pc.Vec3.RIGHT, 180));

  // Apply leveling rotation to position and orientation
  const leveledPos = levelRotation.transformVector(position);
  position.copy(leveledPos);

  const leveledQuat = new pc.Quat().mul2(levelRotation, q_c2w);
  q_c2w.copy(leveledQuat);

  // Vertical FOV from OPENCV intrinsics: params = [fx, fy, cx, cy, ...]
  const fy = raw.params[1];
  const fov = 2 * Math.atan(raw.height / (2 * fy)) * (180 / Math.PI);

  return { position, quaternion: q_c2w, fov };
}

const cameras: ParsedCamera[] = (colmapData as ColmapImage[]).map(parseColmapCamera);

const centroid = new pc.Vec3();
for (const cam of cameras) centroid.add(cam.position);
centroid.mulScalar(1 / cameras.length);

// ---- Frustum line geometry (pre-computed, world-space) ----

function buildFrustumLines(cams: ParsedCamera[]): Float32Array {
  const d = 0.08;
  const hw = 0.03;
  const hh = 0.02;

  // 8 line segments per frustum = 16 vertices = 48 floats
  const floatsPerCam = 48;
  const arr = new Float32Array(cams.length * floatsPerCam);

  const localVerts = [
    new pc.Vec3(0, 0, 0), new pc.Vec3(-hw, hh, -d),
    new pc.Vec3(0, 0, 0), new pc.Vec3(hw, hh, -d),
    new pc.Vec3(0, 0, 0), new pc.Vec3(hw, -hh, -d),
    new pc.Vec3(0, 0, 0), new pc.Vec3(-hw, -hh, -d),
    new pc.Vec3(-hw, hh, -d), new pc.Vec3(hw, hh, -d),
    new pc.Vec3(hw, hh, -d), new pc.Vec3(hw, -hh, -d),
    new pc.Vec3(hw, -hh, -d), new pc.Vec3(-hw, -hh, -d),
    new pc.Vec3(-hw, -hh, -d), new pc.Vec3(-hw, hh, -d),
  ];

  const tmp = new pc.Vec3();
  for (let c = 0; c < cams.length; c++) {
    const cam = cams[c];
    const base = c * floatsPerCam;
    for (let v = 0; v < 16; v++) {
      cam.quaternion.transformVector(localVerts[v], tmp);
      tmp.add(cam.position);
      arr[base + v * 3 + 0] = tmp.x;
      arr[base + v * 3 + 1] = tmp.y;
      arr[base + v * 3 + 2] = tmp.z;
    }
  }

  return arr;
}

const frustumPositions = Array.from(buildFrustumLines(cameras));
const frustumColor = new pc.Color(0, 1, 0.255, 0.6);

// ---- PlayCanvas Application ----

const canvas = document.createElement('canvas');
document.getElementById('root')!.appendChild(canvas);

const app = new pc.Application(canvas, {
  graphicsDeviceOptions: { antialias: false },
});
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.start();
window.addEventListener('resize', () => app.resizeCanvas());

// Import camera-controls script class (must happen after Application is created)
const { CameraControls } = await import('playcanvas/scripts/esm/camera-controls.mjs');

// ---- Load assets ----

const splatAsset = new pc.Asset('splat', 'gsplat', { url: '/splats/bullet-time.sog' });
const loader = new pc.AssetListLoader([splatAsset], app.assets);
await new Promise<void>((resolve) => loader.load(resolve));

// ---- Camera ----

const cameraEntity = new pc.Entity('Camera');
cameraEntity.addComponent('camera', {
  clearColor: new pc.Color(0, 0, 0, 1),
  nearClip: 0.1,
  farClip: 500,
  fov: 60,
});
cameraEntity.addComponent('script');
cameraEntity.script!.create(CameraControls as any);
cameraEntity.setPosition(centroid.x + 5, centroid.y + 5, centroid.z + 5);
app.root.addChild(cameraEntity);

const cameraControls = (cameraEntity.script as any)?.cameraControls;
if (cameraControls) {
  cameraControls.focusPoint = centroid.clone();
}

// ---- Splat ----

const splatEntity = new pc.Entity('Splat');
splatEntity.addComponent('gsplat', { asset: splatAsset });
(splatEntity.gsplat as any).material?.setDefine('GSPLAT_AA', true);
(splatEntity.gsplat as any).highQualitySH = true;

// Apply leveling rotation to the splat
const levelEuler = new pc.Vec3();
levelRotation.getEulerAngles(levelEuler);
splatEntity.setLocalEulerAngles(levelEuler.x, levelEuler.y, levelEuler.z);

app.root.addChild(splatEntity);

// ---- State ----

const params = {
  showCones: true,
  cameraIndex: 0,
  followCamera: false,
};

function applyCameraFollow() {
  if (params.followCamera) {
    const cam = cameras[params.cameraIndex];
    if (cameraControls) {
      cameraControls.enableOrbit = false;
      cameraControls.enableFly = false;
      cameraControls.enablePan = false;
    }
    cameraEntity.setPosition(cam.position.x, cam.position.y, cam.position.z);
    cameraEntity.setLocalRotation(cam.quaternion.x, cam.quaternion.y, cam.quaternion.z, cam.quaternion.w);
    (cameraEntity.camera as any).fov = cam.fov;
  } else {
    if (cameraControls) {
      cameraControls.enableOrbit = true;
      cameraControls.enableFly = true;
      cameraControls.enablePan = true;
    }
  }
}

// ---- Render loop: draw frustum lines ----

app.on('update', () => {
  if (params.showCones) {
    app.drawLineArrays(frustumPositions, frustumColor, false);
  }

  if (params.followCamera) {
    applyCameraFollow();
  }
});

// ---- Overlay UI ----

initOverlay({
  cameraCount: cameras.length,
  initialCameraIndex: params.cameraIndex,
  initialShowCones: params.showCones,
  initialFollowCamera: params.followCamera,
  onCameraIndexChange(index) {
    params.cameraIndex = index;
    applyCameraFollow();
  },
  onShowConesChange(show) {
    params.showCones = show;
  },
  onFollowCameraChange(follow) {
    params.followCamera = follow;
    applyCameraFollow();
  },
});
