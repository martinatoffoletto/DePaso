// Welcome, Login, Register screens — follow the same cream + forest system

// Shared input
function Field({ label, placeholder, value, type = 'text', icon, hint, error, trailing }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase' }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.emeraldDeep, textTransform: 'uppercase' }}>
            {hint}
          </div>
        )}
      </div>
      <div style={{
        background: TOKENS.card,
        borderRadius: 14,
        border: `1.2px solid ${error ? TOKENS.red : (value ? TOKENS.forest : TOKENS.border)}`,
        padding: '13px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {icon && <span style={{ color: TOKENS.inkMute }}><Icon name={icon} size={18} strokeWidth={1.8}/></span>}
        <div style={{ flex: 1, fontFamily: FONTS.body, fontSize: 15, color: value ? TOKENS.ink : TOKENS.inkFaint, fontWeight: value ? 500 : 400 }}>
          {value || placeholder}
        </div>
        {trailing}
      </div>
      {error && (
        <div style={{ fontFamily: FONTS.body, fontSize: 11, color: TOKENS.red, marginTop: 4, paddingLeft: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Welcome / Onboarding intro ─────────────────────────────
function WelcomeScreen() {
  return (
    <div style={{ width: '100%', height: '100%',
      background: `linear-gradient(180deg, #0B3B2E 0%, #062319 100%)`,
      position: 'relative', overflow: 'hidden', fontFamily: FONTS.body, color: '#F4EFE3' }}>
      <StatusBar dark={false}/>

      {/* Topo deco */}
      <svg viewBox="0 0 400 800" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M -20 480 Q 100 400 220 440 T 460 400" stroke="rgba(255,255,255,0.05)" strokeWidth="32" fill="none"/>
        <path d="M -20 540 Q 100 460 220 500 T 460 460" stroke="rgba(255,255,255,0.045)" strokeWidth="32" fill="none"/>
        <path d="M -20 600 Q 100 520 220 560 T 460 520" stroke="rgba(255,255,255,0.04)" strokeWidth="32" fill="none"/>
      </svg>

      {/* Brand */}
      <div style={{ padding: '60px 32px 0', position: 'relative' }}>
        <div style={{ marginBottom: 28 }}>
          <IconMonogram size={68}/>
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 3, color: 'rgba(244,239,227,0.55)', textTransform: 'uppercase', marginBottom: 10 }}>
          LOGÍSTICA COLABORATIVA · AMBA
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 44, lineHeight: 0.95, letterSpacing: -2, color: '#F4EFE3' }}>
          Mandá liviano.<br/>
          <span style={{ color: '#A3E635' }}>Llegá lejos.</span>
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 15, color: 'rgba(244,239,227,0.65)', marginTop: 14, lineHeight: 1.45, maxWidth: 320 }}>
          Compartimos viajes en Buenos Aires para que envíes más barato y con menos CO₂.
        </div>
      </div>

      {/* Feature row */}
      <div style={{ position: 'absolute', bottom: 220, left: 0, right: 0, padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: 'bolt', t: 'Mismo día', s: 'En 3h o menos' },
            { icon: 'leaf', t: '−1.8 kg CO₂', s: 'Por envío' },
            { icon: 'shield', t: 'Asegurado', s: 'Hasta $80k' },
          ].map((c,i) => (
            <div key={i} style={{ flex: 1, background: 'rgba(244,239,227,0.06)', border: '1px solid rgba(244,239,227,0.1)', borderRadius: 14, padding: '12px 12px' }}>
              <div style={{ color: '#A3E635', marginBottom: 8 }}>
                <Icon name={c.icon} size={18} strokeWidth={2}/>
              </div>
              <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 13, color: '#F4EFE3', letterSpacing: -0.2 }}>{c.t}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(244,239,227,0.5)', textTransform: 'uppercase', marginTop: 2 }}>{c.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 36px' }}>
        <button style={{
          width: '100%', border: 'none', background: '#F4EFE3', color: TOKENS.forest,
          padding: '16px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          marginBottom: 10,
        }}>
          Crear cuenta
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>
        <button style={{
          width: '100%', border: '1px solid rgba(244,239,227,0.2)', background: 'transparent', color: '#F4EFE3',
          padding: '15px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 14, fontWeight: 500,
        }}>
          Ya tengo cuenta · Ingresar
        </button>
        <div style={{ textAlign: 'center', marginTop: 14, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(244,239,227,0.4)', textTransform: 'uppercase' }}>
          AL CONTINUAR ACEPTÁS LOS TÉRMINOS Y LA PRIVACIDAD
        </div>
      </div>
    </div>
  );
}

