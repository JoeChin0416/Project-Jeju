const EARTH_RADIUS_KM = 6371;

const MODE_SPEED_KMH = {
  driving: 35,
  transit: 25,
  walking: 5,
};

export function haversineKm(a, b) {
  const lat1 = toRadians(Number(a.lat));
  const lat2 = toRadians(Number(b.lat));
  const dLat = toRadians(Number(b.lat) - Number(a.lat));
  const dLng = toRadians(Number(b.lng) - Number(a.lng));

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function estimateTravelMinutes(distanceKm, mode = "driving") {
  const speed = MODE_SPEED_KMH[mode] || MODE_SPEED_KMH.driving;
  return Math.max(5, Math.round((Number(distanceKm || 0) / speed) * 60));
}

export function getSegmentEstimate(from, to, mode = "driving") {
  if (!hasCoordinates(from) || !hasCoordinates(to)) return null;
  const distanceKm = haversineKm(from, to);
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    minutes: estimateTravelMinutes(distanceKm, mode),
    mode,
  };
}

export function formatSegmentEstimate(estimate) {
  if (!estimate) return "未設定距離";
  return `${estimate.distanceKm} km / 約 ${estimate.minutes} 分`;
}

function hasCoordinates(place) {
  return place?.lat !== null &&
    place?.lat !== undefined &&
    place?.lat !== "" &&
    place?.lng !== null &&
    place?.lng !== undefined &&
    place?.lng !== "" &&
    Number.isFinite(Number(place.lat)) &&
    Number.isFinite(Number(place.lng));
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}
