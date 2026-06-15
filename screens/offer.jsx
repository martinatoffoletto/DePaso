// OfferSelectionScreen — redesigned
// - Forest header with step indicator
// - Mini-map of the route as a hero visual
// - Big asymmetric "Dedicada" vs "Colaborativa" cards (Colaborativa is highlighted as the eco choice)
// - CO₂ badge integrated, not afterthought

function StepHeader({ step = 2, total = 4, title, subtitle, onBack = true }) {
  return (
    <div style={{ padding: '6px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        {onBack ? (
          <button style={{
            width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
            background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
          }}>
            <Icon name="arrow-left" size={18} strokeWidth={2}/>
          </button>
        ) : <div style={{ width: 38 }}/>}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: total }).map((_, i) => {
            const done = i < step - 1;
            const active = i === step - 1;
            return (
              <div key={i} style={{
                width: active ? 18 : 6, height: 6, borderRadius: 4,
                background: done || active ? TOKENS.forest : TOKENS.border,
              }}/>
            );
          })}
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkMute, marginLeft: 6 }}>
            {String(step).padStart(2,'0')}/{String(total).padStart(2,'0')}
          </div>
        </div>

        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <Icon name="sparkle" size={16} strokeWidth={2}/>
        </button>
      </div>

      <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 4 }}>
        PASO {String(step).padStart(2,'0')} · {subtitle}
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color: TOKENS.ink, letterSpacing: -0.8, lineHeight: 1.05 }}>
        {title}
      </div>
    </div>
  );
}

window.StepHeader = StepHeader;

// Mini route card with origin → destination
function RouteCard({ compact = false }) {
  return (
    <div style={{
      background: TOKENS.card, borderRadius: 18,
      border: `1px solid ${TOKENS.border}`,
      padding: compact ? 12 : 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 10, border: `2px solid ${TOKENS.forest}`, background: TOKENS.card }}/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>RETIRO</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Av. Córdoba 5421, Palermo
              </div>
            </div>
          </div>
          <div style={{ paddingLeft: 4, height: 14, display: 'flex', alignItems: 'center' }}>
            <svg width="2" height="14" viewBox="0 0 2 14"><line x1="1" y1="0" x2="1" y2="14" stroke={TOKENS.inkFaint} strokeWidth="1.5" strokeDasharray="2 2"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: TOKENS.emerald, transform: 'rotate(45deg)' }}/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>ENTREGA</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Olleros 2820, Belgrano
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingLeft: 12, borderLeft: `1px solid ${TOKENS.borderSoft}`, paddingLeft: 12, marginLeft: 8 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: TOKENS.ink, letterSpacing: -0.5 }}>
            6.4<span style={{ fontSize: 11, color: TOKENS.inkMute, fontWeight: 500 }}>km</span>
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
            DISTANCIA
          </div>
        </div>
      </div>
    </div>
  );
}

window.RouteCard = RouteCard;

// Mini map svg (abstract)
function MiniMap() {
  return (
    <div style={{
      borderRadius: 18, border: `1px solid ${TOKENS.border}`, overflow: 'hidden',
      background: '#EFE9D6', position: 'relative', height: 130,
    }}>
      <svg viewBox="0 0 360 130" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
        {/* base */}
        <rect width="360" height="130" fill="#EFE9D6"/>
        {/* park blocks */}
        <rect x="40" y="20" width="60" height="34" rx="3" fill="#D5E6C8"/>
        <rect x="240" y="70" width="50" height="40" rx="3" fill="#D5E6C8"/>
        {/* grid streets */}
        {Array.from({length: 7}).map((_,i) => (
          <line key={'h'+i} x1="0" y1={i*22 + 8} x2="360" y2={i*22 + 8} stroke="#E0D4B0" strokeWidth="1"/>
        ))}
        {Array.from({length: 11}).map((_,i) => (
          <line key={'v'+i} x1={i*36 + 12} y1="0" x2={i*36 + 12} y2="130" stroke="#E0D4B0" strokeWidth="1"/>
        ))}
        {/* main avenue */}
        <line x1="0" y1="74" x2="360" y2="74" stroke="#D8C99B" strokeWidth="6"/>
        <line x1="160" y1="0" x2="160" y2="130" stroke="#D8C99B" strokeWidth="4"/>
        {/* route */}
        <path d="M 50 90 L 50 74 L 160 74 L 160 40 L 300 40" stroke="#0B3B2E" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 50 90 L 50 74 L 160 74 L 160 40 L 300 40" stroke="#A3E635" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 4"/>
        {/* origin */}
        <circle cx="50" cy="90" r="7" fill="#F4EFE3" stroke="#0B3B2E" strokeWidth="3"/>
        {/* destination */}
        <g transform="translate(300, 40) rotate(45)">
          <rect x="-6" y="-6" width="12" height="12" fill="#10B981"/>
        </g>
      </svg>
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(244,239,227,0.92)', padding: '4px 8px', borderRadius: 8, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: TOKENS.ink, textTransform: 'uppercase' }}>
        AMBA · CABA
      </div>
    </div>
  );
}

