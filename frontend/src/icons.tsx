export function SharpIcon({ name, color = '#00FF41', size = 18 }: { name: 'play' | 'pause'; color?: string; size?: number }) {
  if (name === 'play') {
    return (
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ display: 'block' }}>
        <polygon points="5,3 5,15 15,9" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ display: 'block' }}>
      <rect x="4" y="3" width="3" height="12" fill={color} />
      <rect x="11" y="3" width="3" height="12" fill={color} />
    </svg>
  );
}
