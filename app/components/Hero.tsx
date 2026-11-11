'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const FRAME_COUNT = 181;
const FOLDER      = 'moana';
const MIDDLE      = Math.round((FRAME_COUNT - 1) / 2);

const NAV = ['Home', 'Journey', 'Gallery', 'Characters'];

// No official accounts are linked: each opens the platform's public Moana tag or search page
const SOCIAL = [
  { s: 'IG', name: 'Instagram', href: 'https://www.instagram.com/explore/tags/moana/' },
  { s: 'TW', name: 'X',         href: 'https://x.com/hashtag/moana' },
  { s: 'YT', name: 'YouTube',   href: 'https://www.youtube.com/results?search_query=moana+trailer' },
  { s: 'FB', name: 'Facebook',  href: 'https://www.facebook.com/hashtag/moana' },
];

// Official trailer on the Walt Disney Animation Studios YouTube channel, embedded (not re-hosted)
const TRAILER_ID = 'LKFuXETZUsI';

const goTo = (label: string) =>
  document.getElementById(label.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const images     = useRef<(HTMLImageElement | null)[]>([]);
  const frameRef   = useRef(MIDDLE);
  const navRef     = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen && !trailerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setTrailerOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, trailerOpen]);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      draw(frameRef.current);
    };
    resize();
    window.addEventListener('resize', resize);

    // Function declaration (hoisted): resize() above calls draw() before this line runs
    function loaded(i: number) {
      const img = images.current[i];
      return !!img && img.complete && img.naturalWidth > 0;
    }

    // Draw frame i, or the closest frame that has finished loading
    function draw(i: number) {
      let pick = -1;
      for (let d = 0; d < FRAME_COUNT && pick < 0; d++) {
        if (i - d >= 0 && loaded(i - d)) pick = i - d;
        else if (i + d < FRAME_COUNT && loaded(i + d)) pick = i + d;
      }
      if (pick < 0) return;
      const img = images.current[pick]!;
      const { naturalWidth: iw, naturalHeight: ih } = img;
      const cw = canvas!.width, ch = canvas!.height;
      const s  = Math.max(cw / iw, ch / ih);
      ctx!.clearRect(0, 0, cw, ch);
      ctx!.drawImage(img, (cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s);
    }

    // Load the middle frame first, then work outwards, a few at a time, so the hero
    // appears straight away instead of waiting behind 181 parallel requests.
    // Phones and slow or data-saving connections fetch every second frame; draw()
    // falls back to the nearest loaded neighbour for the ones that are skipped.
    images.current = new Array(FRAME_COUNT).fill(null);
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const lite =
      !!conn?.saveData || /(^|-)[23]g$/.test(conn?.effectiveType ?? '') ||
      (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 768);
    const queue = Array.from({ length: FRAME_COUNT }, (_, i) => i)
      .filter(i => !lite || (i - MIDDLE) % 2 === 0)
      .sort((x, y) => Math.abs(x - MIDDLE) - Math.abs(y - MIDDLE));
    let cancelled = false;
    const loadNext = () => {
      const i = queue.shift();
      if (cancelled || i === undefined) return;
      const img = new Image();
      img.onload = () => {
        images.current[i] = img;
        if (cancelled) return;
        draw(frameRef.current); // a closer frame may now be available
        loadNext();
      };
      img.onerror = loadNext;
      img.src = `/${FOLDER}/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
    };
    loadNext();                                   // middle frame on its own first
    for (let n = 0; n < 5; n++) setTimeout(loadNext, 0); // then six in parallel

    // Window-level listener so nav/overlay elements never block events
    const onMove = (e: MouseEvent) => {
      if (!section) return;
      const r = section.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const idx   = Math.round(ratio * (FRAME_COUNT - 1));
      if (idx !== frameRef.current) { frameRef.current = idx; draw(idx); }
    };
    window.addEventListener('mousemove', onMove);

    // Touch: a horizontal drag across the hero scrubs the frames, relative to where the
    // drag started. Vertical drags are left alone so the page still scrolls.
    let touch: { x: number; y: number; frame: number; scrub: boolean | null } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!section || e.touches.length !== 1) { touch = null; return; }
      const r = section.getBoundingClientRect();
      if (t.clientY < r.top || t.clientY > r.bottom) { touch = null; return; }
      touch = { x: t.clientX, y: t.clientY, frame: frameRef.current, scrub: null };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch || !section) return;
      const t  = e.touches[0];
      const dx = t.clientX - touch.x, dy = t.clientY - touch.y;
      if (touch.scrub === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        touch.scrub = Math.abs(dx) > Math.abs(dy);
      }
      if (!touch.scrub) return;
      // One swipe across the full width covers the whole sequence
      const step = (dx / section.clientWidth) * (FRAME_COUNT - 1);
      const idx  = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(touch.frame + step)));
      if (idx !== frameRef.current) { frameRef.current = idx; draw(idx); }
    };
    const onTouchEnd = () => { touch = null; };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    // Highlight the nav item for whichever section crosses the middle of the viewport
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = NAV.findIndex(l => l.toLowerCase() === e.target.id);
        if (i >= 0) setActive(i);
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    NAV.forEach(l => { const el = document.getElementById(l.toLowerCase()); if (el) io.observe(el); });

    // Entrance animations
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(navRef.current,     { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' })
      .fromTo(contentRef.current, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 1.0,  ease: 'power3.out' }, '-=0.45')
      .fromTo(bottomRef.current,  { opacity: 0, y: 18  }, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, '-=0.55');

    return () => {
      cancelled = true;
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      io.disconnect();
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} style={{
      position: 'relative', height: '100vh', width: '100%',
      overflow: 'hidden', background: '#020e1a',
      touchAction: 'pan-y',
    }}>

      {/* Full-viewport head-tracking canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Thin left-edge + top/bottom gradient — animation fully visible */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'linear-gradient(to right, rgba(2,14,26,0.78) 0%, rgba(2,14,26,0.35) 18%, transparent 36%)',
          'linear-gradient(180deg, rgba(2,14,26,0.6) 0%, transparent 14%, transparent 80%, rgba(2,14,26,0.85) 100%)',
        ].join(', '),
      }} />

      {/* Shown only on touch devices (see globals.css) */}
      <p className="touch-hint" aria-hidden style={{
        position: 'absolute', left: 0, right: 0, textAlign: 'center',
        bottom: 'calc(clamp(50px, 7.5vh, 66px) + 0.9rem)', zIndex: 4, pointerEvents: 'none',
        fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.3em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
        textShadow: '0 1px 8px rgba(0,0,0,0.8)',
      }}>← Drag to turn →</p>

      {/* ── NAV ── */}
      <div ref={navRef} style={{
        position: 'fixed', top: 0, left: 0, right: 0, opacity: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(2,14,26,0.8) 0%, rgba(2,14,26,0) 100%)',
        padding: 'clamp(1rem, 2.5vh, 1.6rem) clamp(1.2rem, 4vw, 2.8rem)',
        zIndex: 20,
      }}>
        {/* Logo */}
        <span style={{
          fontFamily: 'Georgia, serif', fontSize: '0.85rem',
          fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#fff', textShadow: '0 0 22px rgba(0,212,170,0.7)',
        }}>
          MOANA
        </span>

        {/* Nav pill */}
        <div style={{
          display: 'flex', gap: '0.1rem',
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '40px', padding: '0.16rem 0.2rem',
        }}>
          {NAV.map((label, i) => (
            <button key={label} onClick={() => goTo(label)} aria-current={i === active ? 'page' : undefined} style={{
              fontFamily: 'monospace', fontSize: '0.42rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              padding: '0.24rem 0.65rem', borderRadius: '30px', border: 'none',
              cursor: 'pointer',
              background: i === active ? 'rgba(255,255,255,0.88)' : 'transparent',
              color: i === active ? '#020e1a' : 'rgba(255,255,255,0.52)',
              fontWeight: i === active ? 700 : 400, transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { if (i !== active) (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { if (i !== active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.52)'; }}
            >{label}</button>
          ))}
        </div>

        {/* Menu */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button onClick={() => setMenuOpen(true)} aria-haspopup="dialog" aria-expanded={menuOpen} style={{
            fontFamily: 'monospace', fontSize: '0.42rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', padding: '0.28rem 0.75rem', borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(2,14,26,0.5)', backdropFilter: 'blur(12px)',
            color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
          }}>Menu</button>
          <button onClick={() => goTo('Home')} aria-label="Back to top" title="Back to top" style={{
            width: '24px', height: '24px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(2,14,26,0.5)', backdropFilter: 'blur(12px)',
            color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>↑</button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div ref={contentRef} style={{
        position: 'absolute', top: '50%', transform: 'translateY(-52%)',
        left: 'clamp(1.5rem, 5vw, 4rem)',
        maxWidth: 'clamp(220px, 32vw, 400px)',
        zIndex: 5, opacity: 0,
      }}>
        <p style={{
          fontFamily: 'monospace', fontSize: '0.44rem',
          letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'rgba(0,212,170,0.8)', marginBottom: '0.6rem',
          textShadow: '0 0 14px rgba(0,212,170,0.4)',
        }}>Disney Original</p>

        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(3rem, 7vw, 7rem)',
          fontWeight: 900, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#ffffff',
          lineHeight: 0.9, margin: '0 0 clamp(0.7rem, 1.8vh, 1.2rem)',
          textShadow: '0 0 60px rgba(0,212,170,0.5), 0 4px 28px rgba(0,0,0,0.95)',
        }}>
          MOANA
        </h1>

        <p style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(0.58rem, 0.85vw, 0.72rem)',
          fontWeight: 300, lineHeight: 1.65,
          color: 'rgba(255,255,255,0.45)',
          marginBottom: 'clamp(1rem, 2.5vh, 1.8rem)',
        }}>
          The ocean is calling. A fearless chief&apos;s daughter sails across the open sea to save her people.
        </p>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={() => goTo('Journey')} style={{
            fontFamily: 'monospace', fontSize: '0.44rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '0.55rem 1.1rem', borderRadius: '30px', border: 'none',
            background: 'rgba(0,212,170,0.9)', color: '#020e1a',
            fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 24px rgba(0,212,170,0.45)',
            transition: 'background 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(0,240,195,1)'; b.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(0,212,170,0.9)'; b.style.transform = 'translateY(0)'; }}
          >Sail the Ocean ··</button>

          <button onClick={() => setTrailerOpen(true)} aria-haspopup="dialog" style={{
            fontFamily: 'monospace', fontSize: '0.44rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '0.55rem 1rem', borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.5)'; b.style.color = '#fff'; b.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.2)'; b.style.color = 'rgba(255,255,255,0.65)'; b.style.transform = 'translateY(0)'; }}
          >▶ Watch Trailer</button>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div ref={bottomRef} style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0,
        display: 'flex', alignItems: 'center',
        height: 'clamp(50px, 7.5vh, 66px)',
        background: 'rgba(2,14,26,0.72)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '0 clamp(1.2rem, 4vw, 2.8rem)',
        zIndex: 6,
      }}>
        {/* Play */}
        <div role="button" tabIndex={0} aria-haspopup="dialog" onClick={() => setTrailerOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTrailerOpen(true); } }}
          style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          paddingRight: 'clamp(1rem, 2.5vw, 2rem)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0, cursor: 'pointer',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.55rem',
          }}>▶</div>
          <span style={{ fontFamily: 'monospace', fontSize: '0.44rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
            Play Trailer
          </span>
        </div>

        {[
          { n: '01', text: 'Chosen by the ocean itself — Moana of Motunui sets sail beyond the reef to restore the heart of Te Fiti.' },
          { n: '02', text: 'Disney Animation. 2016. Winner of the Golden Globe for Best Animated Feature Film.' },
        ].map((item, i) => (
          <div key={item.n} style={{
            display: 'flex', alignItems: 'center', gap: '0.65rem',
            padding: '0 clamp(1rem, 2.5vw, 2rem)',
            borderRight: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            flex: 1, minWidth: 0,
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(0,212,170,0.7)', flexShrink: 0, fontWeight: 700 }}>{item.n}</span>
            <p style={{
              fontFamily: 'Georgia, serif', fontSize: 'clamp(0.48rem, 0.68vw, 0.58rem)',
              color: 'rgba(255,255,255,0.33)', lineHeight: 1.4, margin: 0,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>{item.text}</p>
          </div>
        ))}

        {/* Social */}
        <div style={{
          display: 'flex', gap: '0.45rem', alignItems: 'center',
          paddingLeft: 'clamp(1rem, 2.5vw, 2rem)',
          borderLeft: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
        }}>
          {SOCIAL.map(({ s, name, href }) => (
            <a key={s} href={href} target="_blank" rel="noopener noreferrer"
              aria-label={`Moana on ${name} (opens in a new tab)`} title={name} style={{
              textDecoration: 'none',
              width: '26px', height: '26px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              fontFamily: 'monospace', fontSize: '0.38rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(0,212,170,0.6)'; b.style.color = 'rgba(0,212,170,0.9)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(255,255,255,0.12)'; b.style.color = 'rgba(255,255,255,0.4)'; }}
            >{s}</a>
          ))}
        </div>
      </div>

      {/* ── TRAILER ── */}
      {trailerOpen && (
        <div role="dialog" aria-modal="true" aria-label="Moana official trailer" onClick={() => setTrailerOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(2,14,26,0.94)', backdropFilter: 'blur(18px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '1rem',
          padding: 'clamp(3.6rem, 9vh, 5rem) clamp(1rem, 4vw, 3rem) clamp(1rem, 4vh, 3rem)',
        }}>
          <button autoFocus onClick={() => setTrailerOpen(false)} aria-label="Close trailer" style={{
            position: 'absolute', top: '1rem', right: '1.2rem',
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.25)', background: 'transparent',
            color: '#fff', fontSize: '1rem', cursor: 'pointer',
          }}>✕</button>
          <div onClick={e => e.stopPropagation()} style={{
            width: 'min(100%, calc((100vh - 12rem) * 16 / 9))', aspectRatio: '16 / 9',
            borderRadius: '14px', overflow: 'hidden', background: '#000',
            boxShadow: '0 30px 90px rgba(0,0,0,0.7)',
          }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${TRAILER_ID}?autoplay=1&rel=0`}
              title="Moana Official Trailer (Walt Disney Animation Studios)"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            />
          </div>
          {/* Fallback in case the embedded player is blocked or fails to load */}
          <a href={`https://www.youtube.com/watch?v=${TRAILER_ID}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} style={{
              fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)',
              textDecoration: 'underline', textUnderlineOffset: '4px',
            }}>Watch on YouTube ↗</a>
        </div>
      )}

      {/* ── MENU OVERLAY ── */}
      {menuOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menu" onClick={() => setMenuOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(2,14,26,0.94)', backdropFilter: 'blur(18px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 'clamp(1rem, 3vh, 1.8rem)',
        }}>
          <button autoFocus onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{
            position: 'absolute', top: '1.2rem', right: '1.4rem',
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.25)', background: 'transparent',
            color: '#fff', fontSize: '1rem', cursor: 'pointer',
          }}>✕</button>
          {NAV.map((label, i) => (
            <button key={label} onClick={() => { setMenuOpen(false); goTo(label); }} style={{
              fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
              fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
              background: 'none', border: 'none', cursor: 'pointer',
              color: i === active ? 'rgba(0,212,170,0.95)' : 'rgba(255,255,255,0.75)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = i === active ? 'rgba(0,212,170,0.95)' : 'rgba(255,255,255,0.75)'; }}
            >{label}</button>
          ))}
        </div>
      )}
    </section>
  );
}
