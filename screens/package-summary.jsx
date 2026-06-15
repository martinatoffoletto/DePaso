// PackageCategoryScreen — AI classification of the package
// - Photo of the package (placeholder)
// - AI badge with confidence
// - Detected category card + alternative chips
// - Dimensions inputs

function PackageCategoryScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>
      <StepHeader step={3} total={4} title="Clasificación del paquete" subtitle="DETECCIÓN AUTOMÁTICA"/>

      {/* Photo card */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          background: TOKENS.card, borderRadius: 22, border: `1px solid ${TOKENS.border}`,
          padding: 12, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            height: 170, borderRadius: 14, background: '#E8DEC2', position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Striped placeholder for "package photo" */}
            <svg viewBox="0 0 360 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <pattern id="diag" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="14" stroke="#D4C698" strokeWidth="3"/>
                </pattern>
              </defs>
              <rect width="360" height="170" fill="url(#diag)"/>
              {/* Box silhouette */}
              <g transform="translate(180, 95)">
                <path d="M -60 -30 L 0 -50 L 60 -30 L 60 30 L 0 50 L -60 30 Z" fill="rgba(11,59,46,0.18)"/>
                <path d="M -60 -30 L 0 -10 L 60 -30" stroke="rgba(11,59,46,0.3)" strokeWidth="2" fill="none"/>
                <path d="M 0 -10 L 0 50" stroke="rgba(11,59,46,0.3)" strokeWidth="2"/>
              </g>
            </svg>
            <div style={{ position: 'absolute', bottom: 10, left: 10, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: 'rgba(11,59,46,0.55)', textTransform: 'uppercase', background: 'rgba(244,239,227,0.7)', padding: '3px 7px', borderRadius: 6 }}>
              FOTO DEL PAQUETE
            </div>

            {/* AI scan corners */}
            <div style={{ position: 'absolute', inset: 18, pointerEvents: 'none' }}>
              {[{t:0,l:0,b:'2px solid '+TOKENS.emerald,r:'2px solid '+TOKENS.emerald,bl:0,br:0,tl:0,tr:0,bt:'2px solid '+TOKENS.emerald,bl2:0,corners:'tl'},].map(()=>null)}
              {/* 4 corners */}
              {['tl','tr','bl','br'].map((p,i) => (
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

            {/* Re-shoot button */}
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

          {/* AI tag bar */}
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

      {/* Category selection */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15, color: TOKENS.ink, letterSpacing: -0.3, marginBottom: 10 }}>
          Confirmá la categoría
        </div>

        {/* Primary AI-suggested */}
        <div style={{
          background: TOKENS.card, borderRadius: 16,
          border: `1.5px solid ${TOKENS.forest}`, padding: 14,
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'relative',
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

        {/* Alternatives */}
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
              MEDIDAS APROXIMADAS · IA
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

      {/* Footer CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
        <button style={{
          width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
          padding: '16px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
        }}>
          Confirmar · Paso 4 de 4
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>
      </div>
    </div>
  );
}

window.PackageCategoryScreen = PackageCategoryScreen;

// ─────────────────────────────────────────────────────────
// SummaryScreen — final review
// ─────────────────────────────────────────────────────────
function SummaryScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>
      <StepHeader step={4} total={4} title="Listo. Revisemos tu envío." subtitle="CONFIRMACIÓN"/>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MiniMap/>

        {/* Order ID + ETA strip */}
        <div style={{ background: TOKENS.card, borderRadius: 16, border: `1px solid ${TOKENS.border}`, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>NRO DE ENVÍO</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 15, fontWeight: 700, color: TOKENS.ink, marginTop: 2, letterSpacing: 0.5 }}>DP-4821-K7</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>LLEGA</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, color: TOKENS.ink, marginTop: 1, letterSpacing: -0.4 }}>15:26 — 15:36</div>
          </div>
        </div>

        <RouteCard compact={true}/>

        {/* Order details */}
        <div style={{ background: TOKENS.card, borderRadius: 16, border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
          {[
            { l: 'Servicio',  v: 'Encomienda Colaborativa', icon: 'leaf', color: TOKENS.emeraldDeep },
            { l: 'Paquete',   v: 'Chico · 1.4 kg · 24×18×12', icon: 'box', color: TOKENS.inkSoft },
            { l: 'Cadete',    v: 'Esperando match', icon: 'user', color: TOKENS.inkSoft, status: 'matching' },
            { l: 'Pago',      v: 'Mercado Pago ··· 4821', icon: 'wallet', color: TOKENS.inkSoft },
          ].map((r, i, arr) => (
            <div key={i} style={{
              padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? `1px solid ${TOKENS.borderSoft}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ color: r.color }}>
                <Icon name={r.icon} size={18} strokeWidth={1.8}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
                  {r.l}
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>
                  {r.v}
                </div>
              </div>
              {r.status === 'matching' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: TOKENS.amberBg, padding: '4px 8px', borderRadius: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: 5, background: TOKENS.amber }}/>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#8E5A0B', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' }}>BUSCANDO</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CO2 hero card */}
        <div style={{
          background: TOKENS.forest, borderRadius: 18, padding: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 200 100" style={{ position: 'absolute', right: -10, top: -10, width: 140, height: 90, opacity: 0.18 }}>
            <path d="M 50 80 Q 60 20 140 30 Q 150 80 60 90 Z" fill="#A3E635"/>
          </svg>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(163,230,53,0.18)', border: '1px solid rgba(163,230,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A3E635' }}>
              <Icon name="leaf" size={28} strokeWidth={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(163,230,53,0.7)', textTransform: 'uppercase' }}>
                CON ESTE ENVÍO
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 24, color: '#F4EFE3', letterSpacing: -0.7, lineHeight: 1.05, marginTop: 2 }}>
                Ahorrás <span style={{ color: '#A3E635' }}>1.8 kg</span> de CO₂
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: 'rgba(244,239,227,0.65)', marginTop: 4 }}>
                Equivale a 9 km menos de auto en CABA.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>TOTAL A PAGAR</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color: TOKENS.ink, letterSpacing: -0.8, lineHeight: 1 }}>$3.900</div>
          </div>
          <button style={{
            border: 'none', background: TOKENS.forest, color: '#F4EFE3',
            padding: '14px 22px', borderRadius: 16,
            fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
          }}>
            Confirmar envío
            <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
          </button>
        </div>
      </div>
    </div>
  );
}

window.SummaryScreen = SummaryScreen;
