import { useState, useCallback } from "react";

export type GeolocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; lat: number; lng: number; accuracy: number }
  | { status: "error"; message: string };

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle" });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", message: "Geolocation not supported" });
      return;
    }
    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "success",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => setState({ status: "error", message: err.message }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { state, locate };
}
