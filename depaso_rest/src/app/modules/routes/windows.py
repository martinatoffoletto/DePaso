"""
Ventanas efectivas de rutas publicadas (RF-CAR-01/02).

Una ruta habitual se guarda con una ventana de referencia (la próxima
ocurrencia al publicar) + recurrence_days. Sin este módulo, la ruta "moría"
al expirar esa primera ventana y la recurrencia era solo decorativa: el
matching filtraba window_end >= now y nunca volvía a ofrecerla.

Nota de alcance (MVP): la comparación de día/hora se hace en UTC naive (como
todo lo guardado). Una ventana que cruza la medianoche UTC (21:00-00:00 ART)
puede correrse de día de semana; documentado como limitación.
"""
from datetime import datetime, timedelta

WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


def effective_window(route, at: datetime) -> tuple[datetime, datetime] | None:
    """Ventana vigente de la ruta en el instante `at` (naive UTC).

    - Ventana literal que contiene `at` -> esa.
    - Ruta recurrente y `at` cae en un día habilitado -> la ocurrencia de HOY
      con el mismo horario que la ventana de referencia.
    - Ventana literal todavía futura -> esa (el scoring temporal decae solo).
    - Nada de lo anterior -> None (la ruta no aplica).
    """
    if route.window_start <= at <= route.window_end:
        return route.window_start, route.window_end

    if route.recurrence_days:
        days = {d.strip().lower() for d in route.recurrence_days.split(",") if d.strip()}
        duration = route.window_end - route.window_start

        def _occurrence(day) -> tuple[datetime, datetime] | None:
            if WEEKDAYS[day.weekday()] not in days or day < route.window_start.date():
                return None
            start = datetime.combine(day, route.window_start.time())
            return start, start + duration

        # La ocurrencia de ayer puede seguir vigente si cruza la medianoche.
        for offset in (1, 0):
            occ = _occurrence(at.date() - timedelta(days=offset))
            if occ and occ[0] <= at <= occ[1]:
                return occ
        # Ocurrencia de hoy aún no iniciada: la devuelve para que el scoring
        # temporal decaiga solo (el feed la descarta con window_contains).
        occ = _occurrence(at.date())
        if occ:
            return occ

    if at <= route.window_end:
        return route.window_start, route.window_end
    return None


def window_contains(route, at: datetime) -> bool:
    """True si la ruta está operativa AHORA (ventana efectiva contiene `at`).
    Es el criterio del feed: una oferta es para llevar ya, no para la ventana
    de mañana."""
    w = effective_window(route, at)
    return w is not None and w[0] <= at <= w[1]


def window_starts_within(route, at: datetime, lead_minutes: int) -> bool:
    """True si la ventana efectiva ya contiene `at` o empieza dentro de los
    próximos `lead_minutes` (y todavía no terminó).

    Es un criterio de feed más laxo que `window_contains`, pensado SOLO para las
    ventanas dedicadas (`dedicated_window`): el transportista que publicó un
    turno lo empieza a ver poblado con la agenda unos minutos antes de arrancar
    (MODALIDADES.md §3.2, "minutos antes de la ventana ya ve la agenda"). El
    camino colaborativo NO debe usar esto: una trayectoria futura no está viva
    y no puede llevar nada ahora (sigue con `window_contains`)."""
    w = effective_window(route, at)
    if w is None:
        return False
    start, end = w
    return at <= end and start <= at + timedelta(minutes=lead_minutes)
