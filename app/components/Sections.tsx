'use client';

import { useEffect, useRef, useState } from 'react';

const TEAL = 'rgba(0,212,170,0.85)';

const JOURNEY = [
  { n: '01', title: 'The Call', text: 'On the island of Motunui, a chief’s daughter feels the sea pulling at her long before she understands why.' },
  { n: '02', title: 'Beyond the Reef', text: 'When the island’s harvests fail, Moana takes a canoe past the reef her people have never crossed.' },
  { n: '03', title: 'The Demigod', text: 'She finds Maui, a boastful shapeshifter with a magical fishhook, and talks him into setting things right.' },
  { n: '04', title: 'The Heart Restored', text: 'Together they sail to return the heart of Te Fiti, and Moana learns who she is along the way.' },
];

const GALLERY = [1, 37, 73, 109, 145, 181];

const CHARACTERS = [
  { name: 'Moana', role: 'Wayfinder', text: 'Daughter of the chief of Motunui, stubborn, brave and chosen by the ocean.' },
  { name: 'Maui', role: 'Demigod', text: 'Shapeshifter of the wind and sea whose tattoos tell his own legend.' },
  { name: 'Gramma Tala', role: 'Storyteller', text: 'Moana’s grandmother, keeper of the old stories and her first believer.' },
  { name: 'Chief Tui', role: 'Father', text: 'Leader of Motunui, determined to keep his people safe inside the reef.' },
  { name: 'Heihei', role: 'Stowaway', text: 'A rooster with no sense of danger who ends up on the voyage anyway.' },
  { name: 'Pua', role: 'Companion', text: 'Moana’s loyal pig, happiest on dry land.' },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll('.reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add('in');
        io.unobserve(el);
        // Drop the stagger delay once revealed so hover transitions respond immediately
        setTimeout(() => { el.style.transitionDelay = '0ms'; }, 1400);
      });
    }, { threshold: 0.15 });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Heading({ kicker, title, intro }: { kicker: string; title: string; intro: string }) {
  return (
    <header className="reveal" style={{ marginBottom: 'clamp(2rem, 5vh, 3.5rem)', maxWidth: '640px' }}>
      <p style={{
        fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.4em',
        textTransform: 'uppercase', color: TEAL, marginBottom: '0.9rem',
      }}>{kicker}</p>
      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
        fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
        lineHeight: 1, marginBottom: '1rem',
        textShadow: '0 0 50px rgba(0,212,170,0.3)',
      }}>{title}</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>{intro}</p>
    </header>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: 'clamp(5rem, 12vh, 8rem) clamp(1.5rem, 6vw, 5rem)',
  maxWidth: '1280px', margin: '0 auto', scrollMarginTop: '2rem',
};

export default function Sections() {
  const ref = useReveal();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const src = (f: number) => `/moana/ezgif-frame-${String(f).padStart(3, '0')}.jpg`;

  return (
    <div ref={ref} style={{ background: 'linear-gradient(180deg, #020e1a 0%, #04192b 50%, #020e1a 100%)' }}>

      {/* ── JOURNEY ── */}
      <section id="journey" style={sectionStyle}>
        <Heading kicker="The Voyage" title="Journey"
          intro="From the shore of Motunui to the heart of Te Fiti, in four chapters." />
        <ol style={{
          listStyle: 'none', display: 'grid', gap: '1.25rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        }}>
          {JOURNEY.map((s, i) => (
            <li key={s.n} className="reveal" style={{
              transitionDelay: `${i * 90}ms`,
              borderTop: '1px solid rgba(0,212,170,0.35)', paddingTop: '1.4rem',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: TEAL }}>{s.n}</span>
              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: '1.35rem', fontWeight: 700,
                letterSpacing: '0.03em', margin: '0.7rem 0 0.6rem',
              }}>{s.title}</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" style={sectionStyle}>
        <Heading kicker="Stills" title="Gallery"
          intro="Moments from the shoreline. Select a still to see it larger." />
        <div style={{
          display: 'grid', gap: '0.9rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}>
          {GALLERY.map((f, i) => (
            <button key={f} className="reveal gallery-tile" onClick={() => setOpen(f)}
              aria-label={`Open still ${i + 1} of ${GALLERY.length}`}
              style={{
                transitionDelay: `${i * 70}ms`,
                display: 'block', padding: 0, border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', overflow: 'hidden', cursor: 'zoom-in',
                background: '#04192b', aspectRatio: '16 / 10',
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(f)} alt={`Moana on the shore, still ${i + 1}`} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      </section>

      {/* ── CHARACTERS ── */}
      <section id="characters" style={sectionStyle}>
        <Heading kicker="The Crew" title="Characters"
          intro="The people, demigods and animals who share the voyage." />
        <div style={{
          display: 'grid', gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}>
          {CHARACTERS.map((c, i) => (
            <article key={c.name} className="reveal character-card" style={{
              transitionDelay: `${i * 70}ms`,
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
              background: 'rgba(255,255,255,0.025)', padding: '1.5rem',
            }}>
              <div aria-hidden style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '1px solid rgba(0,212,170,0.5)', color: TEAL,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 700,
                marginBottom: '1.1rem',
              }}>{c.name[0]}</div>
              <p style={{
                fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.3em',
                textTransform: 'uppercase', color: TEAL, marginBottom: '0.4rem',
              }}>{c.role}</p>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.55rem' }}>{c.name}</h3>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.55)' }}>{c.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '2rem clamp(1.5rem, 6vw, 5rem)', textAlign: 'center',
        fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.25em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
      }}>
        The ocean is calling
      </footer>

      {/* ── LIGHTBOX ── */}
      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label="Enlarged still" onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50, cursor: 'zoom-out',
            background: 'rgba(2,14,26,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4vmin',
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(open)} alt="Moana on the shore, enlarged still"
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '14px', boxShadow: '0 30px 90px rgba(0,0,0,0.7)' }} />
          <button autoFocus onClick={() => setOpen(null)} aria-label="Close" style={{
            position: 'absolute', top: '1.2rem', right: '1.4rem',
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(2,14,26,0.6)',
            color: '#fff', fontSize: '1rem', cursor: 'pointer',
          }}>✕</button>
        </div>
      )}
    </div>
  );
}
