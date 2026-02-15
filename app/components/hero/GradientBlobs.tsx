'use client';

import { useState, useEffect, useCallback } from 'react';

interface BlobConfig {
  rose: { offsetX: number; offsetY: number; size: number };
  blue: { offsetX: number; offsetY: number; size: number };
}

// Offsets in px from the center point (negative = left/up, positive = right/down)
const presets: BlobConfig[] = [
  { rose: { offsetX: -400, offsetY: -60, size: 900 }, blue: { offsetX: 400, offsetY: 60, size: 900 } },
  { rose: { offsetX: -410, offsetY: -50, size: 880 }, blue: { offsetX: 390, offsetY: 70, size: 880 } },
  { rose: { offsetX: -390, offsetY: -70, size: 920 }, blue: { offsetX: 410, offsetY: 50, size: 920 } },
  { rose: { offsetX: -405, offsetY: -55, size: 890 }, blue: { offsetX: 395, offsetY: 65, size: 890 } },
  { rose: { offsetX: -395, offsetY: -65, size: 910 }, blue: { offsetX: 405, offsetY: 55, size: 910 } },
];

const roseColors = ['#f472b6', '#fb7185', '#f9a8d4'];
const blueColors = ['#7dd3fc', '#93c5fd', '#a5b4fc'];

export const GradientBlobs = () => {
  const pickRandom = useCallback(() => {
    const preset = presets[Math.floor(Math.random() * presets.length)];
    const rose = roseColors[Math.floor(Math.random() * roseColors.length)];
    const blue = blueColors[Math.floor(Math.random() * blueColors.length)];
    return { preset, rose, blue };
  }, []);

  const [config, setConfig] = useState<ReturnType<typeof pickRandom> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setConfig(pickRandom());
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);

    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-color-scheme') === 'dark');
    });
    setIsDark(document.documentElement.getAttribute('data-color-scheme') === 'dark');
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-scheme'] });

    return () => { window.removeEventListener('resize', check); observer.disconnect(); };
  }, [pickRandom]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setConfig(pickRandom());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pickRandom]);

  // Sync colors to CSS variables so SearchBar border can read them
  useEffect(() => {
    if (!config) return;
    document.documentElement.style.setProperty('--blob-rose', config.rose);
    document.documentElement.style.setProperty('--blob-blue', config.blue);
  }, [config]);

  if (!config) return null;

  const { preset, rose: roseColor, blue: blueColor } = config;
  const scale = isMobile ? 0.5 : 1;
  const blobOpacity = isDark ? 0.07 : 0.4;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-start justify-center z-0">
      <div
        style={{
          position: 'relative',
          marginTop: isMobile ? '280px' : '350px',
          width: 0,
          height: 0,
          animation: 'blobsRotate 30s linear infinite',
        }}
      >
        {/* Rose blob */}
        <div
          style={{
            position: 'absolute',
            width: preset.rose.size * 1.3 * scale,
            height: preset.rose.size * 0.85 * scale,
            left: (preset.rose.offsetX - (preset.rose.size * 1.3) / 2) * scale,
            top: (preset.rose.offsetY - (preset.rose.size * 0.85) / 2) * scale,
            backgroundColor: roseColor,
            filter: `blur(${isMobile ? 100 : 150}px)`,
            borderRadius: '50%',
            opacity: blobOpacity,
          }}
        />
        {/* Blue blob */}
        <div
          style={{
            position: 'absolute',
            width: preset.blue.size * 1.3 * scale,
            height: preset.blue.size * 0.85 * scale,
            left: (preset.blue.offsetX - (preset.blue.size * 1.3) / 2) * scale,
            top: (preset.blue.offsetY - (preset.blue.size * 0.85) / 2) * scale,
            backgroundColor: blueColor,
            filter: `blur(${isMobile ? 100 : 150}px)`,
            borderRadius: '50%',
            opacity: blobOpacity,
          }}
        />
      </div>
    </div>
  );
};
