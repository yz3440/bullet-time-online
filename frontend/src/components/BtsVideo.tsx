export function BtsVideo() {
  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '75%' }}>
      <iframe
        src="https://player.vimeo.com/video/564167222?h=c0583d44ec&dnt=1&app_id=122963"
        title="Bullet Time and The Matrix.mp4"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="autoplay; fullscreen; picture-in-picture"
      />
    </div>
  );
}

export function BtsVideoTitle() {
  return (
    <>
      MATRIX BTS VIDEO{' '}
      <a
        href="https://www.newworlddesigns.co.uk/creating-the-matrix-bullet-time-effect/"
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
