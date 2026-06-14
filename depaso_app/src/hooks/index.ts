import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { useAuthStore } from "../stores";

export const useAuth = () => {
  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    restoreToken,
  } = useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    restoreToken,
  };
};

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access location was denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error getting location");
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number,
  ) => {
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      return geocode[0]
        ? `${geocode[0].street}, ${geocode[0].city}`
        : `${latitude}, ${longitude}`;
    } catch {
      return `${latitude}, ${longitude}`;
    }
  };

  return {
    location,
    loading,
    error,
    requestLocation,
    getAddressFromCoordinates,
  };
};

export const useAppLifecycle = () => {
  const { restoreToken } = useAuthStore();

  useEffect(() => {
    // Restore auth token on app startup
    restoreToken();
  }, [restoreToken]);
};
