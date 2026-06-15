// Rider (cadete) screens — DePaso
// Mismo sistema visual: cream + forest + lime
// 4 pantallas: Home offline · Home online · Publicar viaje · Oferta entrante

// ─── Shared rider bottom nav (with central earnings) ────────
function RiderNavBar({ active = 'home' }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(244,239,227,0.94)',
      backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${TOKENS.border}`,
      paddingTop: 8, paddingBottom: 28,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    }}>
      {[
        { key: 'home',    name: 'home',    label: 'Inicio' },
        { key: 'trips',   name: 'route',   label: 'Viajes' },
        { key: 'wallet',  name: 'wallet',  label: 'Pagos' },
        { key: 'profile', name: 'user',    label: 'Perfil' },
      ].map((t, i) => {
        const isActive = t.key === active;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: isActive ? TOKENS.forest : TOKENS.inkMute }}>
            <Icon name={t.name} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <div style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: isActive ? 600 : 500 }}>{t.label}</div>
            {isActive && <div style={{ width: 4, height: 4, borderRadius: 4, background: TOKENS.emerald, marginTop: -1 }}/>}
          </div>
        );
      })}
    </div>
  );
}
window.RiderNavBar = RiderNavBar;

// Moto icon (custom — más característico que un truck)
function MotoIcon({ size = 22, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17" r="3.5"/>
      <circle cx="18.5" cy="17" r="3.5"/>
      <path d="M 14 5h3l2 5"/>
      <path d="M 5.5 17l4-6h6l3 6"/>
      <path d="M 11 11l-2-3h-3"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// 01 · Rider Home — Offline (decide cómo trabajar)
// Dos modos: "Empezar a trabajar" (libre, recibís ofertas)
//            o  "Publicar un viaje" (programás una ruta que vas a hacer)
// ─────────────────────────────────────────────────────────
function RiderHomeOffline() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Top bar */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden' }}>
            <IconMonogram size={38}/>
          </div>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              MODO CADETE
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>
              Mariano R.
            </div>
          </div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink, position: 'relative',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 8, background: TOKENS.red, border: `1.5px solid ${TOKENS.card}` }}/>
        </button>
      </div>

      {/* HERO: Status offline + primary CTA */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: `radial-gradient(120% 100% at 80% 0%, #145E47 0%, #0B3B2E 60%, #062319 100%)`,
          borderRadius: 24, padding: '22px 20px 20px',
          color: '#F4EFE3', position: 'relative', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 380 240" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }}>
            <path d="M -20 180 Q 100 120 220 150 T 460 120" stroke="rgba(255,255,255,0.07)" strokeWidth="18" fill="none"/>
            <path d="M -20 220 Q 100 160 220 190 T 460 160" stroke="rgba(255,255,255,0.05)" strokeWidth="18" fill="none"/>
          </svg>

          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, position: 'relative' }}>
            <div style={{ width: 8, height: 8, borderRadius: 8, background: 'rgba(244,239,227,0.4)' }}/>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: 'rgba(244,239,227,0.55)', fontWeight: 700, textTransform: 'uppercase' }}>
              FUERA DE LÍNEA
            </span>
          </div>

          {/* Big copy */}
          <div style={{ position: 'relative', marginBottom: 22 }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 30, lineHeight: 0.95, letterSpacing: -1.2, color: '#F4EFE3' }}>
              Listo cuando<br/>vos quieras.
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: 'rgba(244,239,227,0.65)', marginTop: 8, maxWidth: 280 }}>
              Activá disponibilidad o programá un viaje que vas a hacer igual.
            </div>
          </div>

          {/* Primary CTA: start working */}
          <button style={{
            width: '100%', border: 'none', background: '#A3E635', color: TOKENS.forest,
            padding: '16px', borderRadius: 16,
            fontFamily: FONTS.display, fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            letterSpacing: -0.3,
            boxShadow: '0 12px 26px -6px rgba(163,230,53,0.45), inset 0 -2px 0 rgba(0,0,0,0.08)',
            marginBottom: 10,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Empezar a trabajar
          </button>

          {/* Secondary: publish trip */}
          <button style={{
            width: '100%', background: 'rgba(244,239,227,0.08)', color: '#F4EFE3',
            border: '1px solid rgba(244,239,227,0.18)',
            padding: '14px', borderRadius: 14,
            fontFamily: FONTS.body, fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Icon name="route" size={16} strokeWidth={2}/>
            Publicar un viaje que voy a hacer
          </button>
        </div>
      </div>

      {/* Hoy / Stats */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14, color: TOKENS.ink, letterSpacing: -0.3 }}>
            Hoy
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
            JUEVES · 14:32
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1.4, background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
            borderRadius: 16, padding: '12px 14px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              GANADO HOY
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color: TOKENS.ink, letterSpacing: -0.8, marginTop: 2 }}>
              $12.840
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: TOKENS.mint, padding: '2px 6px', borderRadius: 6 }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill={TOKENS.emeraldDeep}><polygon points="5 2 8 7 2 7"/></svg>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.5, color: TOKENS.emeraldDeep, fontWeight: 700 }}>+18%</span>
              </div>
              <span style={{ fontFamily: FONTS.body, fontSize: 10.5, color: TOKENS.inkMute }}>vs ayer</span>
            </div>
          </div>
          <div style={{
            flex: 1, background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
            borderRadius: 16, padding: '12px 14px',
          }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              VIAJES
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color: TOKENS.ink, letterSpacing: -0.8, marginTop: 2 }}>
              7
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase', marginTop: 6 }}>
              3 EN ESPERA
            </div>
          </div>
          <div style={{
            flex: 1, background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
            borderRadius: 16, padding: '12px 14px',
          }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              HORAS
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color: TOKENS.ink, letterSpacing: -0.8, marginTop: 2 }}>
              4.2
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginTop: 6 }}>
              $3.057 / H
            </div>
          </div>
        </div>
      </div>

      {/* Viajes publicados / próximos */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14, color: TOKENS.ink, letterSpacing: -0.3 }}>
            Tus viajes publicados
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase' }}>
            VER TODOS
          </div>
        </div>

        <div style={{
          background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 16,
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: TOKENS.amberBg, padding: '3px 7px', borderRadius: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: 5, background: TOKENS.amber }}/>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: '#8E5A0B', fontWeight: 700, textTransform: 'uppercase' }}>EN 18 MIN</span>
              </div>
              <span style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute }}>15:00 — 15:45</span>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.inkMute, letterSpacing: 1, fontWeight: 700 }}>
              2/4
            </div>
          </div>
          {/* route line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
              <div style={{ width: 9, height: 9, borderRadius: 9, border: `2px solid ${TOKENS.forest}`, background: TOKENS.card, flexShrink: 0 }}/>
              <span style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Palermo
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px', color: TOKENS.inkFaint }}>
              {[0.3,0.5,0.7,0.85,1].map((o, i) => (
                <div key={i} style={{ width: 3, height: 3, borderRadius: 3, background: TOKENS.inkFaint, opacity: o }}/>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Tigre
              </span>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: TOKENS.emerald, transform: 'rotate(45deg)', flexShrink: 0 }}/>
            </div>
          </div>
          {/* slots */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase', marginRight: 4 }}>
              CARGA
            </div>
            <div style={{ display: 'flex', gap: 3, flex: 1 }}>
              <div style={{ flex: 1, height: 6, background: TOKENS.emerald, borderRadius: 3 }}/>
              <div style={{ flex: 1, height: 6, background: TOKENS.emerald, borderRadius: 3 }}/>
              <div style={{ flex: 1, height: 6, background: TOKENS.borderSoft, borderRadius: 3 }}/>
              <div style={{ flex: 1, height: 6, background: TOKENS.borderSoft, borderRadius: 3 }}/>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.5, color: TOKENS.inkMute, marginLeft: 4 }}>
              2 / 4 paq.
            </div>
          </div>
        </div>
      </div>

      <RiderNavBar active="home"/>
    </div>
  );
}
window.RiderHomeOffline = RiderHomeOffline;

