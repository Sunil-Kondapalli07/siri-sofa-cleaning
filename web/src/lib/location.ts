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

export async function requestAndSaveCurrentLocation(): Promise<SavedLocation | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return null;

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    });
  });

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const result: SavedLocation = {
    latitude,
    longitude,
    captured_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`,
      { headers: { Accept: "application/json" } }
    );
    if (response.ok) {
      const data = await response.json();
      const address = data?.address || {};
      result.display_name = data?.display_name;
      result.house_flat = address.house_number || "";
      result.street = address.road || address.neighbourhood || "";
      result.area =
        address.suburb ||
        address.neighbourhood ||
        address.city_district ||
        address.city ||
        "";
      result.city = address.city || address.town || address.village || "Hyderabad";
      result.pincode = address.postcode || "";
    }
  } catch {
    // Coordinates are still useful if reverse geocoding is unavailable.
  }

  localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(result));
  return result;
}

export function clearSavedLocation() {
  if (typeof window !== "undefined") localStorage.removeItem(SAVED_LOCATION_KEY);
}
