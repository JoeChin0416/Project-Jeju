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
  const manual = getManualSegmentEstimate(from, mode);
  if (manual) return manual;
  if (!hasCoordinates(from) || !hasCoordinates(to)) return null;

  const distanceKm = haversineKm(from, to);
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    minutes: estimateTravelMinutes(distanceKm, mode),
    mode,
    source: "coordinates",
  };
}

export function formatSegmentEstimate(estimate) {
  if (!estimate) return "未設定距離";
  const distance = Number.isFinite(Number(estimate.distanceKm)) ? `${estimate.distanceKm} km` : "距離待補";
  const minutes = Number.isFinite(Number(estimate.minutes)) ? `約 ${estimate.minutes} 分` : "時間待補";
  return `${distance} / ${minutes}`;
}

function getManualSegmentEstimate(place, mode) {
  const distanceKm = Number(place?.manualDistanceKmToNext);
  const minutes = Number(place?.manualMinutesToNext);
  const hasDistance = Number.isFinite(distanceKm) && distanceKm > 0;
  const hasMinutes = Number.isFinite(minutes) && minutes > 0;
  if (!hasDistance && !hasMinutes) return null;

  const resolvedDistance = hasDistance ? Math.round(distanceKm * 10) / 10 : null;
  return {
    distanceKm: resolvedDistance,
    minutes: hasMinutes ? Math.round(minutes) : estimateTravelMinutes(resolvedDistance, mode),
    mode,
    source: "manual",
  };
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
