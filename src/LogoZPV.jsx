// src/LogoZPV.jsx
export default function LogoZPV({ size = 28 }) {
  const h = size;
  const w = Math.round(size * 0.9);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, lineHeight: 1 }}>
      <span style={{ fontWeight: 700, color: 'var(--text)' }}>ZooProject</span>

      {/* V turquoise, bras droit plus court */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 90 100"
        aria-label="Vision - V"
        role="img"
        style={{ display: 'inline-block', transform: 'translateY(2px)' }}
      >
        {/* bras gauche */}
        <path
          d="M10 5 L35 5 L53 80 L40 95 Z"
          fill="#20e3d6"
        />
        {/* bras droit (plus court) */}
        <path
          d="M55 5 L80 5 L62 62 L53 80 Z"
          fill="#20e3d6"
        />
      </svg>

      <span style={{ fontWeight: 700, color: 'var(--text)' }}>ision</span>
    </div>
  );
}


