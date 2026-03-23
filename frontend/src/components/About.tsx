const linkStyle = {
  color: '#00FF41',
  textDecoration: 'none',
};

export function About() {
  return (
    <div class="font-led" style={{ padding: '10px 12px', fontSize: '11px', color: '#ccc', lineHeight: '1.6' }}>
      <p style={{ margin: '0 0 8px' }}>
        A Gaussian splat reconstruction of 237 frames of the bullet time sequence from{' '}
        <em>The Matrix</em> (1999) — a roundtrip from CGI to celluloid and back to CGI.
      </p>
      <p style={{ margin: '0 0 4px' }}>
        <a href="https://yufengzhao.com/projects/bullet-time-online" target="_blank" style={linkStyle}>
          Full writeup ↗
        </a>
      </p>
      <p style={{ margin: 0 }}>
        Made by{' '}
        <a href="https://yufengzhao.com" target="_blank" style={linkStyle}>
          Yufeng Zhao
        </a>
      </p>
    </div>
  );
}
