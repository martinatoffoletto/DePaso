# DePaso — Mejoras disruptivas (visión + CO₂)

Documento de diseño de dos mejoras que refuerzan lo diferencial de DePaso, pensadas para un MVP
(no buscan completitud, sino subir el impacto sin contradecir el alcance ni la tesis). Se
implementan después de este documento.

Contexto: la clasificación por foto en 4 categorías es útil pero no impresiona por sí sola —y la
propia tesis (Naumann et al.) la justifica como la opción viable frente al 3D—. El núcleo
realmente disruptivo de DePaso es el **modelo colaborativo + CO₂ por envío + desvío como
restricción dura** (§2.2.5). Estas dos mejoras (1) suben el techo de la visión sin salirse de lo
defendible y (2) hacen del CO₂ un protagonista visible en todo el recorrido, no solo en su
pantalla.

---

## Mejora 1 — Dimensionado por objeto de referencia

### Qué es
Además de clasificar la foto en `s|m|l|xl`, permitir estimar las **dimensiones reales aproximadas**
del paquete usando un **objeto de escala conocida** en la misma foto (una tarjeta, una hoja A4).
El usuario marca en la imagen cuánto mide el objeto de referencia y el contorno del paquete, y la
app calcula centímetros a partir de la relación de píxeles.

### Por qué es defendible (y no contradice la tesis)
La tesis (§2.2.2, Naumann et al.) argumenta que estimar **volumen exacto** requiere sensores 3D
(RGB-D) y es inviable en un celular, y por eso DePaso clasifica en categorías. Esta mejora **no
contradice** ese argumento: no reconstruye 3D ni pretende exactitud milimétrica. Es
**fotogrametría monocular por escala conocida** (*scale-from-reference*), una técnica clásica y
liviana: con un objeto de tamaño conocido en la escena, la relación de píxeles da una estimación
2D razonable de la cara visible del paquete. Se posiciona como **asistencia** a la categorización,
no como medición certificada.

### Insight técnico clave
No hace falta conocer la resolución real de la foto ni calibrar la cámara. Tanto la referencia
como el paquete se miden **en las mismas coordenadas de pantalla**, así que la relación
`cm_por_píxel = tamaño_real_referencia / píxeles_referencia` se aplica directo al paquete y la
escala se cancela. Esto lo hace robusto y simple.

```
escala (cm/px) = medida_real_referencia_cm / distancia_en_pantalla_referencia_px
ancho_paquete_cm  = ancho_paquete_px  × escala
alto_paquete_cm   = alto_paquete_px   × escala
categoría_sugerida = bucket(max(ancho_cm, alto_cm))
```

### Objetos de referencia soportados
| Referencia | Medida real | Por qué |
|---|---|---|
| Tarjeta (débito/crédito/SUBE) | **8,56 cm** (lado largo, estándar ISO/IEC 7810 ID-1) | Todo el mundo tiene una; medida universal y exacta |
| Hoja A4 | **29,7 cm** (lado largo) | Común en oficinas/comercios; medida estándar |
| Personalizado | el usuario ingresa los cm | Para cualquier objeto de tamaño conocido |

### Flujo de usuario
1. Después de la foto, botón **"Medir con referencia"** (opcional, junto a la clasificación IA).
2. Elige el objeto de referencia (o ingresa cm).
3. Sobre la foto, arrastra **2 puntos** para marcar el largo de la referencia.
4. Arrastra **2 puntos** (esquinas) para encuadrar el paquete.
5. La app muestra en vivo **≈ ancho × alto cm** y la **categoría sugerida**.
6. "Usar esta estimación" → preselecciona la categoría (siempre editable a mano).

### Buckets de categoría por dimensión mayor (heurística documentada)
| Categoría | Dimensión mayor estimada |
|---|---|
| `s` — pequeño / documentos | ≤ 35 cm |
| `m` — mediano | 35–60 cm |
| `l` — grande / voluminoso | 60–100 cm |
| `xl` — mudanza / flete | > 100 cm |

