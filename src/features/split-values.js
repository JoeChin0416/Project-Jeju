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

export function rebalanceRatioWeights(participantIds, rawValues = {}, changedId, changedValue) {
  const ids = [...new Set(participantIds ?? [])];
  if (ids.length === 0) return {};
  if (!ids.includes(changedId)) return buildDefaultRatioWeights(ids);
  if (ids.length === 1) return { [ids[0]]: 100 };

  const changedPercent = clampPercent(changedValue);
  const remainingPercent = 100 - changedPercent;
  const otherIds = ids.filter((id) => id !== changedId);
  const otherWeights = Object.fromEntries(otherIds.map((id) => [id, Math.max(0, Number(rawValues[id] || 0))]));
  const otherTotal = Object.values(otherWeights).reduce((sum, value) => sum + value, 0);
  const exactShares = otherIds.map((id) => {
    const ratio = otherTotal > 0 ? otherWeights[id] / otherTotal : 1 / otherIds.length;
    const exact = ratio * remainingPercent;
    return {
      id,
      value: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  let remainderToAllocate = remainingPercent - exactShares.reduce((sum, entry) => sum + entry.value, 0);
  [...exactShares]
    .sort((a, b) => b.remainder - a.remainder || otherIds.indexOf(a.id) - otherIds.indexOf(b.id))
    .forEach((entry) => {
      if (remainderToAllocate <= 0) return;
      entry.value += 1;
      remainderToAllocate -= 1;
    });

  return {
    [changedId]: changedPercent,
    ...Object.fromEntries(exactShares.map((entry) => [entry.id, entry.value])),
  };
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

export function readSplitValuesFromForm(form) {
  return [...form.querySelectorAll("[data-split-value]")]
    .reduce((values, input) => {
      values[input.dataset.splitValue] = input.value;
      return values;
    }, {});
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function roundPercent(value) {
  return Math.round(Number(value || 0));
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, roundPercent(value)));
}

