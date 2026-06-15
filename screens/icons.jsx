// Icon options + splash screen for DePaso
// Renders 3 app-icon variants and 2 splash variants

function IconTile({ size = 200, bg, children, label, sublabel, radius = 46 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: bg,
        boxShadow: '0 18px 40px -16px rgba(11,59,46,0.55), 0 2px 0 rgba(255,255,255,0.18) inset',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {children}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.5, color: TOKENS.inkSoft, textTransform: 'uppercase' }}>{label}</div>
        {sublabel && <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.inkMute, marginTop: 4 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// Icon A — Waypoint mark (route arc + two dots), forest gradient, paper texture
function IconWaypoint({ size = 200 }) {
  const s = size;
  return (
    <div style={{ width: s, height: s, borderRadius: s * 0.23, position: 'relative', overflow: 'hidden',
      background: `radial-gradient(120% 100% at 20% 0%, #145E47 0%, #0B3B2E 55%, #062319 100%)` }}>
      {/* Subtle topographic curves */}
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
        <path d="M -10 150 Q 40 110 100 130 T 220 110" stroke="rgba(255,255,255,0.05)" strokeWidth="20" fill="none"/>
        <path d="M -10 175 Q 40 135 100 155 T 220 135" stroke="rgba(255,255,255,0.04)" strokeWidth="20" fill="none"/>
      </svg>
      {/* Mark */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 64 64" fill="none">
          {/* Route arc */}
          <path
            d="M 14 50 Q 14 18 36 18 Q 52 18 52 34"
            stroke="#F4EFE3"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Origin small ring */}
          <circle cx="14" cy="50" r="5.5" fill="#F4EFE3" />
          <circle cx="14" cy="50" r="2.2" fill="#0B3B2E" />
          {/* Destination big pin */}
          <circle cx="52" cy="34" r="10" fill="#A3E635" />
          <circle cx="52" cy="34" r="3.6" fill="#0B3B2E" />
        </svg>
      </div>
    </div>
  );
}

// Icon B — "depaso" wordmark stacked, cream + forest · LOGO OFICIAL
function IconMonogram({ size = 200 }) {
  const s = size;
  return (
    <div style={{
      width: s, height: s, borderRadius: s * 0.23,
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(160deg, #F4EFE3 0%, #E8DEC2 100%)`,
    }}>
      {/* Lime leaf-shape blob top-right */}
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <circle cx="178" cy="28" r="62" fill="#C7E66B" opacity="0.65"/>
        <path d="M -10 175 Q 60 140 130 158 T 250 138" stroke="rgba(11,59,46,0.06)" strokeWidth={s * 0.05} fill="none"/>
        <path d="M -10 200 Q 60 165 130 183 T 250 163" stroke="rgba(11,59,46,0.05)" strokeWidth={s * 0.05} fill="none"/>
      </svg>

      {/* Wordmark: stacked "de" / "paso" */}
      <div style={{
        position: 'absolute',
        left: s * 0.13, top: s * 0.16,
        right: s * 0.13, bottom: s * 0.16,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
        color: '#0B3B2E',
      }}>
        <div style={{
          fontWeight: 800, fontSize: s * 0.38,
          letterSpacing: -s * 0.028, lineHeight: 0.85,
          fontStyle: 'italic',
        }}>
          de
        </div>
        <div style={{
          fontWeight: 800, fontSize: s * 0.38,
          letterSpacing: -s * 0.028, lineHeight: 0.85,
          marginTop: s * 0.04,
          display: 'flex', alignItems: 'baseline',
        }}>
          paso
          <span style={{
            display: 'inline-block',
            width: s * 0.07, height: s * 0.07, borderRadius: s * 0.07,
            background: '#0E8F66',
            marginLeft: s * 0.025,
            marginBottom: s * 0.03,
          }}/>
        </div>
      </div>
    </div>
  );
}

// Icon C — Lime/forest split, package-as-step
function IconStep({ size = 200 }) {
  const s = size;
  return (
    <div style={{ width: s, height: s, borderRadius: s * 0.23, position: 'relative', overflow: 'hidden',
      background: '#0B3B2E' }}>
      {/* Lime diagonal slice */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, transparent 50%, #A3E635 50%, #A3E635 100%)', opacity: 0.95 }} />
      {/* Mark — three steps */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={s * 0.58} height={s * 0.58} viewBox="0 0 64 64" fill="none">
          <circle cx="14" cy="48" r="5" fill="#F4EFE3" />
          <circle cx="32" cy="32" r="7" fill="#F4EFE3" />
          <circle cx="50" cy="16" r="9" fill="#0B3B2E" />
          <circle cx="50" cy="16" r="3" fill="#A3E635" />
          {/* connecting dashes */}
          <line x1="20" y1="44" x2="26" y2="38" stroke="#F4EFE3" strokeWidth="3" strokeLinecap="round"/>
          <line x1="38" y1="26" x2="44" y2="20" stroke="#0B3B2E" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

window.IconTile = IconTile;
window.IconWaypoint = IconWaypoint;
window.IconMonogram = IconMonogram;
window.IconStep = IconStep;

// ─────────────────────────────────────────────────────────
// Splash screen
// ─────────────────────────────────────────────────────────
function SplashScreen({ variant = 'forest' }) {
  if (variant === 'forest') {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: `radial-gradient(120% 90% at 30% 20%, #145E47 0%, #0B3B2E 55%, #062319 100%)`,
        position: 'relative', overflow: 'hidden', color: '#F4EFE3',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONTS.body,
      }}>
        {/* Topo lines */}
        <svg viewBox="0 0 400 800" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M -20 620 Q 100 540 220 580 T 460 540" stroke="rgba(255,255,255,0.045)" strokeWidth="38" fill="none"/>
          <path d="M -20 680 Q 100 600 220 640 T 460 600" stroke="rgba(255,255,255,0.04)" strokeWidth="38" fill="none"/>
          <path d="M -20 740 Q 100 660 220 700 T 460 660" stroke="rgba(255,255,255,0.035)" strokeWidth="38" fill="none"/>
        </svg>

        {/* mark — monograma */}
        <div style={{ marginBottom: 28, borderRadius: 26, overflow: 'hidden', boxShadow: '0 18px 40px -16px rgba(0,0,0,0.45)' }}>
          <IconMonogram size={108} />
        </div>

        {/* wordmark */}
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 52, letterSpacing: -2.2, lineHeight: 1 }}>
          de<span style={{ color: '#A3E635' }}>·</span>paso
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 4, color: 'rgba(244,239,227,0.55)', marginTop: 14, textTransform: 'uppercase' }}>
          Logística colaborativa · BA
        </div>

        {/* Bottom progress */}
        <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 120, height: 3, background: 'rgba(244,239,227,0.15)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '65%', height: '100%', background: '#A3E635' }} />
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(244,239,227,0.5)', letterSpacing: 2 }}>
            CARGANDO RUTAS
          </div>
        </div>
      </div>
    );
  }

  // cream variant
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(180deg, #F4EFE3 0%, #E8DEC2 100%)`,
      position: 'relative', overflow: 'hidden', color: TOKENS.forest,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONTS.body,
    }}>
      <div style={{ marginBottom: 24 }}>
        <IconMonogram size={104} />
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 52, letterSpacing: -2.2, lineHeight: 1, color: TOKENS.forest }}>
        de<span style={{ color: TOKENS.emeraldDeep }}>·</span>paso
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 4, color: TOKENS.inkSoft, marginTop: 14, textTransform: 'uppercase' }}>
        Mandá liviano. Llegá lejos.
      </div>
      <div style={{ position: 'absolute', bottom: 60, fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.inkMute, letterSpacing: 3 }}>
        v1.0 · BUENOS AIRES
      </div>
    </div>
  );
}

window.SplashScreen = SplashScreen;
