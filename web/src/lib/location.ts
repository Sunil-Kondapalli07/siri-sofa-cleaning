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

async function reverseGeocode(latitude: number, longitude: number): Promise<Partial<SavedLocation>> {
  const response = await fetch(
    `/api/location/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
    { headers: { Accept: "application/json" }, cache: "no-store" }
  );

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || "Address lookup is temporarily unavailable.");
  }

  return {
    display_name: data.display_name || "",
    house_flat: data.house_flat || "",
    street: data.street || "",
    area: data.area || "",
    city: data.city || "",
    pincode: data.pincode || "",
  };
}

export async function enrichSavedLocation(saved: SavedLocation | null = getSavedLocation()): Promise<SavedLocation | null> {
  if (!saved) return null;

  // Do not call the geocoder when we already have useful address data.
  if (saved.street || saved.area || saved.pincode || saved.display_name) {
    return saved;
  }

  try {
    const address = await reverseGeocode(saved.latitude, saved.longitude);
    const enriched = { ...saved, ...address };
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(enriched));
    window.dispatchEvent(new CustomEvent("siri-location-updated"));
    return enriched;
  } catch {
    return saved;
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

  // GPS is useful even when address enrichment is temporarily unavailable.
  localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(result));
  window.dispatchEvent(new CustomEvent("siri-location-updated"));

  try {
    const address = await reverseGeocode(result.latitude, result.longitude);
    const enriched = { ...result, ...address };
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(enriched));
    window.dispatchEvent(new CustomEvent("siri-location-updated"));
    return enriched;
  } catch {
    // Keep the verified coordinates and let the customer enter the missing
    // human-readable address fields manually.
    return result;
  }
}

export function clearSavedLocation() {
  if (typeof window !== "undefined") localStorage.removeItem(SAVED_LOCATION_KEY);
}