### Limitación honesta (va a la tesis)
Es una estimación **2D de la cara visible**: no infiere la profundidad (3ª dimensión) de una sola
foto. Sirve para orientar la categoría, no para cotización volumétrica exacta. Esta limitación es
coherente con la posición de la tesis y se documenta como tal.

### Aporte a la tesis
- Fortalece el **objetivo específico 1** (visión): pasa de "clasifico en un bucket" a "estimo el
  tamaño real y sugiero la categoría".
- Responde al **hallazgo 4** de la encuesta ("mostrar la categoría y permitir corrección de la
  categoría **y de las medidas**"): ahora las medidas son parte del flujo.
- Da uso real al flag `has_reference_object` que ya existe en el modelo de visión.

### Diseño técnico
- `src/utils/dimensioning.ts` — funciones **puras y testeables**: escala, dimensiones, bucket de
  categoría, catálogo de referencias.
- `src/features/sender/send-flow/DimensioningModal.tsx` — pantalla interactiva (puntos arrastrables
  con `PanResponder`, sin dependencias nuevas). Devuelve `{ category, widthCm, heightCm }`.
- Integración en `PackageScreen`: botón secundario que abre el modal y, al confirmar, preselecciona
  la categoría.

---

## Mejora 2 — CO₂ como protagonista (en todo el recorrido)

### Qué ya existe
La pantalla **Impacto** ya muestra el CO₂ acumulado con equivalencias cotidianas (km en auto,
meses de absorción de un árbol, cargas de celular), calculadas por el backend con factores IPCC.

### Qué falta (y qué agregamos)
Hoy el CO₂ solo "aparece" en su propia pantalla. La tesis (§2.2.5, pto 4) promete el CO₂ como
**feedback al usuario al completar cada operación**. La mejora es hacerlo **protagonista en los
momentos clave del envío**, con una equivalencia relatable en vez de un número seco:

1. **Al confirmar el envío** (`SummaryScreen`): la card de CO₂ pasa de "evitás 1,8 kg CO₂" a
   "evitás 1,8 kg CO₂ **≈ 10 km en auto no recorridos**".
2. **Al entregar** (`ShipmentsScreen`, card del envío entregado): "Ahorraste 1,8 kg de CO₂" suma la
   equivalencia y un tono celebratorio.

### Factores (consistentes con el backend, documentados)
Mismos factores que usa el backend, para que el per-envío y el acumulado coincidan:
- Auto promedio: **0,18 kg CO₂/km** → `km = kg / 0,18`
- Árbol urbano: **21 kg CO₂/año** (FAO/EPA) → `meses = kg / 21 × 12`
- Carga de celular: **8 g CO₂** (EPA) → `cargas = kg / 0,008`

Se mueve la conversión a un util compartido del frontend (`src/utils/co2.ts`) para el per-envío;
el acumulado sigue viniendo del backend. La equivalencia estrella para montos chicos es
**km en auto** (la más intuitiva).

### Aporte a la tesis
- Materializa literalmente el diferencial 4 de tu §2.2.5: "cálculo en tiempo real de CO₂ ahorrado
  por envío... como feedback al usuario al completar cada operación".
- Convierte el impacto ambiental en algo **visible y acumulable** en cada interacción, no en una
  métrica escondida.

### Diseño técnico
- `src/utils/co2.ts` — conversiones puras (km en auto, etc.), con los factores documentados.
- Editar `SummaryScreen` (card CO₂) y `ShipmentsScreen` (card entregado) para mostrar la
  equivalencia. Sin cambios de backend.

---

## Qué NO se hace (fuera de alcance, por decisión)
- Reconstrucción 3D / medición volumétrica exacta (contradice la tesis).
- Precios dinámicos / subastas (la tesis los descarta por falta de datos al arranque, §2.1.4).
- Detección automática del objeto de referencia por ML (el marcado manual es suficiente y más
  robusto para el MVP; la detección automática queda como trabajo futuro).
