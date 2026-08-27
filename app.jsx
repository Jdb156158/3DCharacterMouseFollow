const { useState, useEffect, useRef, useCallback } = React;

/* ─────────────────────────────────────────────
   useTypewriter hook
   ───────────────────────────────────────────── */
function useTypewriter(text, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        indexRef.current += 1;
        if (indexRef.current >= text.length) {
          setDisplayed(text);
          setDone(true);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        } else {
          setDisplayed(text.slice(0, indexRef.current));
        }
      }, speed);
    }, startDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

/* ─────────────────────────────────────────────
   BackgroundVideo — mouse scrub controlled
   ───────────────────────────────────────────── */
const SENSITIVITY = 0.8;

function BackgroundVideo() {
  const videoRef = useRef(null);
  const targetTimeRef = useRef(0);
  const prevXRef = useRef(null);
  const seekingRef = useRef(false);

  const trySeek = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (seekingRef.current) return;

    const clamped = Math.max(0, Math.min(video.duration, targetTimeRef.current));
    // Only seek if there's meaningful distance
    if (Math.abs(video.currentTime - clamped) < 0.01) return;

    seekingRef.current = true;
    video.currentTime = clamped;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      targetTimeRef.current = 0;
      video.currentTime = 0;
    };

    const handleSeeked = () => {
      seekingRef.current = false;
      // If target moved while seeking, seek again
      trySeek();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);

    const handleMouseMove = (e) => {
      if (!video || !video.duration) return;
      const currentX = e.clientX;

      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const timeDelta = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      targetTimeRef.current = Math.max(
        0,
        Math.min(video.duration, targetTimeRef.current + timeDelta)
      );

      trySeek();
    };

    // Also handle touch for mobile — horizontal drag scrubs
    let touchPrevX = null;
    const handleTouchStart = (e) => {
      if (e.touches[0]) touchPrevX = e.touches[0].clientX;
    };
    const handleTouchMove = (e) => {
      if (!video || !video.duration || !e.touches[0]) return;
      if (touchPrevX === null) {
        touchPrevX = e.touches[0].clientX;
        return;
      }
      const currentX = e.touches[0].clientX;
      const delta = currentX - touchPrevX;
      touchPrevX = currentX;
      const timeDelta = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      targetTimeRef.current = Math.max(
        0,
        Math.min(video.duration, targetTimeRef.current + timeDelta)
      );
      trySeek();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [trySeek]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: '70% center',
        pointerEvents: 'none',
      }}
    >
      <source
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4"
        type="video/mp4"
      />
    </video>
  );
}

/* ─────────────────────────────────────────────
   CopyIcon — two overlapping rectangles
   ───────────────────────────────────────────── */
function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <rect x="1" y="1" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────── */
const NAV_LINKS = ['点赞', '收藏', '分享', '不迷路'];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-10 flex flex-row justify-between items-center px-5 sm:px-8 py-4 sm:py-5"
      >
        {/* Logo */}
        <div className="flex flex-row items-center gap-3 select-none">
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(16px, 2.4vw, 26px)',
              letterSpacing: '-0.02em',
              color: '#fff',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}
          >
            记得关注贾大兵哦
          </span>
          <span
            style={{
              fontSize: 'clamp(25px, 3vw, 30px)',
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            ✳︎
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex flex-row items-center">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="nav-link hover:opacity-60 transition-opacity"
              style={{
                fontSize: '23px',
                color: '#fff',
                lineHeight: 1.2,
              }}
              onClick={(e) => e.preventDefault()}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <a
            href="#contact"
            className="hover:opacity-60 transition-opacity"
            style={{
              fontSize: '23px',
              color: '#fff',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              lineHeight: 1.2,
            }}
          >
            联系我们
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden flex flex-col items-center justify-center w-8 h-8 ${mobileOpen ? 'ham-open' : ''}`}
          onClick={toggleMobile}
          aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={mobileOpen}
        >
          <span className="ham-bar w-6 h-[2px] bg-white block" />
          <span className="ham-bar w-6 h-[2px] bg-white block mt-[5px]" />
          <span className="ham-bar w-6 h-[2px] bg-white block mt-[5px]" />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay md:hidden fixed inset-0 flex flex-col justify-center px-8 ${mobileOpen ? 'is-open' : ''}`}
        style={{
          zIndex: 9,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          gap: '2rem',
        }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              closeMobile();
            }}
            style={{
              fontSize: '32px',
              color: '#fff',
              fontWeight: 500,
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.2,
            }}
          >
            {link}
          </a>
        ))}
        <a
          href="#contact"
          onClick={closeMobile}
          style={{
            fontSize: '32px',
            color: '#fff',
            fontWeight: 500,
            fontFamily: 'var(--font-heading)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            lineHeight: 1.2,
          }}
        >
          Get in touch
        </a>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────── */