// ─────────────────────────────────────────────────────────
// 02 · Rider Home — Online (estás trabajando)
// Mapa de fondo + tarjeta flotante con stats vivos
// ─────────────────────────────────────────────────────────
function RiderHomeOnline() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Full map background */}
      <div style={{ position: 'absolute', top: 47, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <RiderMap/>
      </div>

      {/* Top floating bar */}
      <div style={{ position: 'absolute', top: 55, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {/* Online status */}
        <div style={{
          background: TOKENS.forest, color: '#A3E635',
          padding: '9px 12px 9px 11px', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 6px 16px -4px rgba(11,59,46,0.4)',
        }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#A3E635' }}/>
            <div style={{ position: 'absolute', inset: -3, borderRadius: 8, background: '#A3E635', opacity: 0.35 }}/>
          </div>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, fontWeight: 700, textTransform: 'uppercase' }}>EN LÍNEA</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: '#F4EFE3', fontWeight: 500, marginTop: 1 }}>
              2h 14min activo
            </div>
          </div>
        </div>

        <button style={{
          width: 40, height: 40, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
          boxShadow: '0 4px 12px -4px rgba(0,0,0,0.15)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>

      {/* Bottom sheet — drawer style */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: TOKENS.bg,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: '0 -16px 40px -10px rgba(11,59,46,0.2)',
        padding: '12px 16px 0',
      }}>
        <div style={{ width: 38, height: 4, background: TOKENS.border, borderRadius: 3, margin: '0 auto 12px' }}/>

        {/* Earnings strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 4px' }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              GANADO HOY
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, color: TOKENS.ink, letterSpacing: -0.9, marginTop: 1 }}>
              $12.840
            </div>
          </div>
          <button style={{
            background: TOKENS.red, color: '#F4EFE3', border: 'none',
            padding: '10px 16px', borderRadius: 12,
            fontFamily: FONTS.body, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1"/>
            </svg>
            Pausar
          </button>
        </div>

        {/* Pending offers (queue) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14, color: TOKENS.ink, letterSpacing: -0.3 }}>
            Pedidos cerca tuyo
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: TOKENS.amberBg, padding: '3px 7px', borderRadius: 6,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: 5, background: TOKENS.amber }}/>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: '#8E5A0B', fontWeight: 700, textTransform: 'uppercase' }}>3 NUEVOS</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { dist: '0.4', d: 'Caja chica', from: 'Palermo', to: 'Belgrano', price: '$3.900', tag: 'COLAB', time: '< 1h' },
            { dist: '1.1', d: 'Sobre', from: 'Microcentro', to: 'Recoleta', price: '$2.400', tag: 'EXPRESS', time: 'ASAP' },
          ].map((o, i) => (
            <div key={i} style={{
              background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 14,
              padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: TOKENS.cardSoft,
                border: `1px solid ${TOKENS.borderSoft}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest,
              }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 13, fontWeight: 700, color: TOKENS.ink, lineHeight: 1 }}>{o.dist}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 7, letterSpacing: 0.5, color: TOKENS.inkMute, marginTop: 1 }}>KM</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>{o.d}</span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: TOKENS.inkMute, background: TOKENS.bg, padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>{o.tag}</span>
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 11, color: TOKENS.inkMute, marginTop: 1 }}>
                  {o.from} → {o.to} · {o.time}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.4 }}>{o.price}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1, color: TOKENS.emeraldDeep, fontWeight: 700, marginTop: 1 }}>VER</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 100 }}/>
      </div>

      <RiderNavBar active="home"/>
    </div>
  );
}
window.RiderHomeOnline = RiderHomeOnline;

// Map background for rider online
function RiderMap() {
  return (
    <svg viewBox="0 0 390 800" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
      <rect width="390" height="800" fill="#EFE9D6"/>
      {/* parks */}
      <rect x="40" y="80" width="100" height="50" rx="4" fill="#D5E6C8"/>
      <rect x="220" y="220" width="120" height="70" rx="4" fill="#D5E6C8"/>
      <rect x="30" y="380" width="80" height="60" rx="4" fill="#D5E6C8"/>
      <rect x="230" y="500" width="120" height="40" rx="4" fill="#D5E6C8"/>
      <circle cx="80" cy="640" r="35" fill="#D5E6C8"/>
      {/* grid */}
      {Array.from({length: 36}).map((_,i) => (
        <line key={'h'+i} x1="0" y1={i*22 + 8} x2="390" y2={i*22 + 8} stroke="#E0D4B0" strokeWidth="1"/>
      ))}
      {Array.from({length: 12}).map((_,i) => (
        <line key={'v'+i} x1={i*36 + 12} y1="0" x2={i*36 + 12} y2="800" stroke="#E0D4B0" strokeWidth="1"/>
      ))}
      {/* avenues */}
      <line x1="0" y1="180" x2="390" y2="180" stroke="#D8C99B" strokeWidth="8"/>
      <line x1="0" y1="420" x2="390" y2="420" stroke="#D8C99B" strokeWidth="8"/>
      <line x1="180" y1="0" x2="180" y2="800" stroke="#D8C99B" strokeWidth="6"/>

      {/* Other riders (faded) */}
      <g opacity="0.5">
        <circle cx="100" cy="260" r="9" fill="#0B3B2E"/>
        <circle cx="260" cy="160" r="9" fill="#0B3B2E"/>
        <circle cx="320" cy="380" r="9" fill="#0B3B2E"/>
      </g>

      {/* Pending packages — pulsing amber dots */}
      <g>
        <circle cx="140" cy="300" r="14" fill="rgba(232,158,42,0.2)"/>
        <circle cx="140" cy="300" r="8" fill={TOKENS.amber} stroke="#F4EFE3" strokeWidth="2"/>
      </g>
      <g>
        <circle cx="240" cy="500" r="14" fill="rgba(232,158,42,0.2)"/>
        <circle cx="240" cy="500" r="8" fill={TOKENS.amber} stroke="#F4EFE3" strokeWidth="2"/>
      </g>
      <g>
        <circle cx="80" cy="180" r="14" fill="rgba(232,158,42,0.2)"/>
        <circle cx="80" cy="180" r="8" fill={TOKENS.amber} stroke="#F4EFE3" strokeWidth="2"/>
      </g>

      {/* My position — big lime with pulse */}
      <g transform="translate(195, 340)">
        <circle r="34" fill="rgba(163,230,53,0.18)"/>
        <circle r="22" fill="rgba(163,230,53,0.3)"/>
        <circle r="14" fill="#A3E635" stroke="#0B3B2E" strokeWidth="3.5"/>
        <circle r="5" fill="#0B3B2E"/>
      </g>
    </svg>
  );
}
window.RiderMap = RiderMap;