window.MiniMap = MiniMap;

// ─────────────────────────────────────────────────────────
function OfferSelectionScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>
      <StepHeader step={2} total={4} title="Elegí cómo querés enviar" subtitle="OFERTA"/>

      {/* Mini map + route card stack */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MiniMap/>
        <RouteCard compact={true}/>
      </div>

      {/* Two offer cards */}
      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Dedicada — neutral */}
        <div style={{
          background: TOKENS.card, borderRadius: 20,
          border: `1px solid ${TOKENS.border}`,
          padding: 16, position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>OPCIÓN A · DEDICADA</div>
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: TOKENS.ink, letterSpacing: -0.6, lineHeight: 1 }}>
                Sólo tu envío
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 12.5, color: TOKENS.inkMute, marginTop: 4 }}>
                El cadete va directo, sin paradas.
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 24, color: TOKENS.ink, letterSpacing: -0.8, lineHeight: 1 }}>
                $6.900
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.inkMute, marginTop: 2 }}>
                ARS · IMPUESTOS INCL.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, paddingTop: 10, borderTop: `1px solid ${TOKENS.borderSoft}`, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={14} color={TOKENS.inkSoft} strokeWidth={2}/>
              <span style={{ fontFamily: FONTS.body, fontSize: 12, color: TOKENS.inkSoft, fontWeight: 500 }}>28 min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="route" size={14} color={TOKENS.inkSoft} strokeWidth={2}/>
              <span style={{ fontFamily: FONTS.body, fontSize: 12, color: TOKENS.inkSoft, fontWeight: 500 }}>Directo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="shield" size={14} color={TOKENS.inkSoft} strokeWidth={2}/>
              <span style={{ fontFamily: FONTS.body, fontSize: 12, color: TOKENS.inkSoft, fontWeight: 500 }}>Asegurado</span>
            </div>
          </div>
        </div>

        {/* Colaborativa — featured */}
        <div style={{
          background: TOKENS.forest, borderRadius: 20,
          padding: 16, position: 'relative', overflow: 'hidden',
          boxShadow: '0 16px 32px -16px rgba(11,59,46,0.4)',
        }}>
          {/* lime accent corner */}
          <svg viewBox="0 0 200 200" style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, opacity: 0.16 }}>
            <circle cx="100" cy="100" r="80" fill="#A3E635"/>
          </svg>

          {/* RECOMENDADO ribbon */}
          <div style={{ position: 'absolute', top: 12, right: 12, background: '#A3E635', color: TOKENS.forest, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, fontWeight: 700, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
            ECO · RECOMENDADO
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase', marginBottom: 4 }}>
              OPCIÓN B · COLABORATIVA
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color: '#F4EFE3', letterSpacing: -0.8, lineHeight: 1, marginBottom: 6 }}>
              Compartí el viaje
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: 'rgba(244,239,227,0.72)', marginBottom: 16, maxWidth: '85%', lineHeight: 1.4 }}>
              Un cadete pasa cerca y suma tu paquete. Más barato y mucho menos CO₂.
            </div>

            {/* Price row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 38, color: '#F4EFE3', letterSpacing: -1.2, lineHeight: 0.95 }}>
                $3.900
              </div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontFamily: FONTS.body, fontSize: 11, color: 'rgba(244,239,227,0.45)', textDecoration: 'line-through' }}>
                  $6.900
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: '#A3E635', fontWeight: 700, textTransform: 'uppercase' }}>
                  −43% MÁS BARATO
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(244,239,227,0.08)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(244,239,227,0.1)' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(244,239,227,0.5)', textTransform: 'uppercase' }}>TIEMPO</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 17, fontWeight: 700, color: '#F4EFE3', marginTop: 2, letterSpacing: -0.4 }}>54 min</div>
              </div>
              <div style={{ flex: 1.2, background: 'rgba(163,230,53,0.16)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(163,230,53,0.35)' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: '#A3E635', textTransform: 'uppercase' }}>AHORRO CO₂</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 17, fontWeight: 700, color: '#A3E635', marginTop: 2, letterSpacing: -0.4 }}>−1.8 kg</div>
              </div>
            </div>
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
          Continuar con Colaborativa
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>
      </div>
    </div>
  );
}

window.OfferSelectionScreen = OfferSelectionScreen;