const PILL_LABELS = [
  '聊聊你的想法',
  '加入我们',
  '打个招呼',
  '了解我们的方式',
];

function Hero() {
  const typeText =
    "很高兴你来。品味相投的人，总会相遇。说说看，我们一起做点什么？";
  const { displayed, done } = useTypewriter(typeText, 38, 600);

  const [pillsVisible, setPillsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('IT民工贾大兵.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      // fallback
      setCopied(false);
    }
  };

  const pillBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    fontSize: 'clamp(13px, 1.8vw, 15px)',
    paddingTop: '0.3em',
    paddingBottom: '0.3em',
    paddingLeft: 'clamp(16px, 2vw, 20px)',
    paddingRight: 'clamp(16px, 2vw, 20px)',
    marginLeft: '0.2em',
    marginRight: '0.2em',
    marginBottom: '0.4em',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(0,0,0,0.10)',
    background: '#fff',
    color: '#000',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
    textDecoration: 'none',
  };

  const pillHoverStyle = {
    background: '#000',
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.2)',
  };

  const outlinePillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    fontSize: 'clamp(13px, 1.8vw, 15px)',
    paddingTop: '0.3em',
    paddingBottom: '0.3em',
    paddingLeft: 'clamp(16px, 2vw, 20px)',
    paddingRight: 'clamp(16px, 2vw, 20px)',
    marginLeft: '0.2em',
    marginRight: '0.2em',
    marginBottom: '0.4em',
    whiteSpace: 'nowrap',
    border: '1px solid #fff',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    gap: 'clamp(8px, 1vw, 12px)',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    textDecoration: 'none',
  };

  const outlineHoverStyle = {
    background: '#fff',
    color: '#000',
  };

  return (
    <section
      className="w-full h-screen flex flex-col overflow-hidden relative"
      style={{
        zIndex: 1,
        paddingLeft: 'clamp(20px, 4vw, 40px)',
        paddingRight: 'clamp(20px, 4vw, 40px)',
        justifyContent: 'flex-end',
        paddingBottom: '3rem',
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .hero-section-inner {
            justify-content: center !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>

      {/* Slight dark gradient at bottom for readability on mobile */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.25) 100%)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div
        className="relative hero-section-inner"
        style={{
          zIndex: 10,
          maxWidth: '42rem',
          width: '100%',
        }}
      >
        {/* Blurred intro label */}
        <div
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            marginBottom: 'clamp(20px, 3vw, 24px)',
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.3,
            fontWeight: 400,
            color: '#fff',
            filter: 'blur(4px)',
            WebkitFilter: 'blur(4px)',
          }}
        >
          你好，认识一下 A.R.I.A
          <br />
          Mainframe 自适应响应接口代理
        </div>

        {/* Typewriter text */}
        <p
          style={{
            color: '#fff',
            marginBottom: 'clamp(20px, 3vw, 24px)',
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.35,
            fontWeight: 400,
            minHeight: '54px',
          }}
        >
          {displayed}
          {!done && <span className="type-cursor" aria-hidden="true" />}
        </p>

        {/* Action pills */}
        <div
          className={`pill-enter flex flex-wrap ${pillsVisible ? 'is-visible' : ''}`}
          style={{ gap: '0.4em 0', alignContent: 'flex-start' }}
        >
          {PILL_LABELS.map((label) => (
            <PillButton key={label} label={label} />
          ))}

          {/* Outline copy email pill */}
          <button
            type="button"
            onClick={handleCopyEmail}
            style={outlinePillStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, outlineHoverStyle)}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = outlinePillStyle.background;
              e.currentTarget.style.color = outlinePillStyle.color;
            }}
            aria-label="复制邮箱到剪贴板"
          >
            <span>
              联系邮箱：{' '}
              <span style={{ textDecoration: 'underline', textUnderlineOffset: '1px' }}>
                {copied ? '已复制！' : 'IT民工贾大兵.com'}
              </span>
            </span>
            <CopyIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

function PillButton({ label }) {
  const [hover, setHover] = useState(false);
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    fontSize: 'clamp(13px, 1.8vw, 15px)',
    paddingTop: '0.3em',
    paddingBottom: '0.3em',
    paddingLeft: 'clamp(16px, 2vw, 20px)',
    paddingRight: 'clamp(16px, 2vw, 20px)',
    marginLeft: '0.2em',
    marginRight: '0.2em',
    marginBottom: '0.4em',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(0,0,0,0.10)',
    background: hover ? '#000' : '#fff',
    color: hover ? '#fff' : '#000',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
    textDecoration: 'none',
    fontFamily: 'var(--font-body)',
  };

  return (
    <a
      href="#"
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => e.preventDefault()}
    >
      {label}
    </a>
  );
}

/* ─────────────────────────────────────────────
   App
   ───────────────────────────────────────────── */
function App() {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <BackgroundVideo />
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
