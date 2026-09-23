import { useState, useEffect, useRef } from 'react';

// Module-level cache so we only fetch once across all component instances
let _playerImages = null;
let _loadingPromise = null;

function loadPlayerImages() {
  if (_playerImages) return Promise.resolve(_playerImages);
  if (_loadingPromise) return _loadingPromise;
  _loadingPromise = fetch('/data/player-images.json')
    .then(r => r.ok ? r.json() : {})
    .then(d => { _playerImages = d; return d; })
    .catch(() => { _playerImages = {}; return {}; });
  return _loadingPromise;
}

const POS_COLORS = {
  QB: '#e53935', RB: '#1976d2', WR: '#388e3c', TE: '#f57c00',
  K: '#7b1fa2', DEF: '#455a64',
};

export default function PlayerAvatar({ name, position, size = 32 }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!name || position === 'DEF') return;

    loadPlayerImages().then(map => {
      if (!mounted.current) return;
      const entry = map[name];
      if (entry?.img) setImgSrc(entry.img);
    });

    return () => { mounted.current = false; };
  }, [name, position]);

  const color = POS_COLORS[position] || '#555';
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.34,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.02em',
    border: '0.5px solid rgba(255,255,255,0.15)',
  };

  if (imgSrc && !imgError) {
    return (
      <div style={containerStyle}>
        <img
          src={imgSrc}
          alt={name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>
    );
  }

  // Fallback: colored circle with initials
  return (
    <div style={containerStyle}>
      {position === 'DEF' ? '🛡' : initials}
    </div>
  );
}