// ─────────────────────────────────────────────────────────
// 03 · Publicar un viaje
// El cadete declara una ruta que va a hacer igual
// → reciben pedidos colaborativos en esa ruta
// ─────────────────────────────────────────────────────────
function RiderPublishTrip() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Top bar */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <Icon name="arrow-left" size={18} strokeWidth={2}/>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: TOKENS.mint, padding: '5px 10px', borderRadius: 9 }}>
          <Icon name="leaf" size={11} color={TOKENS.forest} strokeWidth={2.4}/>
          <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: TOKENS.forest, fontWeight: 700, textTransform: 'uppercase' }}>
            COLABORATIVO
          </span>
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* Title */}
      <div style={{ padding: '20px 20px 0', position: 'relative' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 6 }}>
          PUBLICÁ UN VIAJE
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, color: TOKENS.ink, letterSpacing: -1, lineHeight: 1 }}>
          ¿A dónde vas a<br/>ir igual?
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 12.5, color: TOKENS.inkSoft, lineHeight: 1.4, marginTop: 8, maxWidth: 320 }}>
          Decinos tu ruta y horario. Te ofrecemos paquetes que van en el mismo sentido.
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '20px 16px 0' }}>
        {/* Route block */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="2" height="36" viewBox="0 0 2 36" style={{ position: 'absolute', left: 28, top: 62, zIndex: 1 }}>
            <line x1="1" y1="0" x2="1" y2="36" stroke={TOKENS.inkFaint} strokeWidth="1.5" strokeDasharray="2 3"/>
          </svg>
          {/* Origin */}
          <div style={{
            background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 14,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, border: `2.5px solid ${TOKENS.forest}`, background: TOKENS.card, flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                DESDE
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>
                Mi casa · Caballito
              </div>
            </div>
            <div style={{ color: TOKENS.inkMute }}>
              <Icon name="chevron-right" size={18} strokeWidth={2}/>
            </div>
          </div>
          {/* Destination */}
          <div style={{
            background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 14,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: TOKENS.emerald, transform: 'rotate(45deg)', flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                HASTA
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>
                Trabajo · Tigre Centro
              </div>
            </div>
            <div style={{ color: TOKENS.inkMute }}>
              <Icon name="chevron-right" size={18} strokeWidth={2}/>
            </div>
          </div>
        </div>

        {/* Time window */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase', marginBottom: 6 }}>
            CUÁNDO SALÍS
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {['Hoy', 'Mañana', 'Jue 28', 'Vie 29'].map((d, i) => (
              <div key={i} style={{
                flex: i === 0 ? 1.2 : 1,
                background: i === 0 ? TOKENS.forest : TOKENS.card,
                color: i === 0 ? '#F4EFE3' : TOKENS.ink,
                border: `1px solid ${i === 0 ? TOKENS.forest : TOKENS.border}`,
                padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                fontFamily: FONTS.body, fontSize: 12.5, fontWeight: i === 0 ? 700 : 500,
              }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, background: TOKENS.card, border: `1.5px solid ${TOKENS.forest}`, borderRadius: 12,
              padding: '11px 12px',
            }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>SALIDA</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: TOKENS.ink, letterSpacing: -0.4, marginTop: 1 }}>15:00</div>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.inkMute, letterSpacing: 1, fontWeight: 700 }}>→</div>
            <div style={{
              flex: 1, background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 12,
              padding: '11px 12px',
            }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>FLEX</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: TOKENS.ink, letterSpacing: -0.4, marginTop: 1 }}>± 15m</div>
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div style={{
          background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 14,
          padding: '14px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                CAPACIDAD
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600, marginTop: 1 }}>
                ¿Cuánto entra en tu moto?
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MotoIcon size={18} color={TOKENS.inkSoft} strokeWidth={1.8}/>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft, fontWeight: 700 }}>HONDA WAVE</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { l: 'Solo sobres', sub: '≤ 2 kg', sel: false },
              { l: 'Chico',       sub: '≤ 5 kg', sel: true },
              { l: 'Mediano',     sub: '≤ 15 kg', sel: false },
            ].map((c, i) => (
              <div key={i} style={{
                flex: 1,
                background: c.sel ? TOKENS.forest : TOKENS.cardSoft,
                color: c.sel ? '#F4EFE3' : TOKENS.ink,
                border: `1.2px solid ${c.sel ? TOKENS.forest : TOKENS.borderSoft}`,
                borderRadius: 10, padding: '8px 6px', textAlign: 'center', position: 'relative',
              }}>
                <div style={{ fontFamily: FONTS.body, fontSize: 11.5, fontWeight: 600 }}>{c.l}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1, color: c.sel ? 'rgba(244,239,227,0.6)' : TOKENS.inkMute, textTransform: 'uppercase', marginTop: 2 }}>{c.sub}</div>
              </div>
            ))}
          </div>
          {/* slots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>ESPACIOS</span>
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{
                  flex: 1, height: 28, borderRadius: 8,
                  border: `1.5px solid ${n <= 3 ? TOKENS.forest : TOKENS.border}`,
                  background: n <= 3 ? `rgba(16,185,129,0.1)` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: n <= 3 ? TOKENS.emeraldDeep : TOKENS.inkFaint,
                }}>
                  {n}
                </div>
              ))}
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.inkMute, fontWeight: 700, whiteSpace: 'nowrap' }}>3 PAQ.</span>
          </div>
        </div>

        {/* Estimated earnings preview */}
        <div style={{
          background: TOKENS.forest, borderRadius: 16, padding: '14px',
          color: '#F4EFE3', position: 'relative', overflow: 'hidden',
          marginBottom: 18,
        }}>
          <svg viewBox="0 0 200 100" style={{ position: 'absolute', right: -20, top: -10, width: 140, height: 90, opacity: 0.15 }}>
            <path d="M 50 80 Q 60 20 140 30 Q 150 80 60 90 Z" fill="#A3E635"/>
          </svg>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.6)', textTransform: 'uppercase' }}>
                ESTIMACIÓN
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, letterSpacing: -0.7, marginTop: 1 }}>
                <span style={{ color: '#A3E635' }}>$2.400 — $4.200</span>
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 11, color: 'rgba(244,239,227,0.7)', marginTop: 2 }}>
                según paquetes que se sumen al viaje
              </div>
            </div>
            <Icon name="sparkle" size={26} color="#A3E635" strokeWidth={1.8}/>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
        <button style={{
          width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
          padding: '16px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
        }}>
          Publicar viaje
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>
      </div>
    </div>
  );
}
window.RiderPublishTrip = RiderPublishTrip;

