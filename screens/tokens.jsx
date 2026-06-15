// Shared design tokens for DePaso redesign
const TOKENS = {
  // Surfaces
  bg:        '#F4EFE3',   // warm cream
  bgDeep:    '#EDE6D2',   // deeper cream for contrast bands
  card:      '#FFFFFF',
  cardSoft:  '#FBF7EC',
  border:    '#E6DFC9',
  borderSoft:'#EFE9D6',
  // Forest brand
  forest:    '#0B3B2E',   // deep forest
  forestDeep:'#062319',
  emerald:   '#10B981',   // primary brand
  emeraldDeep:'#0E8F66',
  mint:      '#D5F2E3',
  lime:      '#C7E66B',   // eco accent
  // Text
  ink:       '#13201B',
  inkSoft:   '#4A584F',
  inkMute:   '#7A8780',
  inkFaint:  '#A8B0A6',
  // Status / categories
  amber:     '#E89E2A',
  amberBg:   '#FAEEC9',
  red:       '#D75A4E',
  redBg:     '#F8D9D2',
  violet:    '#7C6AE0',
  violetBg:  '#E5DFFA',
  sky:       '#3A8FD1',
  // Radii
  rXs: 8, rS: 12, rM: 18, rL: 24, rXL: 32,
};

const FONTS = {
  display: '"Bricolage Grotesque", "Inter", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

window.TOKENS = TOKENS;
window.FONTS = FONTS;

// ─────────────────────────────────────────────────────────
// Reusable mark components — used in icons, splash, headers
// ─────────────────────────────────────────────────────────

// The DePaso "Waypoint" mark: two dots connected by a curved path
function MarkWaypoint({ size = 64, color = '#F4EFE3', stroke = 5 }) {
  const s = size;
  const vb = 64;
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
      {/* Curved route arc origin→destination */}
      <path
        d="M 14 46 Q 14 18 32 18 Q 50 18 50 36"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
      />
      {/* Origin dot (small, hollow ring) */}
      <circle cx="14" cy="46" r="4.5" fill={color} />
      {/* Destination dot (large, solid pin head) */}
      <circle cx="50" cy="36" r="8.5" fill={color} />
      <circle cx="50" cy="36" r="3" fill={TOKENS.forest} />
    </svg>
  );
}

// Monogram "dp" lowercase with a route-dot descender on the p
function MarkMonogram({ size = 64, color = '#F4EFE3', bg = '#0B3B2E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <text
        x="6" y="46"
        fill={color}
        style={{
          fontFamily: '"Bricolage Grotesque", system-ui',
          fontWeight: 800,
          fontSize: '42px',
          letterSpacing: '-3px',
        }}
      >de</text>
      <circle cx="55" cy="20" r="4" fill={color} />
    </svg>
  );
}

// Stacked-pin: origin chip + destination chip with route dot between
function MarkRoute({ size = 64, color = '#F4EFE3' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* origin (ring) */}
      <circle cx="18" cy="18" r="6" stroke={color} strokeWidth="3" fill="none" />
      {/* dotted path */}
      <circle cx="28" cy="28" r="1.8" fill={color} opacity="0.55" />
      <circle cx="34" cy="34" r="1.8" fill={color} opacity="0.7" />
      <circle cx="40" cy="40" r="1.8" fill={color} opacity="0.85" />
      {/* destination (filled square pin, rotated) */}
      <rect x="42" y="42" width="14" height="14" rx="3" fill={color} transform="rotate(45 49 49)" />
    </svg>
  );
}

window.MarkWaypoint = MarkWaypoint;
window.MarkMonogram = MarkMonogram;
window.MarkRoute = MarkRoute;

// Tiny icons (we draw a few key ones since MaterialCommunityIcons aren't here)
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2 }) {
  const s = size;
  const sw = strokeWidth;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'arrow-right':
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-left':
      return <svg {...common}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'leaf':
      return <svg {...common}><path d="M20 4c0 9-7 16-16 16 0-9 7-16 16-16Z"/><path d="M4 20c4-6 8-10 14-14"/></svg>;
    case 'bolt':
      return <svg {...common}><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7Z"/></svg>;
    case 'truck':
      return <svg {...common}><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
    case 'box':
      return <svg {...common}><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>;
    case 'store':
      return <svg {...common}><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></svg>;
    case 'home':
      return <svg {...common}><path d="M3 11l9-7 9 7v9h-6v-6h-6v6H3z"/></svg>;
    case 'list':
      return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/></svg>;
    case 'user':
      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 5-6 8-6s7 2 8 6"/></svg>;
    case 'pin':
      return <svg {...common}><path d="M12 2c4 0 7 3 7 7 0 5-7 13-7 13s-7-8-7-13c0-4 3-7 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'pin-dot':
      return <svg {...common}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill={color}/></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'check':
      return <svg {...common}><path d="M4 12l5 5 11-12"/></svg>;
    case 'star':
      return <svg {...common}><path d="M12 3l2.6 5.6 6.1.7-4.6 4.2 1.3 6-5.4-3-5.4 3 1.3-6-4.6-4.2 6.1-.7L12 3z"/></svg>;
    case 'sparkle':
      return <svg {...common}><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/></svg>;
    case 'shield':
      return <svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>;
    case 'chevron-right':
      return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-down':
      return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'camera':
      return <svg {...common}><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'scan':
      return <svg {...common}><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4M7 12h10"/></svg>;
    case 'co2':
      return <svg {...common}><path d="M9 7a5 5 0 1 0 0 10"/><circle cx="17" cy="12" r="4"/></svg>;
    case 'route':
      return <svg {...common}><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8v4a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4"/></svg>;
    case 'wallet':
      return <svg {...common}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M17 15h2"/></svg>;
    case 'history':
      return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v5l3 2"/></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

window.Icon = Icon;
