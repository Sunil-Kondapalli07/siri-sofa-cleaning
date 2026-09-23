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

export async function requestAndSaveCurrentLocation(): Promise<SavedLocation | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    throw new Error("Location is not supported by this browser.");
  }

  try {
    const permissions = (navigator as Navigator & {
      permissions?: Permissions;
    }).permissions;
    if (permissions?.query) {
      const permission = await permissions.query({ name: "geolocation" as PermissionName });
      if (permission.state === "denied") {
        throw new Error(
          "Location permission is blocked for this site. Open your browser site settings, allow Location, and try again."
        );
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Location permission")) {
      throw error;
    }
    // Some browsers do not expose the Permissions API. Geolocation below is authoritative.
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  }).catch((error: GeolocationPositionError) => {
    throw new Error(locationErrorMessage(error));
  });

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  // Save coordinates immediately so a reverse-geocoding failure cannot make the
  // location button appear to do nothing.
  const result: SavedLocation = {
    latitude,
    longitude,
    captured_at: new Date().toISOString(),
  };
  localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(result));

  // Address lookup is best-effort. The booking flow can still use the coordinates
  // even if the free geocoder is temporarily unavailable.
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`,
        {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        }
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
        result.city = address.city || address.town || address.village || "";
        result.pincode = address.postcode || "";
        localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(result));
      }
    } finally {
      window.clearTimeout(timeout);
    }
  } catch {
    // Keep the coordinates; manual address entry remains available.
  }

  return result;
}

export function clearSavedLocation() {
  if (typeof window !== "undefined") localStorage.removeItem(SAVED_LOCATION_KEY);
}
