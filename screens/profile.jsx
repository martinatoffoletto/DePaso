// ProfileScreen — perfil del usuario
// Sistema: cream + forest, hero card forest con avatar + stats, secciones agrupadas

function ProfileRow({ icon, label, value, trailing = 'chevron', accent, danger }) {
  return (
    <div style={{
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent ? TOKENS.mint : TOKENS.cardSoft,
        border: `1px solid ${accent ? 'transparent' : TOKENS.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? TOKENS.red : (accent ? TOKENS.forest : TOKENS.inkSoft),
        flexShrink: 0,
      }}>
        <Icon name={icon} size={18} strokeWidth={1.8}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.body, fontSize: 14, fontWeight: 500,
          color: danger ? TOKENS.red : TOKENS.ink,
        }}>
          {label}
        </div>
        {value && (
          <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value}
          </div>
        )}
      </div>
      {trailing === 'chevron' && (
        <div style={{ color: TOKENS.inkFaint }}>
          <Icon name="chevron-right" size={18} strokeWidth={2}/>
        </div>
      )}
      {trailing === 'toggle-on' && (
        <div style={{ width: 38, height: 22, borderRadius: 22, background: TOKENS.forest, padding: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 18, height: 18, borderRadius: 18, background: '#F4EFE3' }}/>
        </div>
      )}
      {trailing === 'toggle-off' && (
        <div style={{ width: 38, height: 22, borderRadius: 22, background: TOKENS.border, padding: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ width: 18, height: 18, borderRadius: 18, background: '#F4EFE3' }}/>
        </div>
      )}
      {typeof trailing === 'string' && trailing !== 'chevron' && trailing !== 'toggle-on' && trailing !== 'toggle-off' && (
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase', fontWeight: 600 }}>
          {trailing}
        </div>
      )}
    </div>
  );
}

function ProfileSection({ title, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: TOKENS.inkMute, textTransform: 'uppercase', padding: '0 20px 8px' }}>
        {title}
      </div>
      <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 18, margin: '0 16px', overflow: 'hidden' }}>
        {React.Children.map(children, (child, i) => (
          <React.Fragment>
            {i > 0 && <div style={{ height: 1, background: TOKENS.borderSoft, marginLeft: 66 }}/>}
            {child}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'auto' }}>
      <StatusBar dark={true}/>

      {/* Top bar */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: TOKENS.ink, letterSpacing: -0.6 }}>
          Mi cuenta
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Hero forest card */}
      <div style={{
        margin: '14px 16px 0',
        borderRadius: 24,
        background: `radial-gradient(120% 100% at 80% 0%, #145E47 0%, #0B3B2E 60%, #062319 100%)`,
        color: '#F4EFE3', padding: '20px 20px 18px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Topo deco */}
        <svg viewBox="0 0 380 220" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }}>
          <path d="M -20 180 Q 100 120 220 150 T 460 120" stroke="rgba(255,255,255,0.06)" strokeWidth="18" fill="none"/>
          <path d="M -20 210 Q 100 150 220 180 T 460 150" stroke="rgba(255,255,255,0.05)" strokeWidth="18" fill="none"/>
        </svg>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'linear-gradient(135deg, #A3E635, #6DA52E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: TOKENS.forest,
              fontFamily: FONTS.display, fontWeight: 800, fontSize: 26, letterSpacing: -0.5,
              boxShadow: '0 6px 16px -4px rgba(0,0,0,0.3)',
            }}>
              VP
            </div>
            {/* edit dot */}
            <div style={{
              position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 22,
              background: '#F4EFE3', border: `2px solid ${TOKENS.forest}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest,
            }}>
              <Icon name="camera" size={11} strokeWidth={2.2}/>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: '#F4EFE3', letterSpacing: -0.6, lineHeight: 1 }}>
                Valentina Pereyra
              </div>
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 12.5, color: 'rgba(244,239,227,0.7)', marginTop: 4 }}>
              valentina@gmail.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'rgba(163,230,53,0.15)', border: '1px solid rgba(163,230,53,0.3)',
                padding: '2px 7px', borderRadius: 6,
              }}>
                <Icon name="leaf" size={10} color="#A3E635" strokeWidth={2.4}/>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: '#A3E635', fontWeight: 700, textTransform: 'uppercase' }}>
                  ECO · NIVEL 2
                </span>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(244,239,227,0.45)', textTransform: 'uppercase' }}>
                DESDE MAR 2025
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 14, marginTop: 22, position: 'relative' }}>
          <div style={{ flex: 1, borderRight: '1px solid rgba(244,239,227,0.12)', paddingRight: 10 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: '#F4EFE3', letterSpacing: -0.5 }}>12</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase' }}>ENVÍOS</div>
          </div>
          <div style={{ flex: 1, borderRight: '1px solid rgba(244,239,227,0.12)', paddingRight: 10 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: '#A3E635', letterSpacing: -0.5 }}>21<span style={{ fontSize: 12 }}>kg</span></div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase' }}>CO₂ AHORRADO</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: '#F4EFE3', letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
              4.9
              <Icon name="star" size={14} color="#A3E635" strokeWidth={0}/>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase' }}>REPUTACIÓN</div>
          </div>
        </div>
      </div>

      {/* Eco progress / next level */}
      <div style={{ margin: '12px 16px 0', background: TOKENS.cardSoft, border: `1px dashed ${TOKENS.border}`, borderRadius: 16, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: TOKENS.mint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest }}>
              <Icon name="leaf" size={12} strokeWidth={2.2}/>
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>
              Próximo nivel: <span style={{ color: TOKENS.emeraldDeep }}>Forestero</span>
            </div>
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: TOKENS.inkMute, fontWeight: 700 }}>
            8 / 15 envíos
          </div>
        </div>
        <div style={{ height: 6, background: TOKENS.border, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: '53%', height: '100%', background: `linear-gradient(90deg, ${TOKENS.emerald}, #A3E635)` }}/>
        </div>
      </div>

      {/* Sections */}
      <ProfileSection title="CUENTA">
        <ProfileRow icon="user" label="Datos personales" value="Nombre, email, celular"/>
        <ProfileRow icon="pin" label="Mis direcciones" value="3 guardadas" />
        <ProfileRow icon="wallet" label="Métodos de pago" value="Mercado Pago ··· 4821"/>
      </ProfileSection>

      <ProfileSection title="ACTIVIDAD">
        <ProfileRow icon="history" label="Historial de envíos" value="12 envíos · este año"/>
        <ProfileRow icon="leaf" label="Mi impacto eco" value="21 kg CO₂ ahorrados" accent={true}/>
        <ProfileRow icon="star" label="Reseñas y calificación" value="4.9 · 11 reseñas"/>
      </ProfileSection>

      <ProfileSection title="PREFERENCIAS">
        <ProfileRow icon="bolt" label="Notificaciones" trailing="toggle-on"/>
        <ProfileRow icon="leaf" label="Preferir envíos colaborativos" trailing="toggle-on"/>
        <ProfileRow icon="user" label="Idioma" trailing="ES-AR"/>
      </ProfileSection>

      <ProfileSection title="AYUDA Y LEGAL">
        <ProfileRow icon="shield" label="Centro de ayuda" />
        <ProfileRow icon="list" label="Términos y privacidad" />
      </ProfileSection>

      {/* Logout */}
      <div style={{ padding: '20px 16px 0' }}>
        <button style={{
          width: '100%', background: 'transparent', border: `1px solid ${TOKENS.border}`,
          padding: '14px', borderRadius: 14,
          fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: TOKENS.red,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
        <div style={{ textAlign: 'center', marginTop: 14, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
          DEPASO V1.0.0 · BUILD 4821
        </div>
        <div style={{ height: 100 }}/> {/* bottom spacing for nav */}
      </div>

      {/* Bottom nav with Perfil active */}
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
          { name: 'history', label: 'Mis envíos', active: false },
          { name: 'user', label: 'Perfil', active: true },
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

window.ProfileScreen = ProfileScreen;
