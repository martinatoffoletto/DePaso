// HomeScreen — redesigned (forest hero + viewfinder card)
// Logo: usa MarkMonogram en todos lados

function StatusBar({ time = '10:39', dark = false }) {
  const c = dark ? '#F4EFE3' : TOKENS.ink;
  return (
    <div style={{ height: 47, paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px 0' }}>
      <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 16, color: c }}>{time}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: c }}>
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none"><circle cx="2" cy="9" r="1.5" fill={c}/><circle cx="6.5" cy="9" r="1.5" fill={c}/><circle cx="11" cy="9" r="1.5" fill={c}/><circle cx="15.5" cy="9" r="1.5" fill={c}/></svg>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none"><path d="M1.7 6.8a8 8 0 0 1 13.6 0M4.5 8.2a5 5 0 0 1 8 0M7.5 9.5a2 2 0 0 1 2 0" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg>
        <div style={{ width: 26, height: 12, border: `1.2px solid ${c}`, borderRadius: 3, padding: 1.5, position: 'relative' }}>
          <div style={{ width: '78%', height: '100%', background: c, borderRadius: 1 }}/>
          <div style={{ position: 'absolute', right: -3, top: 3, width: 2, height: 4, background: c, borderRadius: 1 }}/>
        </div>
      </div>
    </div>
  );
}

window.StatusBar = StatusBar;

