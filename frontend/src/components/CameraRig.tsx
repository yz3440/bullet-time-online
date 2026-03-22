import { callbacks } from '../state';

export function CameraRig() {
  return (
    <div>
      <img src="/Bulletime.webp" style={{ width: '100%', display: 'block' }} />
      <button
        class="font-led"
        style={{
          display: 'block',
          width: '100%',
          padding: '6px',
          background: 'none',
          border: '1px solid #00FF41',
          color: '#00FF41',
          fontSize: '11px',
          cursor: 'pointer',
          textShadow: '0 0 8px #00FF41',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,65,0.1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
        onClick={() => callbacks.onFlyToRig()}
      >
        FLY TO RIG
      </button>
    </div>
  );
}

export function CameraRigTitle() {
  return (
    <>
      MATRIX CAMERA RIG{' '}
      <a
        href="https://beforesandafters.com/2021/07/15/vfx-artifacts-the-bullet-time-rig-from-the-matrix/"
        target="_blank"
        style="color:#aaa;font-size:10px;text-decoration:none"
        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
        onClick={(e) => e.stopPropagation()}
      >
        (Source)
      </a>
    </>
  );
}