window.WelcomeScreen = WelcomeScreen;

// ─── Login ─────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Top with back + mark */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <Icon name="arrow-left" size={18} strokeWidth={2}/>
        </button>
        <div style={{ width: 38, height: 38, borderRadius: 11, overflow: 'hidden' }}>
          <IconMonogram size={38}/>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '32px 24px 0' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 6 }}>
          INGRESÁ
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: TOKENS.ink, letterSpacing: -1.2, lineHeight: 1, marginBottom: 8 }}>
          Hola de nuevo
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.inkSoft, lineHeight: 1.4 }}>
          Entrá a tu cuenta para seguir moviendo paquetes en AMBA.
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '28px 24px 0' }}>
        <Field
          label="EMAIL"
          icon="user"
          value="valentina@gmail.com"
        />
        <Field
          label="CONTRASEÑA"
          icon="shield"
          value="••••••••••"
          hint="OLVIDÉ"
          trailing={<div style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.inkMute }}>VER</div>}
        />

        {/* Remember */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 24 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, background: TOKENS.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="check" size={12} color="#F4EFE3" strokeWidth={3.2}/>
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 500 }}>
            Mantener sesión iniciada
          </div>
        </div>

        {/* CTA */}
        <button style={{
          width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
          padding: '16px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
        }}>
          Iniciar sesión
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>

        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: TOKENS.border }}/>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>O CONTINUÁ CON</div>
          <div style={{ flex: 1, height: 1, background: TOKENS.border }}/>
        </div>

        {/* Social — neutral (no copyrighted logos) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { l: 'Apple', initial: '' },
            { l: 'Google', initial: 'G' },
          ].map((s, i) => (
            <button key={i} style={{
              background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
              padding: '14px', borderRadius: 14,
              fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: TOKENS.ink,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 22,
                background: i === 0 ? TOKENS.ink : '#FFFFFF',
                color: i === 0 ? '#F4EFE3' : TOKENS.ink,
                border: i === 1 ? `1px solid ${TOKENS.border}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
              }}>
                {s.initial || (
                  <svg width="11" height="13" viewBox="0 0 11 13" fill={i===0 ? '#F4EFE3' : TOKENS.ink}>
                    <circle cx="5.5" cy="6" r="3"/>
                  </svg>
                )}
              </div>
              {s.l}
            </button>
          ))}
        </div>

        {/* Phone option */}
        <button style={{
          width: '100%', background: 'transparent', border: `1px dashed ${TOKENS.border}`,
          padding: '13px', borderRadius: 14, marginTop: 10,
          fontFamily: FONTS.body, fontSize: 13, fontWeight: 500, color: TOKENS.inkSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="pin-dot" size={14} strokeWidth={2}/>
          Ingresar con número de celular
        </button>
      </div>

      {/* Footer link */}
      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.body, fontSize: 13, color: TOKENS.inkSoft }}>
        ¿No tenés cuenta?{' '}
        <span style={{ color: TOKENS.forest, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>Crear una</span>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;

// ─── Register ──────────────────────────────────────────────
function RegisterScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Top with back + step pill */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <Icon name="arrow-left" size={18} strokeWidth={2}/>
        </button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 18, height: 6, borderRadius: 4, background: TOKENS.forest }}/>
          <div style={{ width: 6, height: 6, borderRadius: 4, background: TOKENS.border }}/>
          <div style={{ width: 6, height: 6, borderRadius: 4, background: TOKENS.border }}/>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkMute, marginLeft: 6 }}>01/03</div>
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* Title */}
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 6 }}>
          PASO 01 · TUS DATOS
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, color: TOKENS.ink, letterSpacing: -1, lineHeight: 1, marginBottom: 8 }}>
          Creá tu cuenta DePaso
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 13.5, color: TOKENS.inkSoft, lineHeight: 1.45 }}>
          En 3 pasos cortos. Después podés empezar a enviar.
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="NOMBRE" placeholder="Valentina" value="Valentina" icon="user"/>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="APELLIDO" placeholder="Pereyra" value="Pereyra"/>
          </div>
        </div>

        <Field
          label="EMAIL"
          placeholder="tu@email.com"
          value="valentina@gmail.com"
          icon="check"
          hint="VERIFICADO"
        />

        {/* Phone with AR flag chip */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase', marginBottom: 6 }}>
            CELULAR
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              background: TOKENS.card, border: `1.2px solid ${TOKENS.border}`,
              borderRadius: 14, padding: '13px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {/* AR flag stripes */}
              <div style={{ width: 22, height: 14, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: '#75AADB' }}/>
                <div style={{ flex: 1, background: '#F4EFE3' }}/>
                <div style={{ flex: 1, background: '#75AADB' }}/>
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 500 }}>+54</div>
              <Icon name="chevron-down" size={14} color={TOKENS.inkMute}/>
            </div>
            <div style={{
              flex: 1, background: TOKENS.card, border: `1.2px solid ${TOKENS.forest}`,
              borderRadius: 14, padding: '13px 14px',
              display: 'flex', alignItems: 'center',
              fontFamily: FONTS.body, fontSize: 15, color: TOKENS.ink, fontWeight: 500,
            }}>
              11 5821-9043
            </div>
          </div>
        </div>

        {/* Password with strength */}
        <Field
          label="CONTRASEÑA"
          icon="shield"
          value="••••••••••••"
          trailing={<div style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.inkMute }}>VER</div>}
        />
        <div style={{ marginTop: -6, marginBottom: 14, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                width: 30, height: 4, borderRadius: 4,
                background: i <= 3 ? TOKENS.emerald : TOKENS.border,
              }}/>
            ))}
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', fontWeight: 700 }}>FUERTE</div>
        </div>

        {/* Role chips — receptor / cadete */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase', marginBottom: 8 }}>
            ¿CÓMO VAS A USAR DEPASO?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { name: 'Envío paquetes', icon: 'box', active: true },
              { name: 'Soy cadete', icon: 'truck', active: false },
            ].map((r, i) => (
              <div key={i} style={{
                background: r.active ? TOKENS.forest : TOKENS.card,
                color: r.active ? '#F4EFE3' : TOKENS.ink,
                border: `1.2px solid ${r.active ? TOKENS.forest : TOKENS.border}`,
                borderRadius: 14, padding: '12px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                position: 'relative',
              }}>
                <Icon name={r.icon} size={18} strokeWidth={2}/>
                <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                {r.active && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 16, background: '#A3E635', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={10} color={TOKENS.forest} strokeWidth={3.5}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* T&C */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, background: TOKENS.forest, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
          }}>
            <Icon name="check" size={12} color="#F4EFE3" strokeWidth={3.2}/>
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: TOKENS.inkSoft, lineHeight: 1.4 }}>
            Acepto los <span style={{ color: TOKENS.forest, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>términos</span> y la <span style={{ color: TOKENS.forest, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>política de privacidad</span> de DePaso.
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
        <button style={{
          width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
          padding: '16px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
        }}>
          Continuar al paso 2
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>
        <div style={{ textAlign: 'center', marginTop: 10, fontFamily: FONTS.body, fontSize: 12, color: TOKENS.inkSoft }}>
          ¿Ya tenés cuenta?{' '}
          <span style={{ color: TOKENS.forest, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>Iniciar sesión</span>
        </div>
      </div>
    </div>
  );
}

window.RegisterScreen = RegisterScreen;

// ─── Register STEP 02 — DNI (para ambos tipos de usuario) ─────────
function RegisterStep2DNI() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'hidden' }}>
      <StatusBar dark={true}/>

      {/* Top with back + step pill */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <Icon name="arrow-left" size={18} strokeWidth={2}/>
        </button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 6, height: 6, borderRadius: 4, background: TOKENS.forest }}/>
          <div style={{ width: 18, height: 6, borderRadius: 4, background: TOKENS.forest }}/>
          <div style={{ width: 6, height: 6, borderRadius: 4, background: TOKENS.border }}/>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkMute, marginLeft: 6 }}>02/03</div>
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* Title */}
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 6 }}>
          PASO 02 · IDENTIDAD
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, color: TOKENS.ink, letterSpacing: -1, lineHeight: 1 }}>
          Verifiquemos<br/>tu DNI
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.inkSoft, lineHeight: 1.45, marginTop: 8, maxWidth: 320 }}>
          Es un requisito legal y nos sirve para que tus envíos sean seguros. Lo encriptamos.
        </div>
      </div>

      {/* DNI photos */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { l: 'FRENTE', sub: 'DNI Frente', filled: true },
            { l: 'REVERSO', sub: 'DNI Reverso', filled: false },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1,
              aspectRatio: '3/2',
              borderRadius: 14,
              background: s.filled ? TOKENS.card : TOKENS.cardSoft,
              border: `1.5px ${s.filled ? 'solid' : 'dashed'} ${s.filled ? TOKENS.forest : TOKENS.border}`,
              padding: 10,
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.filled ? (
                <>
                  {/* DNI mockup */}
                  <svg viewBox="0 0 160 100" style={{ width: '100%', height: '100%' }}>
                    <rect width="160" height="100" rx="6" fill="#D8C99B"/>
                    <rect x="10" y="60" width="80" height="6" rx="2" fill="rgba(11,59,46,0.35)"/>
                    <rect x="10" y="72" width="60" height="4" rx="2" fill="rgba(11,59,46,0.25)"/>
                    <rect x="10" y="82" width="50" height="4" rx="2" fill="rgba(11,59,46,0.25)"/>
                    <rect x="110" y="14" width="40" height="50" rx="3" fill="rgba(11,59,46,0.3)"/>
                    <rect x="10" y="10" width="40" height="6" rx="2" fill="rgba(11,59,46,0.4)"/>
                    <rect x="10" y="22" width="60" height="4" rx="2" fill="rgba(11,59,46,0.3)"/>
                  </svg>
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 22, height: 22, borderRadius: 22, background: TOKENS.forest,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 10px -2px rgba(11,59,46,0.4)',
                  }}>
                    <Icon name="check" size={12} color="#F4EFE3" strokeWidth={3.5}/>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: TOKENS.card, border: `1px solid ${TOKENS.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest,
                    marginBottom: 6,
                  }}>
                    <Icon name="camera" size={18} strokeWidth={2}/>
                  </div>
                </>
              )}
              <div style={{ position: 'absolute', bottom: 8, left: 10, fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase', fontWeight: 700, background: 'rgba(244,239,227,0.85)', padding: '2px 5px', borderRadius: 4 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* DNI number */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>NÚMERO DE DNI</span>
            <span style={{ color: TOKENS.emeraldDeep }}>AUTO-DETECTADO</span>
          </div>
          <div style={{
            background: TOKENS.card, borderRadius: 14,
            border: `1.5px solid ${TOKENS.forest}`,
            padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: TOKENS.forest, color: '#A3E635', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="sparkle" size={14} strokeWidth={2.2}/>
            </div>
            <div style={{ flex: 1, fontFamily: FONTS.mono, fontSize: 17, color: TOKENS.ink, fontWeight: 700, letterSpacing: 1 }}>
              38.421.092
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: TOKENS.inkMute, fontWeight: 700 }}>
              EDITAR
            </div>
          </div>
        </div>

        {/* Gender + DOB row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 14, padding: '11px 12px' }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>SEXO</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>Femenino</div>
          </div>
          <div style={{ flex: 1.4, background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 14, padding: '11px 12px' }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>NACIMIENTO</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 500, marginTop: 1 }}>14 mar 1998</div>
          </div>
        </div>

        {/* Privacy note */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: TOKENS.cardSoft, borderRadius: 12, border: `1px dashed ${TOKENS.border}` }}>
          <div style={{ color: TOKENS.forest, marginTop: 1 }}>
            <Icon name="shield" size={16} strokeWidth={2}/>
          </div>
          <div style={{ flex: 1, fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkSoft, lineHeight: 1.4 }}>
            Encriptamos tu DNI y solo lo usamos para verificar identidad. Nunca lo compartimos con cadetes ni receptores.
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
        <button style={{
          width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
          padding: '16px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
        }}>
          Continuar al paso 3
          <Icon name="arrow-right" size={18} strokeWidth={2.4}/>
        </button>
      </div>
    </div>
  );
}
window.RegisterStep2DNI = RegisterStep2DNI;

// ─── Register STEP 03 — Vehículo (solo cadete) ─────────
function RegisterStep3Vehicle() {
  return (
    <div style={{ width: '100%', height: '100%', background: TOKENS.bg, fontFamily: FONTS.body, position: 'relative', overflow: 'auto' }}>
      <StatusBar dark={true}/>

      {/* Top */}
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink,
        }}>
          <Icon name="arrow-left" size={18} strokeWidth={2}/>
        </button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 6, height: 6, borderRadius: 4, background: TOKENS.forest }}/>
          <div style={{ width: 6, height: 6, borderRadius: 4, background: TOKENS.forest }}/>
          <div style={{ width: 18, height: 6, borderRadius: 4, background: TOKENS.forest }}/>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: TOKENS.inkMute, marginLeft: 6 }}>03/03</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: TOKENS.mint, padding: '5px 9px', borderRadius: 9 }}>
          <Icon name="truck" size={11} color={TOKENS.forest} strokeWidth={2.4}/>
          <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.forest, fontWeight: 700, textTransform: 'uppercase' }}>CADETE</span>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, color: TOKENS.emeraldDeep, textTransform: 'uppercase', marginBottom: 6 }}>
          PASO 03 · TU VEHÍCULO
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, color: TOKENS.ink, letterSpacing: -1, lineHeight: 1 }}>
          ¿Con qué te<br/>movés?
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.inkSoft, lineHeight: 1.45, marginTop: 8, maxWidth: 320 }}>
          Lo usamos para asignarte solo los paquetes que te entren bien.
        </div>
      </div>

      {/* Vehicle type grid — 6 options */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { id: 'walker', name: 'A pie',     sub: '≤ 3 kg',  needsPlate: false, sel: false, draw: 'walker' },
            { id: 'bike',   name: 'Bici',      sub: '≤ 8 kg',  needsPlate: false, sel: false, draw: 'bike' },
            { id: 'moto',   name: 'Moto',      sub: '≤ 25 kg', needsPlate: true,  sel: true,  draw: 'moto' },
            { id: 'car',    name: 'Auto',      sub: '≤ 80 kg', needsPlate: true,  sel: false, draw: 'car' },
            { id: 'van',    name: 'Camioneta', sub: '≤ 300 kg',needsPlate: true,  sel: false, draw: 'van' },
            { id: 'truck',  name: 'Camión',    sub: '≤ 1.5 T', needsPlate: true,  sel: false, draw: 'truck' },
          ].map((v, i) => (
            <div key={i} style={{
              background: v.sel ? TOKENS.forest : TOKENS.card,
              color: v.sel ? '#F4EFE3' : TOKENS.ink,
              border: `1.5px solid ${v.sel ? TOKENS.forest : TOKENS.border}`,
              borderRadius: 14, padding: '12px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              position: 'relative',
              boxShadow: v.sel ? '0 8px 18px -8px rgba(11,59,46,0.4)' : 'none',
            }}>
              <div style={{ color: v.sel ? '#A3E635' : TOKENS.inkSoft, height: 26, display: 'flex', alignItems: 'center' }}>
                <VehicleGlyph type={v.draw} size={26}/>
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 12.5, fontWeight: 600, textAlign: 'center' }}>{v.name}</div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 0.8,
                color: v.sel ? 'rgba(244,239,227,0.6)' : TOKENS.inkMute,
                textTransform: 'uppercase', fontWeight: 700,
              }}>{v.sub}</div>
              {v.sel && (
                <div style={{
                  position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 16,
                  background: '#A3E635', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={10} color={TOKENS.forest} strokeWidth={3.5}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conditional vehicle details (Moto selected) */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14, color: TOKENS.ink, letterSpacing: -0.3 }}>
            Detalles de tu moto
          </div>
          <div style={{ flex: 1, height: 1, background: TOKENS.borderSoft }}/>
        </div>

        {/* Brand + model + license plate */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, background: TOKENS.card, border: `1.5px solid ${TOKENS.forest}`, borderRadius: 14, padding: '11px 12px' }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>MARCA Y MODELO</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 14, color: TOKENS.ink, fontWeight: 600, marginTop: 1 }}>Honda Wave 110</div>
          </div>
        </div>

        {/* License plate big */}
        <div style={{
          background: TOKENS.card, border: `1.5px solid ${TOKENS.forest}`, borderRadius: 14,
          padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.2, color: TOKENS.inkMute, textTransform: 'uppercase' }}>PATENTE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {/* AR plate styled */}
              <div style={{
                background: TOKENS.ink, color: '#F4EFE3',
                padding: '5px 10px', borderRadius: 6, border: `1.5px solid ${TOKENS.ink}`,
                fontFamily: FONTS.mono, fontSize: 16, fontWeight: 700, letterSpacing: 2,
              }}>
                AB 421 XQ
              </div>
            </div>
          </div>
          <button style={{
            background: TOKENS.cardSoft, border: `1px solid ${TOKENS.borderSoft}`,
            color: TOKENS.inkSoft, padding: '8px 10px', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: FONTS.body, fontSize: 12, fontWeight: 600,
          }}>
            <Icon name="camera" size={14} strokeWidth={2}/>
            Foto
          </button>
        </div>

        {/* Capacity sliders */}
        <div style={{
          background: TOKENS.cardSoft, border: `1px dashed ${TOKENS.border}`, borderRadius: 14,
          padding: 14, marginBottom: 10,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, color: TOKENS.inkMute, textTransform: 'uppercase', marginBottom: 10 }}>
            CAPACIDAD QUE PODÉS LLEVAR
          </div>

          {/* Weight */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>Peso máximo</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: TOKENS.ink, letterSpacing: -0.4 }}>
                25 <span style={{ fontSize: 11, color: TOKENS.inkMute, fontWeight: 500 }}>kg</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: 6, background: TOKENS.border, borderRadius: 6 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '32%', background: TOKENS.forest, borderRadius: 6 }}/>
              <div style={{
                position: 'absolute', left: '32%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 20, height: 20, borderRadius: 20,
                background: '#F4EFE3', border: `3px solid ${TOKENS.forest}`,
                boxShadow: '0 2px 6px -2px rgba(0,0,0,0.2)',
              }}/>
            </div>
          </div>

          {/* Volume */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>Volumen</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: TOKENS.ink, letterSpacing: -0.4 }}>
                0.08 <span style={{ fontSize: 11, color: TOKENS.inkMute, fontWeight: 500 }}>m³</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: 6, background: TOKENS.border, borderRadius: 6 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '18%', background: TOKENS.forest, borderRadius: 6 }}/>
              <div style={{
                position: 'absolute', left: '18%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 20, height: 20, borderRadius: 20,
                background: '#F4EFE3', border: `3px solid ${TOKENS.forest}`,
                boxShadow: '0 2px 6px -2px rgba(0,0,0,0.2)',
              }}/>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: TOKENS.inkMute, textTransform: 'uppercase', marginTop: 6 }}>
              ~ MOCHILA / CAJA CHICA
            </div>
          </div>
        </div>

        {/* Optional company name (for B2B / fleet riders) */}
        <div style={{
          background: TOKENS.card, border: `1px dashed ${TOKENS.border}`, borderRadius: 14,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 10,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: TOKENS.cardSoft, border: `1px solid ${TOKENS.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.inkSoft }}>
            <Icon name="store" size={16} strokeWidth={1.8}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>
              ¿Trabajás para una empresa?
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute, marginTop: 1 }}>
              Opcional · Agregá el nombre de tu flota
            </div>
          </div>
          <Icon name="plus" size={18} color={TOKENS.forest} strokeWidth={2.4}/>
        </div>

        {/* Cédula verde upload */}
        <div style={{
          background: TOKENS.card, border: `1.2px solid ${TOKENS.border}`, borderRadius: 14,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 100,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: TOKENS.mint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.forest, flexShrink: 0 }}>
            <Icon name="list" size={18} strokeWidth={1.8}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.ink, fontWeight: 600 }}>
              Cédula verde
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: TOKENS.inkMute, marginTop: 1 }}>
              Subila para empezar a operar
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: TOKENS.amberBg, padding: '3px 7px', borderRadius: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: 5, background: TOKENS.amber }}/>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: '#8E5A0B', fontWeight: 700, textTransform: 'uppercase' }}>PENDIENTE</span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px 28px', background: `linear-gradient(180deg, rgba(244,239,227,0) 0%, ${TOKENS.bg} 30%)`, paddingTop: 30 }}>
        <button style={{
          width: '100%', border: 'none', background: TOKENS.forest, color: '#F4EFE3',
          padding: '16px', borderRadius: 16,
          fontFamily: FONTS.body, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 12px 24px -8px rgba(11,59,46,0.45)',
        }}>
          Finalizar registro
          <Icon name="check" size={18} strokeWidth={2.6}/>
        </button>
      </div>
    </div>
  );
}
window.RegisterStep3Vehicle = RegisterStep3Vehicle;

