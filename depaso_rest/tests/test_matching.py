"""
Unit tests for the matching algorithm (spec 5.2) using in-memory fake repos.
"""
from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

from src.app.modules.matching.service import (
    DEFAULT_WEIGHTS,
    MAX_DETOUR_RATIO_COLLABORATIVE,
    MatchingService,
    cargo_compatible,
    geo_score_dedicated,
    time_window_score,
)
from src.app.shared.exceptions import NotFoundError
from src.app.shared.geo import Point

# AMBA reference coordinates
CABALLITO = (-34.6186, -58.4399)
MICROCENTRO = (-34.6037, -58.3816)
QUILMES = (-34.7203, -58.2542)
LA_PLATA = (-34.9215, -57.9545)


# --- fakes -------------------------------------------------------------------

class FakeRepo:
    """Fakes async: la interfaz real de los repos ahora es awaitable."""
    def __init__(self, items):
        self._items = {i.id: i for i in items}

    async def get_by_id(self, entity_id):
        return self._items.get(entity_id)

    async def get_by_ids(self, entity_ids):
        return {i: self._items[i] for i in entity_ids if i in self._items}

    async def list_available_with_location(self, min_capacity_kg):
        return [c for c in self._items.values() if c.capacity_kg >= min_capacity_kg]

    async def list_active_in_window(self, at=None):
        return list(self._items.values())

    async def list_pending(self):
        return list(self._items.values())

    async def list_active_by_carrier(self, carrier_id):
        return []


def make_carrier(id=1, vehicle_type="car", lat=None, lon=None, **kw):
    return SimpleNamespace(
        id=id,
        company_name=f"Carrier {id}",
        vehicle_type=vehicle_type,
        license_plate=f"AB{id:03d}CD",
        capacity_kg=kw.get("capacity_kg", 100.0),
        reputation=kw.get("reputation", 4.5),
        is_active=kw.get("is_active", True),
        is_verified=kw.get("is_verified", True),
        is_available=True,
        current_lat=lat,
        current_lon=lon,
    )


def make_shipment(id=1, modality="dedicated", package_size="m",
                  origin=CABALLITO, destination=MICROCENTRO, weight_kg=5.0,
                  assignment_mode="on_demand"):
    return SimpleNamespace(
        id=id,
        modality=modality,
        assignment_mode=assignment_mode,
        package_size=package_size,
        origin_lat=origin[0], origin_lon=origin[1],
        destination_lat=destination[0], destination_lon=destination[1],
        weight_kg=weight_kg,
        # Campos que consume el feed al armar el FeedItemResponse.
        estimated_price=1000.0, photo_url=None, description=None, declared_value=None,
    )


def make_route(id=1, carrier_id=1, origin=CABALLITO, destination=MICROCENTRO,
               kind="collaborative_route", hours=2,
               window_start=None, window_end=None):
    now = datetime.utcnow()
    return SimpleNamespace(
        id=id, carrier_id=carrier_id, kind=kind,
        origin_lat=origin[0], origin_lon=origin[1],
        destination_lat=destination[0], destination_lon=destination[1],
        window_start=window_start if window_start is not None else now - timedelta(hours=1),
        window_end=window_end if window_end is not None else now + timedelta(hours=hours),
        recurrence_days=None, is_active=True,
    )


def make_service(carriers, shipments, routes=()):
    return MatchingService(
        shipment_repo=FakeRepo(shipments),
        carrier_repo=FakeRepo(carriers),
        route_repo=FakeRepo(list(routes)),
    )


# --- pure component tests ------------------------------------------------------

def test_cargo_compatibility_table():
    assert cargo_compatible("pedestrian", "s")     # 4 categorías: peatón lleva S
    assert not cargo_compatible("pedestrian", "m")
    assert cargo_compatible("motorcycle", "m")
    assert not cargo_compatible("motorcycle", "l")
    assert not cargo_compatible("car", "xl")
    assert cargo_compatible("truck", "xl")


def test_time_window_score_inside_and_decay():
    now = datetime.utcnow()
    assert time_window_score(now - timedelta(hours=1), now + timedelta(hours=1), now) == 1.0
    far = time_window_score(now + timedelta(hours=10), now + timedelta(hours=12), now)
    assert far == 0.0


def test_geo_score_dedicated_unknown_position_is_neutral():
    assert geo_score_dedicated(None, Point(*CABALLITO)) == 0.5


def test_weights_sum_to_one():
    assert abs(sum(DEFAULT_WEIGHTS.values()) - 1.0) < 1e-9


# --- dedicated matching ----------------------------------------------------------

async def test_dedicated_ranks_closer_carrier_first():
    near = make_carrier(id=1, lat=CABALLITO[0], lon=CABALLITO[1])
    far = make_carrier(id=2, lat=LA_PLATA[0], lon=LA_PLATA[1])
    shipment = make_shipment(modality="dedicated")
    service = make_service([near, far], [shipment])

    ranked = await service.rank_carriers(1)
    assert [r.carrier_id for r in ranked] == [1, 2]
    assert ranked[0].eta_to_pickup_min is not None


async def test_dedicated_knockout_incompatible_vehicle():
    moto = make_carrier(id=1, vehicle_type="motorcycle", lat=CABALLITO[0], lon=CABALLITO[1])
    shipment = make_shipment(package_size="l")  # L doesn't fit a motorcycle
    service = make_service([moto], [shipment])
    assert await service.rank_carriers(1) == []


