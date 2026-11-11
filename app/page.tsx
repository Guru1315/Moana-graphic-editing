'use client';

import dynamic from 'next/dynamic';
import Sections from './components/Sections';

const Hero = dynamic(() => import('./components/Hero'), { ssr: false });

export default function Home() {
  return (
    <main style={{ background: '#020e1a' }}>
      <div id="home" style={{ height: '100vh' }}>
        <Hero />
      </div>
      <Sections />
    </main>
  );
}