// Glyph for vehicle types
function VehicleGlyph({ type = 'moto', size = 26 }) {
  const c = { width: size, height: size, viewBox: '0 0 32 32', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'walker':
      return (
        <svg {...c}>
          <circle cx="16" cy="6" r="2.5"/>
          <path d="M 16 9 L 16 18 M 11 14 L 16 11 L 21 16 M 16 18 L 12 26 M 16 18 L 20 24"/>
        </svg>
      );
    case 'bike':
      return (
        <svg {...c}>
          <circle cx="8" cy="22" r="5"/>
          <circle cx="24" cy="22" r="5"/>
          <path d="M 8 22 L 14 12 L 20 12 L 24 22 M 14 12 L 18 6 L 22 6 M 11 12 L 16 12"/>
        </svg>
      );
    case 'moto':
      return (
        <svg {...c}>
          <circle cx="7" cy="22" r="4.5"/>
          <circle cx="25" cy="22" r="4.5"/>
          <path d="M 19 8 L 23 8 L 25 13 M 7 22 L 13 14 L 21 14 L 25 22 M 15 14 L 13 10 L 9 10"/>
        </svg>
      );
    case 'car':
      return (
        <svg {...c}>
          <path d="M 4 18 L 6 11 L 26 11 L 28 18 L 28 23 L 24 23 L 24 21 L 8 21 L 8 23 L 4 23 Z"/>
          <circle cx="10" cy="21" r="2.5"/>
          <circle cx="22" cy="21" r="2.5"/>
          <path d="M 8 11 L 10 7 L 22 7 L 24 11"/>
        </svg>
      );
    case 'van':
      return (
        <svg {...c}>
          <path d="M 3 19 L 3 11 L 18 11 L 18 19 M 18 13 L 24 13 L 28 17 L 28 19 L 18 19"/>
          <circle cx="8" cy="22" r="3"/>
          <circle cx="22" cy="22" r="3"/>
          <line x1="11" y1="13" x2="11" y2="19" opacity="0.4"/>
        </svg>
      );
    case 'truck':
      return (
        <svg {...c}>
          <rect x="3" y="9" width="14" height="11"/>
          <path d="M 17 13 L 22 13 L 28 17 L 28 20 L 17 20"/>
          <circle cx="8" cy="22" r="2.5"/>
          <circle cx="22" cy="22" r="2.5"/>
        </svg>
      );
    default: return null;
  }
}
window.VehicleGlyph = VehicleGlyph;