async def test_xl_requires_van_or_truck():
    car = make_carrier(id=1, vehicle_type="car", lat=CABALLITO[0], lon=CABALLITO[1])
    truck = make_carrier(id=2, vehicle_type="truck", lat=CABALLITO[0], lon=CABALLITO[1])
    shipment = make_shipment(package_size="xl", modality="dedicated")
    service = make_service([car, truck], [shipment])
    ranked = await service.rank_carriers(1)
    assert [r.carrier_id for r in ranked] == [2]


# --- collaborative matching --------------------------------------------------------

async def test_collaborative_accepts_on_route_shipment():
    carrier = make_carrier(id=1)
    route = make_route(carrier_id=1, origin=CABALLITO, destination=MICROCENTRO)
    shipment = make_shipment(modality="collaborative",
                             origin=CABALLITO, destination=MICROCENTRO)
    service = make_service([carrier], [shipment], [route])

    ranked = await service.rank_carriers(1)
    assert len(ranked) == 1
    assert ranked[0].detour_ratio <= MAX_DETOUR_RATIO_COLLABORATIVE
    assert ranked[0].route_id == route.id
    assert ranked[0].explanation  # auditable assignment


async def test_collaborative_hard_filter_excessive_detour():
    # Route within CABA, shipment toward La Plata -> detour far above 15%
    carrier = make_carrier(id=1)
    route = make_route(carrier_id=1, origin=CABALLITO, destination=MICROCENTRO)
    shipment = make_shipment(modality="collaborative",
                             origin=QUILMES, destination=LA_PLATA)
    service = make_service([carrier], [shipment], [route])
    assert await service.rank_carriers(1) == []


async def test_collaborative_never_assigns_xl():
    carrier = make_carrier(id=1, vehicle_type="truck")
    route = make_route(carrier_id=1)
    shipment = make_shipment(modality="collaborative", package_size="xl")
    service = make_service([carrier], [shipment], [route])
    assert await service.rank_carriers(1) == []


async def test_collaborative_soft_mobility_distance_limit():
    # Caballito -> Microcentro is > 5 km road: bikes are excluded
    biker = make_carrier(id=1, vehicle_type="bike")
    route = make_route(carrier_id=1)
    shipment = make_shipment(modality="collaborative", package_size="s", weight_kg=0.5)
    service = make_service([biker], [shipment], [route])
    assert await service.rank_carriers(1) == []


async def test_match_best_returns_ranked_list():
    near = make_carrier(id=1, lat=CABALLITO[0], lon=CABALLITO[1])
    far = make_carrier(id=2, lat=QUILMES[0], lon=QUILMES[1])
    shipment = make_shipment(modality="dedicated")
    service = make_service([near, far], [shipment])

    result = await service.match_best(1)
    assert result.matched_carrier_id == 1
    assert len(result.ranked_carriers) == 2
    assert result.modality == "dedicated"


async def test_match_best_raises_when_no_candidates():
    shipment = make_shipment(modality="dedicated")
    service = make_service([], [shipment])
    with pytest.raises(NotFoundError):
        await service.match_best(1)


# --- feed: lead time de la ventana dedicada (turno en zona anticipado) --------

async def test_feed_shows_by_availability_when_window_starts_within_lead():
    """Un turno dedicado que empieza dentro de WINDOW_FEED_LEAD_MIN ya acerca
    al carrier los pedidos 'Hoy' (dedicated + by_availability) — arranca la
    ventana con la agenda armada (MODALIDADES.md §3.2)."""
    now = datetime.utcnow()
    carrier = make_carrier(id=1)
    window = make_route(id=1, carrier_id=1, kind="dedicated_window",
                        window_start=now + timedelta(minutes=15),
                        window_end=now + timedelta(hours=4))
    shipment = make_shipment(id=1, modality="dedicated",
                             assignment_mode="by_availability")
    service = make_service([carrier], [shipment], [window])

    feed = await service.feed_for_carrier(1)
    assert [i.shipment_id for i in feed] == [1]


async def test_feed_hides_by_availability_when_window_far_in_future():
    """Con la ventana empezando en 3+ horas (fuera del lead), el pedido
    by_availability todavía NO aparece en el feed."""
    now = datetime.utcnow()
    carrier = make_carrier(id=1)
    window = make_route(id=1, carrier_id=1, kind="dedicated_window",
                        window_start=now + timedelta(hours=3),
                        window_end=now + timedelta(hours=7))
    shipment = make_shipment(id=1, modality="dedicated",
                             assignment_mode="by_availability")
    service = make_service([carrier], [shipment], [window])

    assert await service.feed_for_carrier(1) == []


async def test_count_compatible_routes_ignores_future_collaborative_route():
    """La señal 'De paso' cuenta solo trayectorias VIVAS: una colaborativa que
    empieza más tarde no debe sumar (no-regresión del lead dedicado)."""
    now = datetime.utcnow()
    future = make_route(id=1, carrier_id=1, kind="collaborative_route",
                        window_start=now + timedelta(minutes=15),
                        window_end=now + timedelta(hours=4))
    service = make_service([], [], [future])

    count = await service.count_compatible_routes(Point(*CABALLITO), Point(*MICROCENTRO))
    assert count == 0