function HomeNavBar() {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(244,239,227,0.92)',
      backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${TOKENS.border}`,
      paddingTop: 8, paddingBottom: 28,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    }}>
      {[
        { name: 'pin', label: 'Enviar', active: true },
        { name: 'history', label: 'Mis envíos' },
        { name: 'user', label: 'Perfil' },
      ].map((t, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.active ? TOKENS.forest : TOKENS.inkMute }}>
          <Icon name={t.name} size={22} strokeWidth={t.active ? 2.2 : 1.8} />
          <div style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: t.active ? 600 : 500 }}>{t.label}</div>
          {t.active && <div style={{ width: 4, height: 4, borderRadius: 4, background: TOKENS.emerald, marginTop: -1 }}/>}
        </div>
      ))}
    </div>
  );
}

window.HomeNavBar = HomeNavBar;

// ─────────────────────────────────────────────────────────
function HomeScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true} />

      {/* ─── Forest hero: greeting + stats ─── */}
      <div style={{
        margin: '6px 16px 0',
        borderRadius: 24,
        background: `radial-gradient(120% 100% at 80% 0%, #145E47 0%, #0B3B2E 60%, #062319 100%)`,
        color: '#F4EFE3', padding: '20px 20px 18px', position: 'relative', overflow: 'hidden',
      }}>
        <svg viewBox="0 0 380 220" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}>
          <path d="M -20 160 Q 100 100 220 130 T 460 100" stroke="rgba(255,255,255,0.06)" strokeWidth="16" fill="none"/>
          <path d="M -20 190 Q 100 130 220 160 T 460 130" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none"/>
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>
              MAR · 22:24
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: 'rgba(244,239,227,0.7)', marginBottom: 2 }}>
              Hola, Valentina
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 30, letterSpacing: -1.2, lineHeight: 1, color: '#F4EFE3' }}>
              ¿Qué movemos<br/>hoy?
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(244,239,227,0.14)', border: '1px solid rgba(244,239,227,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F4EFE3', flexShrink: 0 }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14 }}>V</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 18, position: 'relative' }}>
          <div style={{ flex: 1, borderRight: '1px solid rgba(244,239,227,0.12)', paddingRight: 10 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: '#F4EFE3', letterSpacing: -0.5 }}>12</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase' }}>ENVÍOS</div>
          </div>
          <div style={{ flex: 1, borderRight: '1px solid rgba(244,239,227,0.12)', paddingRight: 10 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: '#A3E635', letterSpacing: -0.5 }}>21<span style={{ fontSize: 12 }}>kg</span></div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase' }}>CO₂ AHORRADO</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: '#F4EFE3', letterSpacing: -0.5 }}>4.9</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase' }}>REPUTACIÓN</div>
          </div>
        </div>
      </div>

      {/* ─── Adjuntá foto card ─── */}
      <div style={{ margin: '12px 16px 0' }}>
        <div style={{
          background: TOKENS.card, borderRadius: 22, border: `1px solid ${TOKENS.border}`,
          padding: 16, boxShadow: '0 8px 24px -12px rgba(11,59,46,0.16)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 6 }}>
                EMPEZÁ POR ACÁ
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: TOKENS.ink, letterSpacing: -0.7, lineHeight: 1 }}>
                ¿Qué vas a<br/>enviar hoy?
              </div>
            </div>
            <div style={{
              background: TOKENS.mint, border: `1px solid ${TOKENS.borderSoft}`,
              borderRadius: 9, padding: '5px 8px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="sparkle" size={11} color={TOKENS.forest} strokeWidth={2.4}/>
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.forest, fontWeight: 700, textTransform: 'uppercase' }}>
                IA
              </span>
            </div>
          </div>

          {/* Viewfinder dropzone */}
          <div style={{
            position: 'relative',
            aspectRatio: '3 / 2',
            borderRadius: 16,
            background: `linear-gradient(160deg, #0E4A39 0%, #062319 100%)`,
            overflow: 'hidden',
            marginBottom: 14,
          }}>
            <svg viewBox="0 0 360 240" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <pattern id="hvf" patternUnits="userSpaceOnUse" width="24" height="24">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(244,239,227,0.04)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="360" height="240" fill="url(#hvf)"/>
              <path d="M -10 200 Q 80 150 180 170 T 380 140" stroke="rgba(163,230,53,0.1)" strokeWidth="14" fill="none"/>
            </svg>

            <div style={{ position: 'absolute', inset: 14, pointerEvents: 'none' }}>
              {['tl','tr','bl','br'].map((p) => (
                <div key={p} style={{
                  position: 'absolute',
                  top: p.startsWith('t') ? 0 : 'auto',
                  bottom: p.startsWith('b') ? 0 : 'auto',
                  left: p.endsWith('l') ? 0 : 'auto',
                  right: p.endsWith('r') ? 0 : 'auto',
                  width: 26, height: 26,
                  borderTop: p.startsWith('t') ? `2.5px solid #A3E635` : 'none',
                  borderBottom: p.startsWith('b') ? `2.5px solid #A3E635` : 'none',
                  borderLeft: p.endsWith('l') ? `2.5px solid #A3E635` : 'none',
                  borderRight: p.endsWith('r') ? `2.5px solid #A3E635` : 'none',
                  borderTopLeftRadius: p === 'tl' ? 8 : 0,
                  borderTopRightRadius: p === 'tr' ? 8 : 0,
                  borderBottomLeftRadius: p === 'bl' ? 8 : 0,
                  borderBottomRightRadius: p === 'br' ? 8 : 0,
                }}/>
              ))}
            </div>

            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#F4EFE3', padding: '0 28px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: '#A3E635',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest,
                flexShrink: 0,
                boxShadow: '0 8px 18px -4px rgba(163,230,53,0.4), inset 0 -2px 0 rgba(0,0,0,0.08)',
              }}>
                <Icon name="camera" size={28} strokeWidth={2.2}/>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 17, fontWeight: 700, color: '#F4EFE3', letterSpacing: -0.4, lineHeight: 1.05 }}>
                  Adjuntá una foto
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.8, color: 'rgba(244,239,227,0.6)', textTransform: 'uppercase', marginTop: 5 }}>
                  LA IA HACE EL RESTO
                </div>
              </div>
            </div>

            <div style={{
              position: 'absolute', top: 14, right: 14,
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(244,239,227,0.1)', border: '1px solid rgba(244,239,227,0.18)',
              backdropFilter: 'blur(8px)',
              padding: '4px 7px', borderRadius: 7,
              fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(244,239,227,0.8)', fontWeight: 700, textTransform: 'uppercase',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              GALERÍA
            </div>
          </div>

          {/* Continuar — secondary outline */}
          <button style={{
            width: '100%',
            background: TOKENS.bg,
            border: `1px solid ${TOKENS.border}`,
            padding: '14px',
            borderRadius: 14,
            fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: TOKENS.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            Continuar
            <Icon name="arrow-right" size={16} strokeWidth={2.2}/>
          </button>
        </div>
      </div>

      {/* ─── Frecuentes ─── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14, color: TOKENS.ink, letterSpacing: -0.3 }}>
            Volvé a mandar
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            VER HISTORIAL
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { title: 'Zapatillas', sub: 'A BELGRANO', avatar: 'MR', color: TOKENS.amber, type: 'box' },
            { title: 'Documentos', sub: 'A V. LÓPEZ', avatar: 'FC', color: TOKENS.violet, type: 'envelope' },
            { title: 'Plantas',    sub: 'A NÚÑEZ',   avatar: 'RP', color: TOKENS.emerald, type: 'leaf' },
          ].map((it, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 0,
              background: TOKENS.card, borderRadius: 14, border: `1px solid ${TOKENS.border}`,
              padding: '10px 10px', position: 'relative',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: TOKENS.cardSoft, border: `1px solid ${TOKENS.borderSoft}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.inkSoft, marginBottom: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {it.type === 'envelope' ? (
                    <>
                      <rect x="3" y="6" width="18" height="13" rx="1.5"/>
                      <path d="M3 9l9 5 9-5"/>
                    </>
                  ) : it.type === 'leaf' ? (
                    <>
                      <path d="M20 4c0 9-7 16-16 16 0-9 7-16 16-16Z"/>
                      <path d="M4 20c4-6 8-10 14-14"/>
                    </>
                  ) : (
                    <>
                      <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"/>
                      <path d="M3 8l9 5 9-5"/>
                    </>
                  )}
                </svg>
              </div>
              <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 12.5, color: TOKENS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {it.title}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase', marginTop: 1 }}>
                {it.sub}
              </div>
              <div style={{
                position: 'absolute', top: 10, right: 10,
                width: 18, height: 18, borderRadius: 18, background: it.color,
                border: `2px solid ${TOKENS.card}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONTS.display, fontSize: 8, fontWeight: 700, color: '#F4EFE3',
              }}>
                {it.avatar}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Eco band ─── */}
      <div style={{ margin: '12px 16px 0' }}>
        <div style={{
          background: TOKENS.forest, borderRadius: 16, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 200 100" style={{ position: 'absolute', right: -20, top: -10, width: 140, height: 80, opacity: 0.18 }}>
            <path d="M 50 80 Q 60 20 140 30 Q 150 80 60 90 Z" fill="#A3E635"/>
          </svg>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#A3E635', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest, flexShrink: 0 }}>
            <Icon name="leaf" size={18} strokeWidth={2.2}/>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 13.5, color: '#F4EFE3', letterSpacing: -0.2 }}>
              Logística colaborativa
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: 'rgba(244,239,227,0.7)', lineHeight: 1.3, marginTop: 2 }}>
              Compartiendo viajes ahorrás hasta <span style={{ color: '#A3E635', fontWeight: 600 }}>1.8 kg CO₂</span> por envío
            </div>
          </div>
          <Icon name="chevron-right" size={16} color="rgba(244,239,227,0.6)" strokeWidth={2}/>
        </div>
      </div>

      <HomeNavBar />
    </div>
  );
}

window.HomeScreen = HomeScreen;
