import React, { useState, useEffect, useCallback } from 'react';
import { colors, radius } from '../../utils/theme';

interface StoriesViewerProps {
  images: string[];
  title?: string;
  onClose: () => void;
}

export const StoriesViewer: React.FC<StoriesViewerProps> = ({ images, title, onClose }) => {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0)), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  if (images.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '16px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {title && (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{title}</div>
          )}
          {images.length > 1 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {current + 1} / {images.length}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
            borderRadius: radius.md, padding: '6px 12px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Progress dots */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute', top: 64, left: 0, right: 0,
            display: 'flex', gap: 4, justifyContent: 'center', padding: '0 24px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                height: 3, flex: 1, maxWidth: 80, borderRadius: 99, cursor: 'pointer',
                background: i === current ? '#FF6B2B' : 'rgba(255,255,255,0.25)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Image */}
      <div
        style={{ maxWidth: '90vw', maxHeight: '80vh', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[current]}
          alt={`Slide ${current + 1}`}
          style={{
            maxWidth: '90vw', maxHeight: '80vh',
            borderRadius: radius.lg,
            objectFit: 'contain',
            display: 'block',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '';
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Prev / Next arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
              borderRadius: '50%', width: 44, height: 44, cursor: 'pointer',
              fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
              borderRadius: '50%', width: 44, height: 44, cursor: 'pointer',
              fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            ›
          </button>
        </>
      )}

      {/* Thumbnails strip for multi-image */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute', bottom: 24, left: 0, right: 0,
            display: 'flex', gap: 8, justifyContent: 'center', padding: '0 24px',
            overflowX: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 52, height: 52, borderRadius: radius.md, overflow: 'hidden',
                cursor: 'pointer', flexShrink: 0,
                border: i === current ? '2px solid #FF6B2B' : '2px solid rgba(255,255,255,0.2)',
                transition: 'border-color 0.15s',
              }}
            >
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Parse a potentially comma-separated imageUrl string into an array */
export function parseImageUrls(imageUrl: string): string[] {
  return imageUrl
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