// ─────────────────────────────────────────────────────────
// 04 · Oferta entrante — notificación full-screen
// El cadete está en línea, recibe un pedido cerca
// ─────────────────────────────────────────────────────────
function RiderIncomingOffer() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Blurred map background */}
      <div style={{ position: 'absolute', top: 47, left: 0, right: 0, bottom: 0, overflow: 'hidden', filter: 'blur(2px)', opacity: 0.55 }}>
        <RiderMap/>
      </div>
      <div style={{ position: 'absolute', top: 47, left: 0, right: 0, bottom: 0, background: 'rgba(11,59,46,0.15)' }}/>

      {/* Top: notification banner */}
      <div style={{
        position: 'absolute', top: 60, left: 16, right: 16,
        background: TOKENS.forest, color: '#F4EFE3',
        borderRadius: 16, padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 10px 30px -6px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: '#A3E635', color: TOKENS.forest,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name="box" size={16} strokeWidth={2.4}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: '#A3E635', fontWeight: 700, textTransform: 'uppercase' }}>
            NUEVO PEDIDO CERCA · HACE 4S
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12.5, color: '#F4EFE3', fontWeight: 600, marginTop: 1 }}>
            Caja chica · $3.900 · 6.4 km
          </div>
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(244,239,227,0.55)', letterSpacing: 1, fontWeight: 700 }}>
          DEPASO
        </div>
      </div>

      {/* Offer detail sheet (bottom) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: TOKENS.bg,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '14px 16px 28px',
        boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.3)',
      }}>
        <div style={{ width: 38, height: 4, background: TOKENS.border, borderRadius: 3, margin: '0 auto 14px' }}/>

        {/* Header: pulse + countdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 10, height: 10 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: TOKENS.amber }}/>
              <div style={{ position: 'absolute', inset: -4, borderRadius: 10, background: TOKENS.amber, opacity: 0.3 }}/>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: '#8E5A0B', fontWeight: 700, textTransform: 'uppercase' }}>
              PEDIDO ENTRANTE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: TOKENS.amberBg, padding: '4px 9px', borderRadius: 8 }}>
            <Icon name="clock" size={12} color="#8E5A0B" strokeWidth={2.4}/>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#8E5A0B', fontWeight: 700, letterSpacing: 0.5 }}>
              0:18
            </span>
          </div>
        </div>

        {/* Earnings + distance hero */}
        <div style={{
          background: TOKENS.forest, borderRadius: 18, padding: '16px',
          color: '#F4EFE3', position: 'relative', overflow: 'hidden', marginBottom: 12,
        }}>
          <svg viewBox="0 0 380 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}>
            <path d="M -20 160 Q 100 100 220 130 T 460 100" stroke="rgba(255,255,255,0.06)" strokeWidth="16" fill="none"/>
          </svg>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: 'rgba(244,239,227,0.6)', textTransform: 'uppercase' }}>
                GANÁS
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 38, color: '#A3E635', letterSpacing: -1.5, lineHeight: 0.95, marginTop: 4 }}>
                $3.900
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 20, color: '#F4EFE3', letterSpacing: -0.5 }}>6.4 <span style={{ fontSize: 12, color: 'rgba(244,239,227,0.55)' }}>km</span></div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase', marginTop: 2 }}>~28 MIN</div>
            </div>
          </div>
        </div>

        {/* Pickup + dropoff */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="2" height="22" viewBox="0 0 2 22" style={{ position: 'absolute', left: 25, top: 36, zIndex: 1 }}>
            <line x1="1" y1="0" x2="1" y2="22" stroke={TOKENS.inkFaint} strokeWidth="1.5" strokeDasharray="2 3"/>
          </svg>
          <div style={{
            background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 12,
            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, border: `2.5px solid ${TOKENS.forest}`, background: TOKENS.card, flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                RETIRO · 0.4 KM DE VOS
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Av. Córdoba 5421, Palermo
              </div>
            </div>
            <div style={{ background: TOKENS.mint, padding: '3px 6px', borderRadius: 5, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.5, color: TOKENS.forest, fontWeight: 700 }}>
              2 MIN
            </div>
          </div>
          <div style={{
            background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 12,
            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: TOKENS.emerald, transform: 'rotate(45deg)', flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                ENTREGA
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Olleros 2820, Belgrano
              </div>
            </div>
          </div>
        </div>

        {/* Package details strip */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { l: 'TIPO', v: 'Chico' },
            { l: 'PESO', v: '1.4 kg' },
            { l: 'MODO', v: 'Colab.', accent: true },
          ].map((it, i) => (
            <div key={i} style={{
              flex: 1, background: it.accent ? TOKENS.mint : TOKENS.cardSoft,
              border: `1px solid ${it.accent ? 'transparent' : TOKENS.borderSoft}`,
              borderRadius: 10, padding: '7px 9px',
            }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: it.accent ? TOKENS.forest : TOKENS.inkMute, textTransform: 'uppercase', fontWeight: 700 }}>{it.l}</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 12.5, color: it.accent ? TOKENS.forest : TOKENS.ink, fontWeight: 600, marginTop: 1 }}>{it.v}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            width: 56, height: 56, borderRadius: 18,
            background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
            color: TOKENS.inkSoft, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button style={{
            flex: 1, height: 56, borderRadius: 18,
            background: TOKENS.forest, color: '#A3E635', border: 'none',
            fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, letterSpacing: -0.3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 16px 32px -8px rgba(11,59,46,0.5)',
          }}>
            <Icon name="check" size={20} strokeWidth={3} color="#A3E635"/>
            Aceptar · $3.900
          </button>
        </div>
      </div>
    </div>
  );
}
window.RiderIncomingOffer = RiderIncomingOffer;
