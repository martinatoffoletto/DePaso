import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { trackingService } from "@/src/shared/api/carriers";

/**
 * While `active`, broadcasts the carrier's GPS position every 20 s (RF-TRK-01).
 * Silently no-ops if location permission is denied.
 */
export function useGpsPublisher(active: boolean) {
  const watcher = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function publishOnce() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) await trackingService.publishPosition(pos.coords.latitude, pos.coords.longitude);
      } catch {
        // location unavailable — skip this tick
      }
    }

    publishOnce();
    watcher.current = setInterval(publishOnce, 20_000);
    return () => {
      cancelled = true;
      if (watcher.current) clearInterval(watcher.current);
    };
  }, [active]);
}
