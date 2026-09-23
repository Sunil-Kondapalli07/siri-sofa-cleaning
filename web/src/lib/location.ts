export interface SavedLocation {
  latitude: number;
  longitude: number;
  display_name?: string;
  house_flat?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  captured_at: string;
}

export const SAVED_LOCATION_KEY = "siri_saved_location";

export function getSavedLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVED_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.latitude !== "number" ||
      typeof parsed?.longitude !== "number"
    ) return null;
    return parsed as SavedLocation;
  } catch {
    return null;
  }
}

function locationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was blocked. Please allow Location for this site in your browser settings, then try again.";
    case error.POSITION_UNAVAILABLE:
      return "Your device could not determine your location. Check GPS/Wi-Fi access and try again.";
    case error.TIMEOUT:
      return "Location detection timed out. Please try again or enter the address manually.";
    default:
      return "Unable to detect your location. Please try again or enter the address manually.";
  }
}

export async function requestAndSaveCurrentLocation(): Promise<SavedLocation> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    throw new Error("Location is not supported by this browser.");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }).catch((error: GeolocationPositionError) => {
    throw new Error(locationErrorMessage(error));
  });

  const result: SavedLocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    captured_at: new Date().toISOString(),
  };

  // Persist coordinates immediately. Address enrichment is separate so a
  // temporary geocoder failure never loses the customer's current location.
  localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(result));
  window.dispatchEvent(new CustomEvent("siri-location-updated"));

  try {
    const response = await fetch(
      `/api/location/reverse?lat=${encodeURIComponent(result.latitude)}&lon=${encodeURIComponent(result.longitude)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (response.ok) {
      const data = await response.json();
      Object.assign(result, {
        display_name: data?.display_name || "",
        house_flat: data?.house_flat || "",
        street: data?.street || "",
        area: data?.area || "",
        city: data?.city || "",
        pincode: data?.pincode || "",
      });
      localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(result));
      window.dispatchEvent(new CustomEvent("siri-location-updated"));
    }
  } catch {
    // Keep coordinates; the customer can still enter/edit the address manually.
  }

  return result;
}
export function clearSavedLocation() {
  if (typeof window !== "undefined") localStorage.removeItem(SAVED_LOCATION_KEY);
}
