export function buildSplitValues(participantIds, mode, rawValues = {}, total = 0) {
  const ids = [...new Set(participantIds ?? [])];
  if (mode === "equal" || ids.length === 0) return {};

  if (mode === "ratio") {
    const values = Object.fromEntries(ids.map((id) => [id, Math.max(0, Number(rawValues[id] || 0))]));
    const hasWeight = Object.values(values).some((value) => value > 0);
    return hasWeight ? values : Object.fromEntries(ids.map((id) => [id, 1]));
  }

  if (mode === "fixed") {
    const values = Object.fromEntries(ids.map((id) => [id, roundMoney(rawValues[id] || 0)]));
    const hasAmount = Object.values(values).some((value) => value > 0);
    if (hasAmount) return values;

    const share = roundMoney(Number(total || 0) / ids.length);
    return Object.fromEntries(ids.map((id) => [id, share]));
  }

  return {};
}

export function buildDefaultRatioWeights(participantIds) {
  const ids = [...new Set(participantIds ?? [])];
  if (ids.length === 0) return {};
  const share = roundPercent(100 / ids.length);
  return Object.fromEntries(ids.map((id) => [id, share]));
}

export function buildSplitPreview(participantIds, mode = "equal", rawValues = {}) {
  const ids = [...new Set(participantIds ?? [])];
  if (ids.length === 0) return {};

  if (mode === "ratio") {
    const weights = Object.fromEntries(ids.map((id) => [id, Math.max(0, Number(rawValues[id] || 0))]));
    const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
    const fallbackWeight = totalWeight > 0 ? totalWeight : ids.length;
    return Object.fromEntries(ids.map((id) => [id, roundPercent(((weights[id] || (totalWeight > 0 ? 0 : 1)) / fallbackWeight) * 100)]));
  }

  if (mode === "fixed") {
    const values = Object.fromEntries(ids.map((id) => [id, Math.max(0, Number(rawValues[id] || 0))]));
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    if (total > 0) return Object.fromEntries(ids.map((id) => [id, roundPercent((values[id] / total) * 100)]));
  }

  const share = roundPercent(100 / ids.length);
  return Object.fromEntries(ids.map((id) => [id, share]));
}

export function readSplitValuesFromForm(form, mode = "ratio") {
  const selector = mode === "fixed" ? "[data-split-fixed-value]" : "[data-split-ratio-value], [data-split-value]";
  return [...form.querySelectorAll(selector)]
    .reduce((values, input) => {
      const memberId = input.dataset.splitFixedValue || input.dataset.splitRatioValue || input.dataset.splitValue;
      if (memberId) values[memberId] = input.value;
      return values;
    }, {});
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function roundPercent(value) {
  return Math.round(Number(value || 0));
}
