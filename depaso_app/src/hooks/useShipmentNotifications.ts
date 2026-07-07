import { useEffect, useRef } from "react";

import { useAuthStore } from "../stores";
import { carriersService } from "../services/carriers";
import { shipmentsService } from "../services/shipments";
import { ensureNotificationSetup, notifyLocal } from "../services/notifications";
import { Shipment, ShipmentStatus, UserType } from "../types";

const POLL_MS = 20_000;

// Copy shown to the client (sender) when their shipment reaches a new state.
// Clients don't drive these transitions (the carrier does), so the notification
// is genuinely informative.
const CLIENT_MESSAGES: Partial<Record<ShipmentStatus, { title: string; body: (id: number) => string }>> = {
  [ShipmentStatus.ASSIGNED]:       { title: "¡Cadete asignado!",   body: (id) => `Un cadete tomó tu envío #${id} y va en camino.` },
  [ShipmentStatus.PICKUP_ARRIVED]: { title: "Cadete en el retiro",  body: (id) => `El cadete llegó a retirar tu envío #${id}.` },
  [ShipmentStatus.IN_TRANSIT]:     { title: "Envío en camino",      body: (id) => `Tu envío #${id} va hacia el destino.` },
  [ShipmentStatus.DELIVERED]:      { title: "¡Entregado!",          body: (id) => `Tu envío #${id} llegó a destino. Calificá al cadete.` },
  [ShipmentStatus.CANCELLED]:      { title: "Envío cancelado",      body: (id) => `Tu envío #${id} fue cancelado.` },
};

/**
 * Watches the current user's shipments and fires local notifications on change.
 * - Client: a notification for every status change on their shipments.
 * - Carrier: a notification when new compatible offers appear in the feed.
 *
 * Mounted once in the (main) layout so it runs across tabs while logged in.
 */
export function useShipmentNotifications() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const statusRef = useRef<Map<number, ShipmentStatus>>(new Map());
  const seenOffersRef = useRef<Set<number>>(new Set());
  const primedRef = useRef(false); // skip notifications on the first (baseline) load

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let active = true;
    const isCarrier = user.user_type === UserType.CARRIER;
    // Admins get no shipment notifications.
    if (user.user_type === UserType.ADMIN) return;

    statusRef.current.clear();
    seenOffersRef.current.clear();
    primedRef.current = false;

    ensureNotificationSetup();

    const diffClientShipments = (shipments: Shipment[]) => {
      for (const s of shipments) {
        const prev = statusRef.current.get(s.id);
        if (primedRef.current && prev !== undefined && prev !== s.status) {
          const msg = CLIENT_MESSAGES[s.status];
          if (msg) notifyLocal(msg.title, msg.body(s.id));
        }
        statusRef.current.set(s.id, s.status);
      }
    };

    const poll = async () => {
      try {
        if (isCarrier) {
          const feed = await carriersService.getFeed().catch(() => []);
          if (!active) return;
          if (primedRef.current) {
            const fresh = feed.filter((f) => !seenOffersRef.current.has(f.shipment_id));
            if (fresh.length > 0) {
              notifyLocal(
                "Nueva oferta cerca",
                fresh.length === 1
                  ? "Tenés un pedido que te queda de paso."
                  : `Tenés ${fresh.length} pedidos que te quedan de paso.`,
              );
            }
          }
          feed.forEach((f) => seenOffersRef.current.add(f.shipment_id));
        } else {
          const mine = await shipmentsService.getMyShipments(0, 50).catch(() => []);
          if (!active) return;
          diffClientShipments(mine);
        }
        primedRef.current = true;
      } catch {
        // best-effort; a failed poll just skips this tick
      }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);
}
