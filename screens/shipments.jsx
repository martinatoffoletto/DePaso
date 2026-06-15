// ShipmentsScreen — Mis envíos
// - tabs En curso / Completados
// - active shipment hero (live tracking)
// - list cards with package thumbnail, route, cadete avatar

// Thumbnail for package
function PackageThumb({ pattern = 'box', tint = TOKENS.cardSoft, size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: tint, position: 'relative', overflow: 'hidden',
      border: `1px solid ${TOKENS.borderSoft}`, flexShrink: 0,
    }}>
      <svg viewBox="0 0 56 56" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id={`p-${pattern}-${size}`} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(11,59,46,0.08)" strokeWidth="2"/>
          </pattern>
        </defs>
        <rect width="56" height="56" fill={`url(#p-${pattern}-${size})`}/>
        {pattern === 'box' && (
          <g transform={`translate(28, 30)`}>
            <path d="M -16 -8 L 0 -14 L 16 -8 L 16 8 L 0 14 L -16 8 Z" fill="rgba(11,59,46,0.25)"/>
            <path d="M -16 -8 L 0 -2 L 16 -8" stroke="rgba(11,59,46,0.4)" strokeWidth="1.4" fill="none"/>
            <path d="M 0 -2 L 0 14" stroke="rgba(11,59,46,0.4)" strokeWidth="1.4"/>
          </g>
        )}
        {pattern === 'envelope' && (
          <g transform={`translate(28, 30)`}>
            <rect x="-18" y="-10" width="36" height="22" rx="2" fill="rgba(11,59,46,0.22)"/>
            <path d="M -18 -10 L 0 4 L 18 -10" stroke="rgba(11,59,46,0.4)" strokeWidth="1.4" fill="none"/>
          </g>
        )}
        {pattern === 'large' && (
          <g transform={`translate(28, 30)`}>
            <rect x="-18" y="-14" width="36" height="28" rx="2" fill="rgba(11,59,46,0.25)"/>
            <line x1="-18" y1="-4" x2="18" y2="-4" stroke="rgba(11,59,46,0.4)" strokeWidth="1.4"/>
            <line x1="0" y1="-14" x2="0" y2="14" stroke="rgba(11,59,46,0.4)" strokeWidth="1.4"/>
          </g>
        )}
      </svg>
    </div>
  );
}

