// New flow v2: 01 Paquete → 02 Dirección → 03 Mapa + Oferta → 04 Resumen

// ─────────────────────────────────────────────────────────
// STEP 01 — Paquete (renombrado, mismo screen base pero con step header 1/4)
// ─────────────────────────────────────────────────────────
function FlowPackageScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>
      <StepHeader step={1} total={4} title="Mostranos qué vas a enviar" subtitle="EL PAQUETE"/>

      <div style={{ padding: '0 16px' }}>
        {/* Photo card */}
        <div style={{
          background: TOKENS.card, borderRadius: 22, border: `1px solid ${TOKENS.border}`,
          padding: 12, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            height: 170, borderRadius: 14, background: '#E8DEC2', position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 360 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <pattern id="diag2" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="14" stroke="#D4C698" strokeWidth="3"/>
                </pattern>
              </defs>
              <rect width="360" height="170" fill="url(#diag2)"/>
              <g transform="translate(180, 95)">
                <path d="M -60 -30 L 0 -50 L 60 -30 L 60 30 L 0 50 L -60 30 Z" fill="rgba(11,59,46,0.18)"/>
                <path d="M -60 -30 L 0 -10 L 60 -30" stroke="rgba(11,59,46,0.3)" strokeWidth="2" fill="none"/>
                <path d="M 0 -10 L 0 50" stroke="rgba(11,59,46,0.3)" strokeWidth="2"/>
              </g>
            </svg>
            <div style={{ position: 'absolute', bottom: 10, left: 10, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: 'rgba(11,59,46,0.55)', textTransform: 'uppercase', background: 'rgba(244,239,227,0.7)', padding: '3px 7px', borderRadius: 6 }}>
              FOTO DEL PAQUETE
            </div>
            <div style={{ position: 'absolute', inset: 18, pointerEvents: 'none' }}>
              {['tl','tr','bl','br'].map((p) => (
                <div key={p} style={{
                  position: 'absolute',
                  top: p.startsWith('t') ? 0 : 'auto',
                  bottom: p.startsWith('b') ? 0 : 'auto',
                  left: p.endsWith('l') ? 0 : 'auto',
                  right: p.endsWith('r') ? 0 : 'auto',
                  width: 18, height: 18,
                  borderTop: p.startsWith('t') ? `2.5px solid ${TOKENS.emerald}` : 'none',
                  borderBottom: p.startsWith('b') ? `2.5px solid ${TOKENS.emerald}` : 'none',
                  borderLeft: p.endsWith('l') ? `2.5px solid ${TOKENS.emerald}` : 'none',
                  borderRight: p.endsWith('r') ? `2.5px solid ${TOKENS.emerald}` : 'none',
                  borderTopLeftRadius: p === 'tl' ? 6 : 0,
                  borderTopRightRadius: p === 'tr' ? 6 : 0,
                  borderBottomLeftRadius: p === 'bl' ? 6 : 0,
                  borderBottomRightRadius: p === 'br' ? 6 : 0,
                }}/>
              ))}
            </div>
            <button style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(244,239,227,0.94)', border: 'none', padding: '8px 10px',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: FONTS.body, fontSize: 12, fontWeight: 500, color: TOKENS.ink,
            }}>
              <Icon name="camera" size={14} strokeWidth={2}/>
              Otra
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px 4px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: TOKENS.forest, color: '#A3E635', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkle" size={14} strokeWidth={2.2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                ANÁLISIS DE VISIÓN · 1.2s
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 12.5, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>
                Detectamos un paquete pequeño
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: TOKENS.mint, padding: '4px 8px', borderRadius: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: 5, background: TOKENS.emeraldDeep }}/>
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5, color: TOKENS.forest, fontWeight: 700 }}>94%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15, color: TOKENS.ink, letterSpacing: -0.3, marginBottom: 10 }}>
          Confirmá la categoría
        </div>
        <div style={{
          background: TOKENS.card, borderRadius: 16, border: `1.5px solid ${TOKENS.forest}`,
          padding: 14, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: TOKENS.mint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest }}>
            <Icon name="box" size={22} strokeWidth={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, color: TOKENS.ink, letterSpacing: -0.3 }}>
                Paquete chico
              </div>
              <div style={{ background: TOKENS.forest, color: '#A3E635', padding: '2px 6px', borderRadius: 5, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' }}>
                IA
              </div>
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute }}>
              Hasta 30×30×30 cm · 5 kg
            </div>
          </div>
          <div style={{ width: 22, height: 22, borderRadius: 22, background: TOKENS.forest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={14} color="#F4EFE3" strokeWidth={3}/>
          </div>
        </div>

        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: TOKENS.inkMute, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 }}>
          O CAMBIÁ A
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { icon: 'box', name: 'Sobre', sub: '≤ 1 kg' },
            { icon: 'box', name: 'Mediano', sub: '≤ 15 kg' },
            { icon: 'truck', name: 'Grande', sub: '> 15 kg' },
          ].map((c, i) => (
            <div key={i} style={{
              background: TOKENS.card, borderRadius: 14, padding: '10px 10px',
              border: `1px solid ${TOKENS.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
            }}>
              <div style={{ color: TOKENS.inkSoft }}>
                <Icon name={c.icon} size={18} strokeWidth={1.8}/>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 12.5, color: TOKENS.ink }}>{c.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase' }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: TOKENS.cardSoft, borderRadius: 16, padding: 14,
          border: `1px dashed ${TOKENS.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              MEDIDAS · IA
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.emeraldDeep, textTransform: 'uppercase' }}>
              EDITAR
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { l: 'LARGO', v: '24', u: 'cm' },
              { l: 'ANCHO', v: '18', u: 'cm' },
              { l: 'ALTO',  v: '12', u: 'cm' },
              { l: 'PESO',  v: '1.4', u: 'kg' },
            ].map((d, i) => (
              <div key={i} style={{ flex: 1, background: TOKENS.card, borderRadius: 10, padding: '8px 10px', border: `1px solid ${TOKENS.borderSoft}` }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: TOKENS.inkMute, marginBottom: 2 }}>{d.l}</div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, color: TOKENS.ink, letterSpacing: -0.4 }}>
                  {d.v}<span style={{ fontSize: 10, color: TOKENS.inkMute, fontWeight: 500, marginLeft: 2 }}>{d.u}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FlowFooterCTA label="Continuar · Dirección"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 02 — Direcciones (origen + destino)
// ─────────────────────────────────────────────────────────
function AddressInputRow({ kind, title, address, detail, color }) {
  return (
    <div style={{
      background: TOKENS.card, borderRadius: 16, border: `1px solid ${TOKENS.border}`,
      padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Pin marker */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {kind === 'origin' ? (
          <div style={{ width: 14, height: 14, borderRadius: 14, border: `2.5px solid ${color}`, background: TOKENS.card }}/>
        ) : (
          <div style={{ width: 14, height: 14, borderRadius: 4, background: color, transform: 'rotate(45deg)' }}/>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {address}
        </div>
        {detail && (
          <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute, marginTop: 1 }}>
            {detail}
          </div>
        )}
      </div>
      <div style={{ color: TOKENS.inkMute }}>
        <Icon name="chevron-right" size={18} strokeWidth={2}/>
      </div>
    </div>
  );
}

function AddressScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>
      <StepHeader step={2} total={4} title="¿Desde dónde y hasta dónde?" subtitle="DIRECCIONES"/>

      <div style={{ padding: '0 16px' }}>
        {/* Combined route block with dashed line */}
        <div style={{ position: 'relative' }}>
          {/* dashed line connector */}
          <svg width="2" height="48" viewBox="0 0 2 48" style={{ position: 'absolute', left: 28, top: 56, zIndex: 1 }}>
            <line x1="1" y1="0" x2="1" y2="48" stroke={TOKENS.inkFaint} strokeWidth="1.5" strokeDasharray="2 3"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AddressInputRow
              kind="origin"
              title="RETIRO · MI LOCAL"
              address="Av. Córdoba 5421, Palermo"
              detail="Local 2 · Timbre 'Pereyra'"
              color={TOKENS.forest}
            />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button style={{
                width: 32, height: 32, borderRadius: 32,
                background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
                color: TOKENS.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 2,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M 2 4 L 12 4 M 12 4 L 9 1 M 12 4 L 9 7 M 12 10 L 2 10 M 2 10 L 5 7 M 2 10 L 5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <AddressInputRow
              kind="destination"
              title="ENTREGA"
              address="Olleros 2820, Belgrano"
              detail="Pisó 4B · Recibe Martín García"
              color={TOKENS.emerald}
            />
          </div>
        </div>

        {/* Recipient details — collapsed */}
        <div style={{ marginTop: 14, background: TOKENS.card, borderRadius: 16, border: `1px solid ${TOKENS.border}`, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: TOKENS.cardSoft, border: `1px solid ${TOKENS.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest }}>
              <Icon name="user" size={18} strokeWidth={1.8}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                QUIEN RECIBE
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>
                Martín García · 11 4521-8830
              </div>
            </div>
            <div style={{ color: TOKENS.inkMute }}>
              <Icon name="chevron-right" size={18} strokeWidth={2}/>
            </div>
          </div>
        </div>

        {/* Saved addresses */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 14, color: TOKENS.ink, letterSpacing: -0.2 }}>
              Direcciones guardadas
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase' }}>
              VER TODAS
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'CASA', addr: 'Soler 4221', icon: 'home', tag: 'PRINCIPAL' },
              { label: 'TRABAJO', addr: 'Sarmiento 824', icon: 'store', tag: null },
              { label: 'MAMÁ', addr: 'Belgrano R', icon: 'pin', tag: null },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: TOKENS.card, borderRadius: 14, border: `1px solid ${TOKENS.border}`,
                padding: '10px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ color: TOKENS.inkSoft }}>
                    <Icon name={s.icon} size={16} strokeWidth={1.8}/>
                  </div>
                  {s.tag && (
                    <div style={{ background: TOKENS.mint, color: TOKENS.forest, padding: '2px 5px', borderRadius: 4, fontFamily: FONTS.mono, fontSize: 7.5, letterSpacing: 0.6, fontWeight: 700 }}>
                      {s.tag}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 12, color: TOKENS.ink, fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.addr}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule chip */}
        <div style={{ marginTop: 14, background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: TOKENS.forest }}>
            <Icon name="clock" size={18} strokeWidth={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              ¿CUÁNDO LO RETIRAMOS?
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 13.5, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>
              Hoy · Lo antes posible
            </div>
          </div>
          <div style={{ background: TOKENS.bg, padding: '5px 10px', borderRadius: 8, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.ink, fontWeight: 700, textTransform: 'uppercase' }}>
            CAMBIAR
          </div>
        </div>
      </div>

      <FlowFooterCTA label="Continuar · Ver ruta"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 03 — Mapa + Selección de tipo de viaje
// (mapa de ruta arriba como hero, abajo dos opciones en cards)
// ─────────────────────────────────────────────────────────
function RouteAndOfferScreen() {
  const [selected, setSelected] = React.useState('collab');

  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Big map hero (full bleed top) */}
      <div style={{ position: 'absolute', top: 47, left: 0, right: 0, height: 320, overflow: 'hidden' }}>
        <BigMap/>

        {/* Back button + step pill floating over map */}
        <div style={{ position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{
            width: 40, height: 40, borderRadius: 14, border: `1px solid ${TOKENS.border}`,
            background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
            boxShadow: '0 4px 12px -4px rgba(0,0,0,0.15)',
          }}>
            <Icon name="arrow-left" size={18} strokeWidth={2}/>
          </button>

          <div style={{
            background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
            border: `1px solid ${TOKENS.border}`, borderRadius: 14, padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px -4px rgba(0,0,0,0.15)',
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                width: i === 2 ? 18 : 6, height: 6, borderRadius: 4,
                background: i <= 2 ? TOKENS.forest : TOKENS.border,
              }}/>
            ))}
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkMute, marginLeft: 6 }}>
              03/04
            </div>
          </div>

          <button style={{
            width: 40, height: 40, borderRadius: 14, border: `1px solid ${TOKENS.border}`,
            background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
            boxShadow: '0 4px 12px -4px rgba(0,0,0,0.15)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </button>
        </div>

        {/* Distance/eta float card */}
        <div style={{
          position: 'absolute', bottom: 14, left: 16, right: 16,
          background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
          border: `1px solid ${TOKENS.border}`, borderRadius: 14,
          padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 20px -8px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                DISTANCIA
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, color: TOKENS.ink, letterSpacing: -0.4 }}>
                6.4 <span style={{ fontSize: 10, color: TOKENS.inkMute, fontWeight: 500 }}>km</span>
              </div>
            </div>
            <div style={{ width: 1, height: 24, background: TOKENS.borderSoft }}/>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                RUTA
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>
                Palermo → Belgrano
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: TOKENS.mint, padding: '4px 8px', borderRadius: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: 5, background: TOKENS.emeraldDeep }}/>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.forest, fontWeight: 700, textTransform: 'uppercase' }}>OK</span>
          </div>
        </div>
      </div>

      {/* Sheet over map */}
      <div style={{
        position: 'absolute', top: 47 + 280, left: 0, right: 0, bottom: 0,
        background: TOKENS.bg,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: '0 -12px 30px -10px rgba(11,59,46,0.15)',
        padding: '14px 16px 0',
        overflow: 'hidden',
      }}>
        {/* drag handle */}
        <div style={{ width: 38, height: 4, background: TOKENS.border, borderRadius: 3, margin: '0 auto 12px' }}/>

        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 4 }}>
          PASO 03 · ELEGÍ EL VIAJE
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: TOKENS.ink, letterSpacing: -0.7, lineHeight: 1, marginBottom: 12 }}>
          ¿Cómo lo enviamos?
        </div>

        {/* Two compact offer cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Dedicada */}
          <div onClick={() => setSelected('direct')} style={{
            background: TOKENS.card, borderRadius: 16,
            border: `1.5px solid ${selected === 'direct' ? TOKENS.forest : TOKENS.border}`,
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 22,
              border: `2px solid ${selected === 'direct' ? TOKENS.forest : TOKENS.border}`,
              background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selected === 'direct' && <div style={{ width: 10, height: 10, borderRadius: 10, background: TOKENS.forest }}/>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 15, color: TOKENS.ink, letterSpacing: -0.3 }}>
                  Sólo tu envío
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase', background: TOKENS.bg, padding: '2px 5px', borderRadius: 4 }}>
                  DEDICADA
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                <span style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute }}>28 min</span>
                <span style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute }}>· Directo</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: TOKENS.ink, letterSpacing: -0.5 }}>$6.900</div>
            </div>
          </div>

          {/* Colaborativa */}
          <div onClick={() => setSelected('collab')} style={{
            background: selected === 'collab' ? TOKENS.forest : TOKENS.card,
            color: selected === 'collab' ? '#F4EFE3' : TOKENS.ink,
            borderRadius: 16,
            border: `1.5px solid ${selected === 'collab' ? TOKENS.forest : TOKENS.border}`,
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            position: 'relative', overflow: 'hidden',
            boxShadow: selected === 'collab' ? '0 12px 24px -10px rgba(11,59,46,0.4)' : 'none',
          }}>
            {selected === 'collab' && (
              <svg viewBox="0 0 200 100" style={{ position: 'absolute', right: -10, top: -10, width: 130, height: 90, opacity: 0.16 }}>
                <path d="M 50 80 Q 60 20 140 30 Q 150 80 60 90 Z" fill="#A3E635"/>
              </svg>
            )}
            <div style={{
              width: 22, height: 22, borderRadius: 22,
              border: `2px solid ${selected === 'collab' ? '#A3E635' : TOKENS.border}`,
              background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1,
            }}>
              {selected === 'collab' && <div style={{ width: 10, height: 10, borderRadius: 10, background: '#A3E635' }}/>}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>
                  Compartí el viaje
                </div>
                <div style={{
                  background: '#A3E635', color: TOKENS.forest, padding: '2px 5px', borderRadius: 4,
                  fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase',
                }}>
                  ECO −43%
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                <span style={{ fontFamily: FONTS.body, fontSize: 11.5, color: selected === 'collab' ? 'rgba(244,239,227,0.7)' : TOKENS.inkMute }}>54 min</span>
                <span style={{ fontFamily: FONTS.body, fontSize: 11.5, color: selected === 'collab' ? '#A3E635' : TOKENS.emeraldDeep, fontWeight: 600 }}>−1.8 kg CO₂</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', position: 'relative' }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 20, letterSpacing: -0.6 }}>$3.900</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 10, color: selected === 'collab' ? 'rgba(244,239,227,0.45)' : TOKENS.inkFaint, textDecoration: 'line-through' }}>
                $6.900
              </div>
            </div>
          </div>
        </div>

        {/* Eco strip + driver count */}
        <div style={{ marginTop: 12, background: TOKENS.cardSoft, border: `1px dashed ${TOKENS.border}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: 22,
                background: [TOKENS.amber, TOKENS.violet, TOKENS.emerald][i],
                border: `2px solid ${TOKENS.bg}`,
                marginLeft: i === 0 ? 0 : -8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONTS.display, fontSize: 9, fontWeight: 700, color: '#F4EFE3',
              }}>
                {['MA','FC','RP'][i]}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkSoft, lineHeight: 1.35 }}>
            <span style={{ color: TOKENS.ink, fontWeight: 600 }}>3 cadetes</span> están haciendo esta ruta ahora
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
        <button style={{
          width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
          padding: '15px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
        }}>
          Continuar · Resumen
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>
      </div>
    </div>
  );
}

// Bigger map for the hero block
function BigMap() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#EFE9D6', position: 'relative' }}>
      <svg viewBox="0 0 390 320" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
        <rect width="390" height="320" fill="#EFE9D6"/>
        {/* parks */}
        <rect x="40" y="30" width="110" height="50" rx="4" fill="#D5E6C8"/>
        <rect x="260" y="180" width="90" height="60" rx="4" fill="#D5E6C8"/>
        <circle cx="80" cy="250" r="25" fill="#D5E6C8"/>
        {/* river-ish */}
        <path d="M 0 280 Q 100 250 200 270 T 400 250" stroke="#B3D5E8" strokeWidth="14" fill="none" opacity="0.6"/>
        {/* grid */}
        {Array.from({length: 14}).map((_,i) => (
          <line key={'h'+i} x1="0" y1={i*22 + 8} x2="390" y2={i*22 + 8} stroke="#E0D4B0" strokeWidth="1"/>
        ))}
        {Array.from({length: 12}).map((_,i) => (
          <line key={'v'+i} x1={i*36 + 12} y1="0" x2={i*36 + 12} y2="320" stroke="#E0D4B0" strokeWidth="1"/>
        ))}
        {/* main avenues */}
        <line x1="0" y1="160" x2="390" y2="160" stroke="#D8C99B" strokeWidth="8"/>
        <line x1="180" y1="0" x2="180" y2="320" stroke="#D8C99B" strokeWidth="6"/>
        {/* route */}
        <path d="M 60 220 L 60 160 L 180 160 L 180 90 L 320 90" stroke="#0B3B2E" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 60 220 L 60 160 L 180 160 L 180 90 L 320 90" stroke="#A3E635" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 5"/>
        {/* origin */}
        <circle cx="60" cy="220" r="10" fill="#F4EFE3" stroke="#0B3B2E" strokeWidth="3.5"/>
        <circle cx="60" cy="220" r="3" fill="#0B3B2E"/>
        {/* destination */}
        <g transform="translate(320, 90)">
          <circle r="14" fill="#10B981" opacity="0.2"/>
          <rect x="-8" y="-8" width="16" height="16" rx="2" fill="#10B981" transform="rotate(45)"/>
        </g>
        {/* origin label */}
        <g transform="translate(60, 200)">
          <rect x="-30" y="-22" width="60" height="18" rx="9" fill="#0B3B2E"/>
          <text x="0" y="-9" textAnchor="middle" fill="#F4EFE3" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="1" fontWeight="700">RETIRO</text>
        </g>
        {/* dest label */}
        <g transform="translate(320, 70)">
          <rect x="-32" y="-22" width="64" height="18" rx="9" fill="#10B981"/>
          <text x="0" y="-9" textAnchor="middle" fill="#0B3B2E" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="1" fontWeight="700">ENTREGA</text>
        </g>
      </svg>
    </div>
  );
}

window.BigMap = BigMap;

// Shared footer CTA bar
function FlowFooterCTA({ label }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
      <button style={{
        width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
        padding: '16px', borderRadius: 16,
        fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
      }}>
        {label}
        <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
      </button>
    </div>
  );
}
window.FlowFooterCTA = FlowFooterCTA;

window.FlowPackageScreen = FlowPackageScreen;
window.AddressScreen = AddressScreen;
window.RouteAndOfferScreen = RouteAndOfferScreen;
