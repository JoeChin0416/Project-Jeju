export function buildPlaceSearchQuery(...parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

export function buildGoogleMapsSearchUrl(...parts) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildPlaceSearchQuery(...parts))}`;
}

export function buildNaverMapSearchUrl(...parts) {
  return `https://map.naver.com/p/search/${encodeURIComponent(buildPlaceSearchQuery(...parts))}`;
}

export function buildMapProviderUrls(item = {}, fallbackParts = []) {
  const fallback = Array.isArray(fallbackParts) ? fallbackParts : [fallbackParts];
  const naverFallback = buildNaverFallbackQuery(item, fallback);
  return {
    google: buildGoogleMapsSearchUrl(item.googleMapQuery || item.mapSearchQuery || buildPlaceSearchQuery(...fallback)),
    naver: normalizeExternalMapUrl(item.naverMapUrl) || buildNaverMapSearchUrl(item.naverMapQuery || item.mapSearchQuery || naverFallback),
  };
}

function buildNaverFallbackQuery(item, fallback) {
  return buildPlaceSearchQuery(
    item.address,
    item.pickupAddress,
    item.parkingLocation,
    item.returnLocation,
  ) || buildPlaceSearchQuery(...fallback);
}

function normalizeExternalMapUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  return "";
}

export function movePlaceWithinDay(places, placeId, direction) {
  const target = (places || []).find((place) => place.id === placeId);
  if (!target) return [...(places || [])];

  const sameDay = (places || [])
    .filter((place) => place.dayId === target.dayId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const fromIndex = sameDay.findIndex((place) => place.id === placeId);
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (fromIndex < 0 || toIndex < 0 || toIndex >= sameDay.length) return [...(places || [])];

  const moved = [...sameDay];
  [moved[fromIndex], moved[toIndex]] = [moved[toIndex], moved[fromIndex]];
  const rewrittenDay = moved.map((place, index) => ({ ...place, sortOrder: index + 1 }));
  const otherPlaces = (places || []).filter((place) => place.dayId !== target.dayId);
  return [...rewrittenDay, ...otherPlaces];
}