// Avatar
function Avatar({ initials, color = TOKENS.violet, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#F4EFE3',
      fontFamily: FONTS.display, fontSize: size * 0.38, fontWeight: 700, letterSpacing: -0.3,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// Mini route (compact, used inside cards) — origin → destination on a single line
function MiniRouteLine({ origin, destination }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontFamily: FONTS.body }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
        <div style={{ width: 8, height: 8, borderRadius: 8, border: `1.8px solid ${TOKENS.forest}`, background: TOKENS.card, flexShrink: 0 }}/>
        <div style={{ fontSize: 12.5, color: TOKENS.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {origin}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px', color: TOKENS.inkFaint }}>
        <div style={{ width: 3, height: 3, borderRadius: 3, background: 'currentColor', opacity: 0.4 }}/>
        <div style={{ width: 3, height: 3, borderRadius: 3, background: 'currentColor', opacity: 0.7 }}/>
        <div style={{ width: 3, height: 3, borderRadius: 3, background: 'currentColor' }}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
        <div style={{ fontSize: 12.5, color: TOKENS.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {destination}
        </div>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: TOKENS.emerald, transform: 'rotate(45deg)', flexShrink: 0 }}/>
      </div>
    </div>
  );
}

// ─── Hero "in progress" shipment ──────────────────────────
function LiveShipmentCard() {
  return (
    <div style={{
      background: TOKENS.card, borderRadius: 22,
      border: `1px solid ${TOKENS.border}`,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 16px 32px -16px rgba(11,59,46,0.18)',
    }}>
      {/* ── Live map strip (top) ── */}
      <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
        <svg viewBox="0 0 360 130" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
          {/* base */}
          <rect width="360" height="130" fill="#EFE9D6"/>
          {/* parks */}
          <rect x="30" y="20" width="80" height="34" rx="3" fill="#D5E6C8"/>
          <rect x="240" y="78" width="70" height="40" rx="3" fill="#D5E6C8"/>
          {/* grid */}
          {Array.from({length: 7}).map((_,i) => (
            <line key={'h'+i} x1="0" y1={i*22 + 8} x2="360" y2={i*22 + 8} stroke="#E0D4B0" strokeWidth="1"/>
          ))}
          {Array.from({length: 11}).map((_,i) => (
            <line key={'v'+i} x1={i*36 + 12} y1="0" x2={i*36 + 12} y2="130" stroke="#E0D4B0" strokeWidth="1"/>
          ))}
          {/* avenues */}
          <line x1="0" y1="68" x2="360" y2="68" stroke="#D8C99B" strokeWidth="6"/>
          <line x1="170" y1="0" x2="170" y2="130" stroke="#D8C99B" strokeWidth="4"/>
          {/* completed segment (lime green) */}
          <path d="M 40 96 L 40 68 L 170 68 L 170 50" stroke="#0B3B2E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 40 96 L 40 68 L 170 68 L 170 50" stroke="#A3E635" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 3"/>
          {/* remaining segment (dashed lighter) */}
          <path d="M 170 50 L 170 34 L 320 34" stroke="#0B3B2E" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" opacity="0.35"/>
          {/* origin */}
          <circle cx="40" cy="96" r="6" fill="#F4EFE3" stroke="#0B3B2E" strokeWidth="2.5"/>
          {/* destination */}
          <g transform="translate(320, 34)">
            <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#10B981" transform="rotate(45)"/>
          </g>
          {/* live courier dot — at midpoint of route */}
          <g transform="translate(170, 50)">
            <circle r="12" fill="#A3E635" opacity="0.2"/>
            <circle r="8" fill="#A3E635" opacity="0.4"/>
            <circle r="4.5" fill="#A3E635" stroke="#0B3B2E" strokeWidth="2"/>
          </g>
        </svg>

        {/* Status pill float — top-left */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: TOKENS.forest, color: '#A3E635',
          padding: '5px 9px 5px 8px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 12px -4px rgba(11,59,46,0.4)',
        }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#A3E635' }}/>
            <div style={{ position: 'absolute', inset: -3, borderRadius: 8, background: '#A3E635', opacity: 0.35 }}/>
          </div>
          <span style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: 700, textTransform: 'uppercase' }}>
            EN CURSO
          </span>
        </div>

        {/* ID pill — top-right */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
          border: `1px solid ${TOKENS.border}`,
          padding: '5px 8px', borderRadius: 8,
          fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1, color: TOKENS.ink, fontWeight: 700,
        }}>
          DP-4821-K7
        </div>

        {/* ETA float — bottom */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12, right: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
            border: `1px solid ${TOKENS.border}`,
            padding: '5px 9px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="clock" size={12} color={TOKENS.forest} strokeWidth={2.2}/>
            <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: TOKENS.ink }}>
              Llega 15:26 — 15:36
            </span>
          </div>
          <div style={{
            background: 'rgba(244,239,227,0.95)', backdropFilter: 'blur(8px)',
            border: `1px solid ${TOKENS.border}`,
            padding: '5px 9px', borderRadius: 8,
            fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1, color: TOKENS.inkSoft, fontWeight: 700, textTransform: 'uppercase',
          }}>
            6.4 KM
          </div>
        </div>
      </div>

      {/* ── Progress timeline (4 steps) ── */}
      <div style={{ padding: '14px 16px 6px', borderBottom: `1px solid ${TOKENS.borderSoft}`, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
          {/* Track */}
          <div style={{ position: 'absolute', top: 6, left: 22, right: 22, height: 2, background: TOKENS.border, borderRadius: 2 }}/>
          <div style={{ position: 'absolute', top: 6, left: 22, width: '38%', height: 2, background: TOKENS.emerald, borderRadius: 2 }}/>

          {[
            { label: 'Retiro',    done: true,  time: '14:48' },
            { label: 'En viaje',  done: true,  time: '14:54' },
            { label: 'Cerca',     active: true, time: '~15:20' },
            { label: 'Entrega',   done: false, time: '—' },
          ].map((step, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: step.active ? 14 : 10, height: step.active ? 14 : 10,
                borderRadius: 14,
                background: step.done ? TOKENS.emerald : step.active ? TOKENS.card : TOKENS.bg,
                border: step.active ? `2.5px solid ${TOKENS.emerald}` : step.done ? 'none' : `2px solid ${TOKENS.border}`,
                boxShadow: step.active ? `0 0 0 4px rgba(16,185,129,0.18)` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.done && <Icon name="check" size={7} color="#F4EFE3" strokeWidth={3.5}/>}
              </div>
              <div style={{
                fontFamily: FONTS.body, fontSize: 10.5, marginTop: 6,
                color: step.active ? TOKENS.ink : step.done ? TOKENS.inkSoft : TOKENS.inkFaint,
                fontWeight: step.active ? 700 : step.done ? 500 : 400,
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 0.8, marginTop: 1,
                color: step.active ? TOKENS.emeraldDeep : TOKENS.inkMute, textTransform: 'uppercase', fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                {step.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Package row ── */}
      <div style={{ padding: '12px 16px 10px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: `1px solid ${TOKENS.borderSoft}` }}>
        <PackageThumb pattern="box" size={48}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 15.5, color: TOKENS.ink, letterSpacing: -0.3, lineHeight: 1.1 }}>
            Caja de zapatillas
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute, marginTop: 2 }}>
            Chico · 1.4 kg · Palermo → Belgrano
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: TOKENS.mint, padding: '3px 7px', borderRadius: 6 }}>
          <Icon name="leaf" size={10} color={TOKENS.forest} strokeWidth={2.4}/>
          <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.forest, fontWeight: 700, textTransform: 'uppercase' }}>
            COLABORATIVA
          </span>
        </div>
      </div>

      {/* ── Cadete row with actions ── */}
      <div style={{ padding: '12px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar initials="MR" color={TOKENS.amber} size={40}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
            TU CADETE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 600 }}>
              Mariano R.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon name="star" size={11} color={TOKENS.amber} strokeWidth={0}/>
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.inkSoft, fontWeight: 700 }}>4.9</span>
            </div>
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 10.5, color: TOKENS.inkMute, marginTop: 1 }}>
            Honda Wave · AB 421 XQ
          </div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 12,
          background: TOKENS.cardSoft, border: `1px solid ${TOKENS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </button>
        <button style={{
          padding: '0 14px', height: 38, borderRadius: 12,
          background: TOKENS.forest, color: '#F4EFE3', border: 'none',
          fontFamily: FONTS.body, fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 8px 16px -6px rgba(11,59,46,0.4)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          Chat
        </button>
      </div>
    </div>
  );
}

// ─── Past shipment card ───────────────────────────────────
function ShipmentCard({ item }) {
  const statusColor = item.status === 'entregado' ? TOKENS.emeraldDeep
                    : item.status === 'cancelado' ? TOKENS.red
                    : TOKENS.amber;
  const statusBg    = item.status === 'entregado' ? TOKENS.mint
                    : item.status === 'cancelado' ? TOKENS.redBg
                    : TOKENS.amberBg;
  const statusLabel = item.status === 'entregado' ? 'ENTREGADO'
                    : item.status === 'cancelado' ? 'CANCELADO'
                    : 'PENDIENTE';

  return (
    <div style={{
      background: TOKENS.card, borderRadius: 18, border: `1px solid ${TOKENS.border}`,
      padding: 14,
    }}>
      {/* Top: id + status + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.ink, fontWeight: 700 }}>
            {item.id}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: statusBg, padding: '3px 7px', borderRadius: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: 5, background: statusColor }}/>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
          </div>
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
          {item.date}
        </div>
      </div>

      {/* Body: thumb + description */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <PackageThumb pattern={item.thumb} size={56}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, color: TOKENS.ink, letterSpacing: -0.3, lineHeight: 1.15 }}>
            {item.title}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute, marginTop: 2, lineHeight: 1.35 }}>
            {item.desc}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {item.tag && (
              <div style={{ background: TOKENS.cardSoft, border: `1px solid ${TOKENS.borderSoft}`, padding: '2px 6px', borderRadius: 5, fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1, color: TOKENS.inkSoft, fontWeight: 700, textTransform: 'uppercase' }}>
                {item.tag}
              </div>
            )}
            {item.co2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon name="leaf" size={10} color={TOKENS.emeraldDeep} strokeWidth={2.2}/>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.emeraldDeep, fontWeight: 700, textTransform: 'uppercase' }}>
                  −{item.co2} CO₂
                </span>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, color: TOKENS.ink, letterSpacing: -0.5 }}>
            {item.price}
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
            ARS
          </div>
        </div>
      </div>

      {/* Route */}
      <div style={{ background: TOKENS.bg, borderRadius: 12, padding: '8px 12px', marginBottom: 10 }}>
        <MiniRouteLine origin={item.origin} destination={item.destination}/>
      </div>

      {/* Cadete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
        <Avatar initials={item.cadete.initials} color={item.cadete.color} size={28}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: TOKENS.ink, fontWeight: 500 }}>
            {item.cadete.name}
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase', marginTop: 1 }}>
            CADETE · {item.cadete.trips} VIAJES JUNTOS
          </div>
        </div>
        {item.status === 'entregado' && (
          item.rated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: TOKENS.cardSoft, padding: '4px 8px', borderRadius: 8, border: `1px solid ${TOKENS.borderSoft}` }}>
              {[1,2,3,4,5].map(s => (
                <Icon key={s} name="star" size={11} color={s <= item.rating ? TOKENS.amber : TOKENS.border}/>
              ))}
            </div>
          ) : (
            <button style={{
              background: TOKENS.forest, color: '#F4EFE3', border: 'none',
              padding: '6px 10px', borderRadius: 8,
              fontFamily: FONTS.body, fontSize: 11.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="star" size={11} color="#A3E635" strokeWidth={2}/>
              Calificar
            </button>
          )
        )}
        {item.status === 'cancelado' && (
          <button style={{
            background: 'transparent', color: TOKENS.inkSoft, border: `1px solid ${TOKENS.border}`,
            padding: '6px 10px', borderRadius: 8,
            fontFamily: FONTS.body, fontSize: 11.5, fontWeight: 600,
          }}>
            Reenviar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ShipmentsScreen ──────────────────────────────────────
function ShipmentsScreen() {
  const items = [
    {
      id: 'DP-4811-A2',
      status: 'entregado',
      date: '12 MAY',
      title: 'Documentos de oficina',
      desc: 'Sobre A4 · 0.3 kg · Sellado',
      thumb: 'envelope',
      tag: 'EXPRESS',
      co2: '0.9 kg',
      price: '$4.200',
      origin: 'Microcentro',
      destination: 'Vicente López',
      cadete: { name: 'Federico C.', initials: 'FC', color: TOKENS.violet, trips: 3 },
      rated: true,
      rating: 5,
    },
    {
      id: 'DP-4789-B1',
      status: 'entregado',
      date: '09 MAY',
      title: 'Plantas para regalo',
      desc: 'Caja mediana · 3.2 kg · Frágil',
      thumb: 'box',
      tag: 'COLABORATIVA',
      co2: '1.8 kg',
      price: '$3.900',
      origin: 'Caballito',
      destination: 'Núñez',
      cadete: { name: 'Rocío P.', initials: 'RP', color: TOKENS.emerald, trips: 1 },
      rated: false,
    },
    {
      id: 'DP-4754-J9',
      status: 'cancelado',
      date: '02 MAY',
      title: 'Mueble plegable',
      desc: 'Bulto grande · 14 kg',
      thumb: 'large',
      tag: 'FLETE',
      co2: null,
      price: '$0',
      origin: 'Almagro',
      destination: 'Saavedra',
      cadete: { name: 'Sin asignar', initials: '?', color: TOKENS.inkMute, trips: 0 },
      rated: false,
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'auto' }}>
      <StatusBar dark={true}/>

      {/* Top bar */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
            HISTORIAL
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color: TOKENS.ink, letterSpacing: -0.8, lineHeight: 1, marginTop: 4 }}>
            Mis envíos
          </div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <Icon name="search" size={18} strokeWidth={2}/>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          background: TOKENS.cardSoft, border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 14,
          padding: 4, display: 'flex', gap: 4,
        }}>
          {[
            { label: 'En curso', count: 1, active: true },
            { label: 'Entregados', count: 11, active: false },
            { label: 'Cancelados', count: 2, active: false },
          ].map((t, i) => (
            <button key={i} style={{
              flex: 1, background: t.active ? TOKENS.card : 'transparent',
              border: 'none', padding: '8px 10px', borderRadius: 10,
              fontFamily: FONTS.body, fontSize: 13, fontWeight: t.active ? 600 : 500,
              color: t.active ? TOKENS.ink : TOKENS.inkSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: t.active ? '0 2px 6px -2px rgba(11,59,46,0.15)' : 'none',
            }}>
              {t.label}
              <span style={{
                fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.5, fontWeight: 700,
                background: t.active ? TOKENS.forest : TOKENS.border,
                color: t.active ? '#A3E635' : TOKENS.inkSoft,
                padding: '1px 5px', borderRadius: 4,
              }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live hero */}
      <div style={{ padding: '14px 16px 0' }}>
        <LiveShipmentCard/>
      </div>

      {/* Past shipments section */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
          ANTERIORES
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkSoft, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
          ESTE MES
          <Icon name="chevron-down" size={12} strokeWidth={2}/>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <ShipmentCard key={i} item={item}/>
        ))}
      </div>

      {/* CO2 footer summary */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: TOKENS.cardSoft, border: `1px dashed ${TOKENS.border}`, borderRadius: 14, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: TOKENS.mint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest }}>
            <Icon name="leaf" size={18} strokeWidth={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
              ESTE MES AHORRASTE
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, color: TOKENS.ink, letterSpacing: -0.4, marginTop: 1 }}>
              4.5 kg de CO₂ · <span style={{ color: TOKENS.emeraldDeep }}>3 envíos colaborativos</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 100 }}/>

      {/* Bottom nav with "Mis envíos" active */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(244,239,227,0.94)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${TOKENS.border}`,
        paddingTop: 8, paddingBottom: 28,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      }}>
        {[
          { name: 'pin', label: 'Enviar', active: false },
          { name: 'history', label: 'Mis envíos', active: true },
          { name: 'user', label: 'Perfil', active: false },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.active ? TOKENS.forest : TOKENS.inkMute }}>
            <Icon name={t.name} size={22} strokeWidth={t.active ? 2.2 : 1.8} />
            <div style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: t.active ? 600 : 500 }}>{t.label}</div>
            {t.active && <div style={{ width: 4, height: 4, borderRadius: 4, background: TOKENS.emerald, marginTop: -1 }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

window.ShipmentsScreen = ShipmentsScreen;
