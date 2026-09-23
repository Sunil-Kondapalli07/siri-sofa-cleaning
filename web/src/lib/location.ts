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
  address_source?: "bigdatacloud" | "openstreetmap";
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
      return "Location permission is blocked. Allow Location for this site in Safari settings and try again.";
    case error.POSITION_UNAVAILABLE:
      return "Your device could not determine your location. Check Wi-Fi/GPS access and try again.";
    case error.TIMEOUT:
      return "Location detection timed out. Please try again.";
    default:
      return "Unable to detect your current location. Please try again.";
  }
}

async function lookupLocalityWithBigDataCloud(
  latitude: number,
  longitude: number
): Promise<Partial<SavedLocation>> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`BigDataCloud returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const city = data?.city || data?.locality || "";
  const locality = data?.locality || data?.city || "";

  return {
    area: locality,
    city,
    pincode: data?.postcode || "",
    display_name: [locality, city, data?.principalSubdivision, data?.postcode]
      .filter(Boolean)
      .join(", "),
    address_source: "bigdatacloud",
  };
}

async function lookupStreetWithOpenStreetMap(
  latitude: number,
  longitude: number
): Promise<Partial<SavedLocation>> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const address = data?.address || {};

  return {
    display_name: data?.display_name || "",
    house_flat: address?.house_number || "",
    street: address?.road || address?.neighbourhood || "",
    area:
      address?.suburb ||
      address?.neighbourhood ||
      address?.city_district ||
      address?.city ||
      address?.town ||
      "",
    city: address?.city || address?.town || address?.village || "",
    pincode: address?.postcode || "",
    address_source: "openstreetmap",
  };
}

async function reverseGeocodeCurrentLocation(
  latitude: number,
  longitude: number
): Promise<Partial<SavedLocation>> {
  const results = await Promise.allSettled([
    lookupLocalityWithBigDataCloud(latitude, longitude),
    lookupStreetWithOpenStreetMap(latitude, longitude),
  ]);

  const bigData = results[0].status === "fulfilled" ? results[0].value : {};
  const osm = results[1].status === "fulfilled" ? results[1].value : {};

  const merged: Partial<SavedLocation> = {
    ...bigData,
    ...osm,
    area: osm.area || bigData.area || "",
    city: osm.city || bigData.city || "",
    pincode: osm.pincode || bigData.pincode || "",
    display_name: osm.display_name || bigData.display_name || "",
    address_source: osm.street || osm.display_name ? "openstreetmap" : "bigdatacloud",
  };

  if (!merged.area && !merged.city && !merged.pincode && !merged.street) {
    throw new Error("Address lookup did not return a usable locality.");
  }

  return merged;
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

  const base: SavedLocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    captured_at: new Date().toISOString(),
  };

  // Resolve the fresh, consented GPS position directly from the browser.
  // The free BigDataCloud endpoint is client-side only and needs no API key.
  let address: Partial<SavedLocation> = {};
  try {
    address = await reverseGeocodeCurrentLocation(base.latitude, base.longitude);
  } catch {
    // GPS still remains valid even if address services are temporarily unavailable.
  }

  const result: SavedLocation = { ...base, ...address };
  localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(result));
  window.dispatchEvent(new CustomEvent("siri-location-updated"));
  return result;
}

export function clearSavedLocation() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SAVED_LOCATION_KEY);
    window.dispatchEvent(new CustomEvent("siri-location-updated"));
  }
}
