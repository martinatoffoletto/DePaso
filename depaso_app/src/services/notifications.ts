import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Local notifications for shipment events. The survey (n=145) ranked delays,
 * lack of tracking and schedule coordination as the top pain points; a local
 * notification on each status change addresses that without any push backend —
 * it fires from the client when the polling loop detects a change.
 */

let configured = false;
let permissionGranted = false;

// Show alerts even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Ask for permission once and set up the Android channel. Safe to call repeatedly. */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (configured) return permissionGranted;
  configured = true;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("shipments", {
        name: "Envíos",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    permissionGranted = status === "granted";
  } catch {
    permissionGranted = false;
  }
  return permissionGranted;
}

/** Fire a local notification immediately (no-op if permission was denied). */
export async function notifyLocal(title: string, body: string): Promise<void> {
  if (!permissionGranted) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // deliver now
    });
  } catch {
    // best-effort: never let a notification failure break the app
  }
}
